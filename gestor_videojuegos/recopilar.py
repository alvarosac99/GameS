import requests
from django.core.cache import cache
from django.conf import settings

def recopilar_juegos_igdb():
    try:
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

        all_details = []
        for offset in range(0, 500000, 500):
            estado = cache.get("progreso_cache_juegos", {}).get("estado", "en progreso")
            if estado == "detenido":
                print("Proceso detenido manualmente en offset", offset)
                break

            print(f"Descargando juegos desde offset {offset}")
            query = f"""
            fields id, name, cover.url, first_release_date, genres.name;
            limit 500;
            offset {offset};
            """
            res = requests.post("https://api.igdb.com/v4/games", headers=headers, data=query.strip())
            if res.status_code != 200:
                print("Error IGDB:", res.status_code, res.text)
                break

            chunk = res.json()
            if not chunk or any(j["id"] in {g["id"] for g in all_details} for j in chunk):
                print("Fin detectado: chunk vacío o repetido")
                break

            ids_existentes = {j["id"] for j in all_details}
            nuevos = [j for j in chunk if j["id"] not in ids_existentes]
            all_details.extend(nuevos)

            # actualizar estado en cache
            cache.set("progreso_cache_juegos", {
            "estado": "en progreso",
            "offset": offset + 500,
            "total": len(all_details)
            })

        # finalizar si no fue detenido
        if cache.get("progreso_cache_juegos", {}).get("estado") != "detenido":
            cache.set("todos_los_juegos_igdb", all_details, timeout=86400)
            cache.set("progreso_cache_juegos", {
                "estado": "completado",
                "offset": offset,
                "total": len(all_details)
            })
            print("Recopilación completada: juegos guardados:", len(all_details))

    except Exception as e:
        print("Error crítico en recopilación:", e)
        cache.set("progreso_cache_juegos", {
            "estado": f"error: {str(e)}",
            "offset": 0,
            "total": 0
        })
