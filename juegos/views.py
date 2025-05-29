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
from datetime import datetime

import hashlib
import pickle
import time

from requests.exceptions import SSLError


# Función segura para peticiones POST con manejo de errores y reintentos
def safe_post(url, headers, data, max_retries=10):
    retries = 0
    while retries < max_retries:
        try:
            print(f"[IGDB] POST {url}\n{data}")
            resp = requests.post(url, headers=headers, data=data)
            if resp.status_code == 429:
                wait = int(resp.headers.get("Retry-After", 30))
                print(f"[IGDB] 429 Too Many Requests. Esperando {wait} segundos...")
                time.sleep(wait)
                retries += 1
                continue
            resp.raise_for_status()
            return resp
        except SSLError as ssl_err:
            print(f"[IGDB] Error SSL: {ssl_err} - Reintentando...")
            time.sleep(3 * (retries + 1))
            retries += 1
        except requests.HTTPError as e:
            print(f"[IGDB] Error HTTP: {e} - Intento {retries + 1}/{max_retries}")
            print(f"[IGDB] Body: {resp.text}")
            time.sleep(3 * (retries + 1))
            retries += 1
    raise Exception(f"Demasiados intentos fallidos ({max_retries}) con IGDB.")


IGDB_BASE_URL = "https://api.igdb.com/v4"
DESCARGANDO_KEY = "igdb_descargando_todo"
DESCARGANDO_COMPLETADO_KEY = "igdb_descarga_completa"


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
    try:
        pagina = max(int(request.GET.get("pagina", 1)), 1)
        por_pagina = max(int(request.GET.get("por_pagina", 60)), 1)

        orden = request.GET.get("orden", "popular")
        q = request.GET.get("q", "")
        genero = request.GET.get("genero")
        plataforma = request.GET.get("plataforma")
        publisher = request.GET.get("publisher")

        filtro_adulto_param = request.GET.get("adult")
        filtro_adulto = True
        if request.user.is_authenticated and filtro_adulto_param is not None:
            filtro_adulto = filtro_adulto_param in ["1", "true", "True", True]

        clauses = []
        if genero:
            clauses.append(lambda j: genero in map(str, j.get("genres", [])))
        if plataforma:
            clauses.append(lambda j: plataforma in map(str, j.get("platforms", [])))
        if publisher:
            clauses.append(
                lambda j: any(
                    c.get("publisher") and str(c.get("company")) == publisher
                    for c in j.get("involved_companies", [])
                )
            )

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
            "themes",
        ]

        CACHE_KEY_JUEGOS_MASIVOS = "igdb_cache_juegos_masivos"

        juegos = cache.get(CACHE_KEY_JUEGOS_MASIVOS)
        if juegos:
            juegos = pickle.loads(juegos)
        else:
            if cache.get(DESCARGANDO_KEY) and not cache.get(DESCARGANDO_COMPLETADO_KEY):
                return Response(
                    {
                        "error": "descargando",
                        "message": "Estamos recopilando los datos de IGDB. Por favor, espera unos segundos y vuelve a intentarlo.",
                        "descargando": True,
                    },
                    status=status.HTTP_202_ACCEPTED,
                )

            cache.set(
                DESCARGANDO_KEY,
                {"estado": True, "inicio": datetime.utcnow().isoformat()},
                timeout=None,
            )

            juegos, ids = [], []
            offset_loop = 0
            while True:
                query = f"""
                    fields {", ".join(fields)};
                    sort popularity desc;
                    limit 500;
                    offset {offset_loop};
                """
                res = safe_post(f"{IGDB_BASE_URL}/games", headers, query)
                chunk = res.json()
                if not chunk:
                    break
                juegos.extend(chunk)
                ids.extend([j["id"] for j in chunk])
                offset_loop += 500
                if len(chunk) < 500:
                    break

            # Popularidad (relevancia) separada
            popularidad_map = {}
            for i in range(0, len(ids), 500):
                pop_query = f"fields game_id,value; where game_id = ({','.join(str(x) for x in ids[i:i+500])}) & popularity_type = 1;"
                pop_res = safe_post(
                    f"{IGDB_BASE_URL}/popularity_primitives", headers, pop_query
                )
                if pop_res.status_code == 200:
                    pop_data = pop_res.json()
                    popularidad_map.update({p["game_id"]: p["value"] for p in pop_data})
            for juego in juegos:
                juego["popularidad"] = popularidad_map.get(juego["id"], None)

            juegos = sorted(
                juegos,
                key=lambda j: (
                    j.get("popularidad") is None,
                    -(j.get("popularidad") or 0),
                ),
            )
            cache.set(CACHE_KEY_JUEGOS_MASIVOS, pickle.dumps(juegos), timeout=24 * 3600)
            cache.set(DESCARGANDO_COMPLETADO_KEY, True, timeout=24 * 3600)
            cache.delete(DESCARGANDO_KEY)

        total_sin_filtrar = len(juegos)

        # FILTRADO
        if q.strip():
            juegos = [j for j in juegos if q.lower() in j.get("name", "").lower()]
        for c in clauses:
            juegos = [j for j in juegos if c(j)]
        if filtro_adulto:
            juegos = [j for j in juegos if 42 not in j.get("themes", [])]

        # ORDENACIÓN
        if orden == "nombre":
            juegos = sorted(juegos, key=lambda j: j.get("name", "").lower())
        elif orden == "fecha":
            juegos = sorted(juegos, key=lambda j: -(j.get("first_release_date") or 0))
        else:  # popularidad ya aplicada durante la carga
            pass

        # PAGINACIÓN
        total_filtrado = len(juegos)
        ocultos = total_sin_filtrar - total_filtrado
        offset = (pagina - 1) * por_pagina
        juegos_pagina = juegos[offset : offset + por_pagina]

        return Response(
            {
                "juegos": juegos_pagina,
                "total_resultados": total_filtrado,
                "total_sin_filtrar": total_sin_filtrar,
                "ocultos": ocultos,
                "pagina_actual": pagina,
                "paginas_totales": math.ceil(total_filtrado / por_pagina),
            },
            status=status.HTTP_200_OK,
        )

    except requests.exceptions.HTTPError:
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
        qs = self.get_queryset()
        total = qs.count()

        game_id = request.query_params.get("game_id")
        if game_id:
            # Si estás buscando por game_id, responde con un array plano
            serializer = self.get_serializer(qs, many=True)
            return Response(serializer.data)

        # Paginar normalmente si no hay filtro game_id
        try:
            pagina = max(int(request.GET.get("pagina", 1)), 1)
            por_pagina = max(int(request.GET.get("por_pagina", 60)), 1)
            print(
                f"[BIBLIO][DEBUG] GET params => pagina={pagina}, por_pagina={por_pagina}"
            )

        except Exception:
            pagina, por_pagina = 1, 60

        offset = (pagina - 1) * por_pagina
        paginados = qs[offset : offset + por_pagina]

        print(
            f"[BIBLIO] total={total} pagina={pagina} por_pagina={por_pagina} offset={offset}"
        )
        print(f"[BIBLIO] juegos en esta página: {[b.game_id for b in paginados]}")

        game_ids = [b.game_id for b in paginados]
        if not game_ids:
            return Response(
                {
                    "juegos": [],
                    "pagina_actual": pagina,
                    "paginas_totales": 1,
                    "total_resultados": 0,
                }
            )

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
            q_str = f"fields {campos}; where id = ({ids_str}); limit {len(batch)};"
            res = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=q_str)
            if res.status_code == 200:
                todos_juegos.extend(res.json())
            else:
                print(f"[IGDB] Error al obtener datos de juegos: {res.text}")

        print(f"[BIBLIO] juegos devueltos: {len(todos_juegos)}")

        return Response(
            {
                "juegos": todos_juegos,
                "pagina_actual": pagina,
                "paginas_totales": math.ceil(total / por_pagina),
                "total_resultados": total,
            }
        )


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
