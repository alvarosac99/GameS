import requests
from collections import defaultdict
from django.core.cache import cache
from django.conf import settings
from utils.http import safe_post

def recopilar_juegos_igdb(popularity_type=1):
    """
    Descarga todos los juegos de IGDB, guarda popularidad, controla rate limit y es reanudable.
    """
    try:
        # 1. Autenticación IGDB
        token = cache.get("igdb_token")
        if not token:
            auth = requests.post(
                "https://id.twitch.tv/oauth2/token",
                data={
                    "client_id": settings.IGDB_CLIENT_ID,
                    "client_secret": settings.IGDB_CLIENT_SECRET,
                    "grant_type": "client_credentials",
                },
            )
            auth.raise_for_status()
            auth_data = auth.json()
            token = auth_data["access_token"]
            cache.set("igdb_token", token, timeout=auth_data.get("expires_in", 3600))

        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
        }

        batch = 500
        juegos = []
        seen_ids = set()
        popularidad_por_juego = defaultdict(dict)

        # --- FASE 1: Popularidad (puede tener muchos más de 100k registros)
        offset_pop = cache.get("progreso_popularidad_offset", 0)
        print(f"Descargando popularidad desde offset {offset_pop} (reanuda si se cortó)...")
        while True:
            cache.set("progreso_cache_juegos", {
                "estado": "en progreso",
                "fase": "Descargando popularidad de todos los juegos",
                "offset": offset_pop,
                "total": len(popularidad_por_juego)
            }, timeout=86400)

            cuerpo = f"""
                fields game_id,value,popularity_type;
                sort game_id asc;
                limit {batch};
                offset {offset_pop};
            """
            r = safe_post("https://api.igdb.com/v4/popularity_primitives", headers, cuerpo.strip())
            bloque = r.json()
            if not bloque:
                print(f"Fin de popularidad en offset {offset_pop}")
                break
            for pop in bloque:
                gid = pop["game_id"]
                tipo = pop["popularity_type"]
                valor = pop["value"]
                popularidad_por_juego[gid][tipo] = valor
            offset_pop += batch
            print(f"Popularidad: extraídos hasta offset {offset_pop} (juegos con popularidad: {len(popularidad_por_juego)})")
            cache.set("progreso_popularidad_offset", offset_pop, timeout=86400)
            if len(bloque) < batch:
                break

        # Guarda popularidad en caché por si reanudas
        cache.set("popularidad_por_juego", dict(popularidad_por_juego), timeout=86400)

        # --- FASE 2: Todos los juegos
        juegos = cache.get("todos_los_juegos_igdb", [])
        seen_ids = set(j["id"] for j in juegos)
        offset_juegos = cache.get("progreso_juegos_offset", 0)
        print(f"Descargando detalles desde offset {offset_juegos} (reanuda si se cortó)...")
        while True:
            cache.set("progreso_cache_juegos", {
                "estado": "en progreso",
                "fase": "Descargando detalles y uniendo popularidad",
                "offset": offset_juegos,
                "total": len(juegos)
            }, timeout=86400)

            query = f"""
                fields id,name,cover.url,first_release_date,genres.name, themes.name;
                where cover.url != null
                  & first_release_date != null;
                sort id asc;
                limit {batch};
                offset {offset_juegos};
            """
            resp = safe_post("https://api.igdb.com/v4/games", headers, query.strip())
            chunk = resp.json()
            if not chunk:
                print(f"Fin de todos los juegos en offset {offset_juegos}")
                break

            nuevos = 0
            for juego in chunk:
                if juego["id"] not in seen_ids:
                    seen_ids.add(juego["id"])
                    juego["popularidad"] = popularidad_por_juego.get(juego["id"], {})
                    juegos.append(juego)
                    nuevos += 1

            offset_juegos += batch
            print(f"Juegos: Procesados hasta offset {offset_juegos} (total: {len(juegos)})")
            cache.set("progreso_juegos_offset", offset_juegos, timeout=86400)
            cache.set("todos_los_juegos_igdb", juegos, timeout=86400)

            if len(chunk) < batch:
                break

        # Fase final: completado y limpiar offsets de reanudación
        cache.set("todos_los_juegos_igdb", juegos, timeout=86400)
        cache.set("progreso_cache_juegos", {
            "estado": "completado",
            "fase": "Completado",
            "offset": offset_juegos,
            "total": len(juegos)
        }, timeout=86400)
        cache.delete("progreso_popularidad_offset")
        cache.delete("progreso_juegos_offset")
        print(f"Recopilación completada: {len(juegos)} juegos (con popularidad guardada)")

    except Exception as e:
        print("Error en recopilación por popularidad:", e)
        cache.set("progreso_cache_juegos", {
            "estado": f"error: {e}",
            "fase": "error",
            "offset": 0,
            "total": 0
        }, timeout=86400)
