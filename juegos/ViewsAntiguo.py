import requests
import math
from collections import defaultdict
from django.conf import settings
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def listar_juegos(request):
    try:
        page = int(request.GET.get("page", 1))
        per_page = int(request.GET.get("per_page", 60))
        orden = request.GET.get("orden", "popular")
        q = request.GET.get("q", "").strip().lower()

        # Autenticación IGDB
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

        # Si existe cache global, se usa
        all_details = cache.get("todos_los_juegos_igdb")
        if not all_details:
            print("[INFO] Cache global no encontrada. Usando top_ids como fallback.")

            # calcular top_ids si no existe
            top_ids = cache.get("top_juegos_ids")
            if not top_ids:
                all_popularity = []
                for offset in range(0, 25000, 500):
                    query = f"""
                    fields game_id, value, popularity_type;
                    where popularity_type = (2,3);
                    limit 500;
                    offset {offset};
                    """
                    try:
                        res = requests.post(
                            "https://api.igdb.com/v4/popularity_primitives",
                            headers=headers,
                            data=query.strip(),
                        )
                        if res.status_code != 200:
                            break
                        chunk = res.json()
                        if not chunk:
                            break
                        all_popularity.extend(chunk)
                    except Exception as e:
                        print("Error al consultar popularity_primitives:", e)
                        break

                puntuaciones = defaultdict(lambda: {"v2": 0, "v3": 0})
                for item in all_popularity:
                    gid = item["game_id"]
                    tipo = item["popularity_type"]
                    if tipo == 2:
                        puntuaciones[gid]["v2"] += item["value"]
                    elif tipo == 3:
                        puntuaciones[gid]["v3"] += item["value"]

                top_ids = sorted(
                    puntuaciones.items(),
                    key=lambda x: 0.6 * x[1]["v2"] + 0.4 * x[1]["v3"],
                    reverse=True,
                )
                cache.set("top_juegos_ids", top_ids, timeout=86400)

            game_ids = [str(gid) for gid, _ in top_ids]

            all_details = cache.get("juegos_detalles_completos")
            if not all_details:
                all_details = []
                for i in range(0, len(game_ids), 500):
                    id_string = ",".join(game_ids[i : i + 500])
                    game_query = f"""
                    fields id, name, cover.url, first_release_date, genres.name;
                    where id = ({id_string});
                    limit 500;
                    """
                    res = requests.post(
                        "https://api.igdb.com/v4/games", headers=headers, data=game_query
                    )
                    if res.status_code != 200:
                        continue
                    all_details.extend(res.json())
                cache.set("juegos_detalles_completos", all_details, timeout=86400)

        # Búsqueda por nombre
        if q:
            all_details = [j for j in all_details if q in j.get("name", "").lower()]

        # Ordenamiento
        if orden == "nombre":
            all_details.sort(key=lambda g: g.get("name", "").lower())
        elif orden == "fecha":
            all_details.sort(key=lambda g: g.get("first_release_date", 0), reverse=True)
        else:
            top_ids = cache.get("top_juegos_ids") or []
            id_pos = {str(gid): i for i, (gid, _) in enumerate(top_ids)}
            all_details.sort(key=lambda g: id_pos.get(str(g.get("id")), len(all_details)))

        # Paginación
        total = len(all_details)
        paginas_totales = math.ceil(total / per_page)
        start = (page - 1) * per_page
        end = min(start + per_page, total)
        juegos = all_details[start:end]

        return Response(
            {
                "juegos": juegos,
                "pagina_actual": page,
                "paginas_totales": paginas_totales,
            }
        )

    except Exception as e:
        print(f"Error en listar_juegos: {e}")
        return Response({"error": "Error interno del servidor"}, status=500)
    
@api_view(["GET"])
@permission_classes([AllowAny])
def detalle_juego(request, id):
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

        query = f"""
        fields id, name, summary, first_release_date, screenshots.url,
        platforms.name, involved_companies.company.name, involved_companies.developer,
        involved_companies.publisher, cover.url;
        where id = {id};
        """
        res = requests.post("https://api.igdb.com/v4/games", headers=headers, data=query.strip())
        if res.status_code != 200:
            print("IGDB ERROR:", res.status_code, res.text)
            return Response({"error": "Error al obtener datos del juego desde IGDB"}, status=500)

        data = res.json()
        if not data:
            return Response({"error": "Juego no encontrado"}, status=404)

        return Response(data[0])

    except Exception as e:
        print("Error en detalle_juego:", e)
        return Response({"error": "Error interno del servidor"}, status=500)


