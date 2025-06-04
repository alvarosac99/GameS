import math
import pickle
import random
from datetime import datetime

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Avg, Count
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .utils import (
    IGDB_BASE_URL,
    DESCARGANDO_KEY,
    DESCARGANDO_COMPLETADO_KEY,
    obtener_token_igdb,
    safe_post,
    chunked,
)
from ..models import Biblioteca, Juego, Valoracion
from actividad.utils import registrar_actividad


@api_view(["GET"])
@permission_classes([AllowAny])
def listar_juegos(request):
    try:
        pagina = max(int(request.GET.get("pagina", 1)), 1)
        por_pagina = max(int(request.GET.get("por_pagina", 60)), 1)

        orden_param = request.GET.get("orden", "popular").lower()
        asc = False
        if orden_param.endswith("_asc"):
            asc = True
            orden_param = orden_param[:-4]
        orden = orden_param
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
                    fields {', '.join(fields)};
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

        if q.strip():
            terms = q.lower().split()
            juegos = [
                j
                for j in juegos
                if all(t in (j.get("name") or "").lower() for t in terms)
            ]
        for c in clauses:
            juegos = [j for j in juegos if c(j)]
        if filtro_adulto:
            juegos = [j for j in juegos if 42 not in j.get("themes", [])]

        if orden == "nombre":
            juegos = sorted(
                juegos,
                key=lambda j: j.get("name", "").lower(),
                reverse=not asc,
            )
        elif orden == "fecha":
            juegos = sorted(
                juegos,
                key=lambda j: j.get("first_release_date") or 0,
                reverse=not asc,
            )
        else:  # popularidad
            if asc:
                juegos = sorted(
                    juegos,
                    key=lambda j: (j.get("popularidad") is None, j.get("popularidad") or 0),
                )
            else:
                juegos = sorted(
                    juegos,
                    key=lambda j: (
                        j.get("popularidad") is None,
                        -(j.get("popularidad") or 0),
                    ),
                )

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


@api_view(["GET"])
@permission_classes([AllowAny])
def detalle_juego(request, id):
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


@api_view(["GET"])
@permission_classes([AllowAny])
def filtros_juegos(request):
    try:
        token = obtener_token_igdb()
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
        }

        res_gen = requests.post(
            f"{IGDB_BASE_URL}/genres",
            headers=headers,
            data="fields id,name; limit 500;",
        )
        genres = res_gen.json() if res_gen.status_code == 200 else []

        res_plat = requests.post(
            f"{IGDB_BASE_URL}/platforms",
            headers=headers,
            data="fields id,name; limit 500;",
        )
        platforms = res_plat.json() if res_plat.status_code == 200 else []

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


@api_view(["GET"])
@permission_classes([AllowAny])
def stats_bienvenida(request):
    total_usuarios = get_user_model().objects.count()
    total_bibliotecas = Biblioteca.objects.count()

    CACHE_KEY_JUEGOS_MASIVOS = "igdb_cache_juegos_masivos"
    juegos = cache.get(CACHE_KEY_JUEGOS_MASIVOS)
    if juegos:
        juegos = pickle.loads(juegos)
    else:
        juegos = []

    total_juegos = len(juegos)

    juegos_filtrados = [
        j for j in juegos if j.get("cover") and 42 not in (j.get("themes") or [])
    ]
    total_juegos_mostrados = len(juegos_filtrados)

    juegos_populares = sorted(
        [j for j in juegos_filtrados if j.get("popularidad") is not None],
        key=lambda j: -j["popularidad"],
    )[:10]

    juegos_random = (
        random.sample(juegos_filtrados, min(10, total_juegos_mostrados))
        if juegos_filtrados
        else []
    )

    def serializar(juego):
        return {
            "id": juego["id"],
            "name": juego["name"],
            "cover": juego.get("cover", {}),
            "summary": juego.get("summary", ""),
            "first_release_date": juego.get("first_release_date", None),
        }

    return Response(
        {
            "totalJuegos": total_juegos,
            "totalJuegosMostrados": total_juegos_mostrados,
            "totalUsuarios": total_usuarios,
            "totalBibliotecas": total_bibliotecas,
            "juegosPopulares": [serializar(j) for j in juegos_populares],
            "juegosRandom": [serializar(j) for j in juegos_random],
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def buscar_juego_por_id(request):
    game_id = request.GET.get("id")
    if not game_id or not str(game_id).isdigit():
        return Response(
            {"error": "Parámetro 'id' requerido y debe ser numérico."}, status=400
        )

    try:
        token = obtener_token_igdb()
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
        }
        fields = (
            "id, name, summary, cover.url, first_release_date, "
            "aggregated_rating, rating_count, genres, platforms, involved_companies.publisher, "
            "involved_companies.company, themes"
        )
        query = f"fields {fields}; where id = {game_id}; limit 1;"

        resp = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=query)
        if resp.status_code != 200:
            return Response({"error": "Error al consultar IGDB"}, status=500)
        juegos = resp.json()
        if not juegos:
            return Response({"error": "No encontrado en IGDB"}, status=404)

        return Response(juegos[0], status=200)

    except Exception as e:
        print("Error buscar_juego_por_id:", e)
        return Response({"error": str(e)}, status=500)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def buscar_en_biblioteca(request):
    q = request.GET.get("q", "").strip().lower()
    if not q:
        return Response([])

    qs = Biblioteca.objects.filter(user=request.user)
    game_ids = qs.values_list("game_id", flat=True)

    token = obtener_token_igdb()
    headers = {
        "Client-ID": settings.IGDB_CLIENT_ID,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "text/plain",
    }

    todos_juegos = []
    for batch in chunked(game_ids, 500):
        ids_str = ",".join(str(i) for i in batch)
        query = f"""
            fields id, name, cover.url;
            where id = ({ids_str}) & name ~ *"{q}"*;
            limit 100;
        """
        res = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=query)
        if res.status_code == 200:
            todos_juegos.extend(res.json())

    return Response(todos_juegos)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def valorar_juego(request, juego_id):
    juego, _ = Juego.objects.get_or_create(id=juego_id)
    usuario = request.user

    if request.method == "GET":
        valoracion = Valoracion.objects.filter(juego=juego, usuario=usuario).first()
        media = Valoracion.objects.filter(juego=juego).aggregate(
            media=Avg("valor"), total=Count("id")
        )
        return Response(
            {
                "mi_valoracion": valoracion.valor if valoracion else None,
                "media_valoracion": media["media"] or 0,
                "total_valoraciones": media["total"],
            }
        )

    elif request.method == "POST":
        valor = request.data.get("valor")
        try:
            valor = float(valor)
        except (TypeError, ValueError):
            return Response({"error": "Valor inválido."}, status=400)
        if valor < 0.5 or valor > 5 or (valor * 2) % 1 != 0:
            return Response(
                {"error": "Valor debe estar entre 1 y 5, en incrementos de 0.5."},
                status=400,
            )
        obj, _ = Valoracion.objects.update_or_create(
            usuario=usuario, juego=juego, defaults={"valor": valor}
        )
        media = Valoracion.objects.filter(juego=juego).aggregate(
            media=Avg("valor"), total=Count("id")
        )
        registrar_actividad(
            usuario, "juego_valorado", f"Valoró *{juego_id}* con {valor} estrellas"
        )
        return Response(
            {
                "ok": True,
                "mi_valoracion": obj.valor,
                "media_valoracion": media["media"] or 0,
                "total_valoraciones": media["total"],
            }
        )
