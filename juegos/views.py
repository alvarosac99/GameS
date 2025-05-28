import math
import requests
from django.conf import settings
from django.core.cache import cache

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Biblioteca
from .serializers import BibliotecaSerializer

import hashlib
import pickle
import time


# ------------------- SAFE POST -------------------
def safe_post(url, headers, data, max_retries=10):
    retries = 0
    while retries < max_retries:
        resp = requests.post(url, headers=headers, data=data)
        if resp.status_code == 429:
            wait = int(resp.headers.get("Retry-After", 30))
            print(
                f"[IGDB] 429 Too Many Requests. Esperando {wait} segundos antes de reintentar..."
            )
            time.sleep(wait)
            retries += 1
            continue
        try:
            resp.raise_for_status()
            return resp
        except requests.HTTPError as e:
            print(f"[IGDB] Error: {e} - Intento {retries + 1}/{max_retries}")
            time.sleep(3 * (retries + 1))
            retries += 1
    raise Exception(f"Demasiados intentos fallidos ({max_retries}) con IGDB.")


DESCARGANDO_KEY = "igdb_descargando_todo"
IGDB_BASE_URL = "https://api.igdb.com/v4"


def obtener_token_igdb():
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
        data = auth.json()
        token = data["access_token"]
        cache.set("igdb_token", token, timeout=data.get("expires_in", 3600))
    return token


@api_view(["GET"])
@permission_classes([AllowAny])
def listar_juegos(request):
    """
    Lista juegos de IGDB con filtro adulto opcional:
    """
    try:
        pagina = max(int(request.GET.get("pagina", 1)), 1)
        por_pagina = max(int(request.GET.get("por_pagina", 60)), 1)
        orden = request.GET.get("orden", "popular")
        q = request.GET.get("q", "")
        genero = request.GET.get("genero")
        plataforma = request.GET.get("plataforma")
        publisher = request.GET.get("publisher")

        # --------------------- FILTRO ADULTO ---------------------
        filtro_adulto_param = request.GET.get("filtro_adulto")
        filtro_adulto = True  # Por defecto, siempre filtra para anónimos
        if request.user.is_authenticated and filtro_adulto_param is not None:
            filtro_adulto = filtro_adulto_param in ["1", "true", "True", True]
        # ---------------------------------------------------------

        # Construcción de cláusulas
        clauses = []
        if genero:
            clauses.append(f"genres = ({genero})")
        if plataforma:
            clauses.append(f"platforms = ({plataforma})")
        if publisher:
            clauses.append(
                "involved_companies.publisher = true "
                f"& involved_companies.company = ({publisher})"
            )
        if filtro_adulto:
            clauses.append("themes != (42)")

        where_part = f"where {' & '.join(clauses)};" if clauses else ""
        search_part = f'search "{q.strip()}";' if q.strip() else ""

        token = obtener_token_igdb()
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
        }
        fields = [
            "id",
            "name",
            "summary",
            "cover.url",
            "first_release_date",
            "aggregated_rating",
            "rating_count",
            "genres",
            "platforms",
            "involved_companies.publisher",
            "involved_companies.company",
        ]

        cache_key = (
            "igdb_cache_"
            + hashlib.sha1((search_part + where_part + orden).encode()).hexdigest()
        )

        descargar_todo = not q or q.strip() == ""

        if orden == "popular" and descargar_todo:
            if cache.get(DESCARGANDO_KEY):
                return Response(
                    {
                        "error": "descargando",
                        "message": "Estamos recopilando los datos de IGDB. Por favor, espera unos segundos y vuelve a intentarlo.",
                        "descargando": True,
                    },
                    status=status.HTTP_202_ACCEPTED,
                )
            cache.set(DESCARGANDO_KEY, True, timeout=300)  # 5 min

            try:
                juegos_cache = cache.get(cache_key)
                if juegos_cache:
                    print(f"\n-- Cargando datos masivos de la caché: {cache_key} --")
                    juegos = pickle.loads(juegos_cache)
                    cache.delete(DESCARGANDO_KEY)
                else:
                    print("\n-- Cache miss, descargando TODO IGDB, paciencia! --")
                    juegos, ids = [], []
                    offset_loop = 0
                    while True:
                        partes = [
                            where_part,
                            f"fields {', '.join(fields)};",
                            "sort popularity desc;",
                            f"limit 500;",
                            f"offset {offset_loop};",
                        ]
                        games_query = " ".join(p for p in partes if p)
                        # -------- SAFE_POST aquí ----------
                        res = safe_post(f"{IGDB_BASE_URL}/games", headers, games_query)
                        chunk = res.json()
                        if not chunk:
                            break
                        juegos.extend(chunk)
                        ids.extend([j["id"] for j in chunk])
                        offset_loop += 500
                        print(f"Recopilados: {len(juegos)}")
                        if len(chunk) < 500:
                            break

                    print(f"Total juegos recogidos: {len(juegos)}")
                    # Cruzar con popularidad real
                    popularidad_map = {}
                    for i in range(0, len(ids), 500):
                        pop_query = f"fields game_id,value; where game_id = ({','.join(str(x) for x in ids[i:i+500])}) & popularity_type = 1;"
                        pop_res = safe_post(
                            f"{IGDB_BASE_URL}/popularity_primitives", headers, pop_query
                        )
                        if pop_res.status_code == 200:
                            pop_data = pop_res.json()
                            popularidad_map.update(
                                {p["game_id"]: p["value"] for p in pop_data}
                            )

                    for juego in juegos:
                        juego["popularidad"] = popularidad_map.get(juego["id"], None)
                    juegos = sorted(
                        juegos,
                        key=lambda j: (
                            j["popularidad"] is None,
                            -(j["popularidad"] or 0),
                        ),
                    )
                    cache.set(cache_key, pickle.dumps(juegos), timeout=12 * 3600)
                    cache.delete(DESCARGANDO_KEY)

                offset = (pagina - 1) * por_pagina
                juegos_pagina = juegos[offset : offset + por_pagina]
                return Response(
                    {
                        "juegos": juegos_pagina,
                        "total_resultados": len(juegos),
                        "pagina_actual": pagina,
                        "paginas_totales": math.ceil(len(juegos) / por_pagina),
                    },
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                cache.delete(DESCARGANDO_KEY)
                print("Error en descarga masiva IGDB:", e)
                return Response(
                    {
                        "error": "descarga_masiva",
                        "message": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        # Caso normal: búsqueda con texto o filtro + popularidad
        if orden == "popular" and (q or genero or plataforma or publisher):
            juegos_cache = cache.get(cache_key)
            if juegos_cache:
                juegos = pickle.loads(juegos_cache)
            else:
                juegos, ids = [], []
                offset_loop = 0
                while True:
                    partes = [
                        search_part,
                        where_part,
                        f"fields {', '.join(fields)};",
                        f"limit 500;",
                        f"offset {offset_loop};",
                    ]
                    games_query = " ".join(p for p in partes if p)
                    res = safe_post(f"{IGDB_BASE_URL}/games", headers, games_query)
                    chunk = res.json()
                    if not chunk:
                        break
                    juegos.extend(chunk)
                    ids.extend([j["id"] for j in chunk])
                    offset_loop += 500
                    if len(chunk) < 500:
                        break

                popularidad_map = {}
                for i in range(0, len(ids), 500):
                    pop_query = f"fields game_id,value; where game_id = ({','.join(str(x) for x in ids[i:i+500])}) & popularity_type = 1;"
                    pop_res = safe_post(
                        f"{IGDB_BASE_URL}/popularity_primitives", headers, pop_query
                    )
                    if pop_res.status_code == 200:
                        pop_data = pop_res.json()
                        popularidad_map.update(
                            {p["game_id"]: p["value"] for p in pop_data}
                        )
                for juego in juegos:
                    juego["popularidad"] = popularidad_map.get(juego["id"], None)
                juegos = sorted(
                    juegos,
                    key=lambda j: (j["popularidad"] is None, -(j["popularidad"] or 0)),
                )
                cache.set(cache_key, pickle.dumps(juegos), timeout=12 * 3600)

            offset = (pagina - 1) * por_pagina
            juegos_pagina = juegos[offset : offset + por_pagina]
            return Response(
                {
                    "juegos": juegos_pagina,
                    "total_resultados": len(juegos),
                    "pagina_actual": pagina,
                    "paginas_totales": math.ceil(len(juegos) / por_pagina),
                },
                status=status.HTTP_200_OK,
            )

        # Orden "normal" o texto/filtros normales (paginar IGDB)
        count_query = " ".join(p for p in (search_part, where_part, "count;") if p)
        res_count = safe_post(f"{IGDB_BASE_URL}/games/count", headers, count_query)
        total = int(res_count.json().get("count", 0))
        paginas_totales = math.ceil(total / por_pagina) if total else 0

        # Orden IGDB (solo en queries filtradas, no por texto)
        sort_part = ""
        if orden == "nombre":
            sort_part = "sort name asc;"
        elif orden == "fecha":
            sort_part = "sort first_release_date desc;"
        else:
            sort_part = "sort popularity desc;"

        offset = (pagina - 1) * por_pagina
        partes = [
            search_part,
            where_part,
            f"fields {', '.join(fields)};",
            sort_part,
            f"limit {por_pagina};",
            f"offset {offset};",
        ]
        games_query = " ".join(p for p in partes if p)
        res = safe_post(f"{IGDB_BASE_URL}/games", headers, games_query)
        juegos = res.json()
        juegos_ids = [str(j["id"]) for j in juegos]
        popularidad_map = {}
        if juegos_ids:
            pop_query = f"fields game_id,value; where game_id = ({','.join(juegos_ids)}) & popularity_type = 1;"
            pop_res = safe_post(
                f"{IGDB_BASE_URL}/popularity_primitives", headers, pop_query
            )
            if pop_res.status_code == 200:
                pop_data = pop_res.json()
                popularidad_map = {p["game_id"]: p["value"] for p in pop_data}
        for juego in juegos:
            juego["popularidad"] = popularidad_map.get(juego["id"], None)

        return Response(
            {
                "juegos": juegos,
                "total_resultados": total,
                "pagina_actual": pagina,
                "paginas_totales": paginas_totales,
            },
            status=status.HTTP_200_OK,
        )

    except requests.exceptions.HTTPError:
        print("HTTPError al consultar IGDB")
        return Response(
            {
                "juegos": [],
                "total_resultados": 0,
                "pagina_actual": 1,
                "paginas_totales": 1,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        print("Excepción en listar_juegos:", e)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def chunked(iterable, size):
    for i in range(0, len(iterable), size):
        yield iterable[i : i + size]


@api_view(["GET"])
@permission_classes([AllowAny])
def detalle_juego(request, id):
    """
    Recupera todos los datos de un juego por su ID desde IGDB, incluyendo idiomas.
    """
    try:
        token = obtener_token_igdb()
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
        }

        query = f"""
            fields id, name, summary, storyline, first_release_date, cover.url,
                   screenshots.url, platforms.name, genres.name,
                   involved_companies.company.name, involved_companies.developer,
                   involved_companies.publisher, videos.video_id,
                   aggregated_rating, rating_count, collection.name,
                   age_ratings.rating, themes.name, game_modes.name,
                   player_perspectives.name, websites.url, websites.category,
                   similar_games.name, similar_games.cover.url,
                   language_supports;
            where id = {id};
        """
        res = requests.post(
            f"{IGDB_BASE_URL}/games", headers=headers, data=query.strip()
        )
        if res.status_code != 200:
            return Response(
                {"error": "Error al obtener datos del juego desde IGDB"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        data = res.json()
        if not data:
            return Response(
                {"error": "Juego no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        juego = data[0]

        # Idiomas
        language_ids = juego.get("language_supports", [])
        idiomas = []
        if language_ids:
            ids_str = ",".join(str(i) for i in language_ids)
            q_ids = f"fields language.name,language.native_name; where id=({ids_str});"
            res_ids = requests.post(
                f"{IGDB_BASE_URL}/language_support", headers=headers, data=q_ids
            )
            if res_ids.status_code == 200:
                for l in res_ids.json():
                    lang = l.get("language") or {}
                    name = lang.get("name") or lang.get("native_name")
                    if name:
                        idiomas.append(name)
        juego["idiomas"] = idiomas
        return Response(juego, status=status.HTTP_200_OK)

    except Exception as e:
        print("Error en detalle_juego:", e)
        return Response(
            {"error": "Error interno del servidor"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class BibliotecaViewSet(viewsets.ModelViewSet):
    serializer_class = BibliotecaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Biblioteca.objects.filter(user=self.request.user)
        game_id = self.request.query_params.get("game_id")
        if game_id:
            qs = qs.filter(game_id=game_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        if request.query_params.get("game_id"):
            serializer = self.get_serializer(self.get_queryset(), many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        qs = self.get_queryset()
        game_ids = [b.game_id for b in qs]
        if not game_ids:
            return Response({"juegos": []}, status=status.HTTP_200_OK)

        token = obtener_token_igdb()
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
        }

        todos_juegos = []
        campos = (
            "id, name, summary, cover.url, first_release_date, "
            "screenshots.url, platforms.name, genres.name, "
            "aggregated_rating, rating_count, websites.url, websites.category"
        )
        for batch in chunked(game_ids, 500):
            ids_str = ",".join(str(i) for i in batch)
            q_str = f"fields {campos}; where id = ({ids_str});"
            res = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=q_str)
            if res.status_code == 200:
                todos_juegos.extend(res.json())

        return Response({"juegos": todos_juegos}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def filtros_juegos(request):
    """
    Devuelve listas de géneros, plataformas y publishers para poblar filtros en el front.
    """
    try:
        token = obtener_token_igdb()
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
        }

        # Géneros
        res_gen = requests.post(
            f"{IGDB_BASE_URL}/genres",
            headers=headers,
            data="fields id,name; limit 500;",
        )
        genres = res_gen.json() if res_gen.status_code == 200 else []

        # Plataformas
        res_plat = requests.post(
            f"{IGDB_BASE_URL}/platforms",
            headers=headers,
            data="fields id,name; limit 500;",
        )
        platforms = res_plat.json() if res_plat.status_code == 200 else []

        # Publishers
        res_pub = requests.post(
            f"{IGDB_BASE_URL}/companies",
            headers=headers,
            data="fields id,name; where published = true; limit 500;",
        )
        publishers = res_pub.json() if res_pub.status_code == 200 else []

        return Response(
            {
                "genres": genres,
                "platforms": platforms,
                "publishers": publishers,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        print("Error en filtros_juegos:", e)
        return Response(
            {"error": "No se pudieron cargar los filtros."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
