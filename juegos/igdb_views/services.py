"""Servicios auxiliares para interactuar con IGDB y la caché local."""

import pickle
import random

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache

from .utils import (
    IGDB_BASE_URL,
    DESCARGANDO_KEY,
    obtener_token_igdb,
    chunked,
)
from django.db.models import Avg, Count
from collections import Counter
from ..models import Biblioteca, Juego, Valoracion
from actividad.utils import registrar_actividad


# ---------------------------------------------------------------------------
# Utilidades IGDB
# ---------------------------------------------------------------------------

def _headers():
    token = obtener_token_igdb()
    return {
        "Client-ID": settings.IGDB_CLIENT_ID,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "text/plain",
    }


def cargar_cache_juegos():
    """Devuelve la lista de juegos almacenada en caché."""
    datos = cache.get("igdb_cache_juegos_masivos")
    if datos:
        return pickle.loads(datos)
    if cache.get(DESCARGANDO_KEY):
        return None  # señal de que está descargando
    return []


def filtrar_y_ordenar(juegos, q="", genero=None, plataforma=None, publisher=None,
                       filtro_adulto=True, orden="popular", asc=False):
    """Filtra y ordena una lista de juegos seg\u00fan distintos criterios."""
    if q.strip():
        terms = q.lower().split()
        juegos = [j for j in juegos if all(t in (j.get("name") or "").lower() for t in terms)]
    if genero:
        juegos = [j for j in juegos if genero in map(str, j.get("genres", []))]
    if plataforma:
        juegos = [j for j in juegos if plataforma in map(str, j.get("platforms", []))]
    if publisher:
        juegos = [
            j for j in juegos
            if any(c.get("publisher") and str(c.get("company")) == publisher
                   for c in j.get("involved_companies", []))
        ]
    if filtro_adulto:
        juegos = [j for j in juegos if 42 not in j.get("themes", [])]

    if orden == "nombre":
        juegos.sort(key=lambda j: j.get("name", "").lower(), reverse=not asc)
    elif orden == "fecha":
        juegos.sort(key=lambda j: j.get("first_release_date") or 0, reverse=not asc)
    else:  # popularidad
        juegos.sort(
            key=lambda j: (
                j.get("popularidad") is None,
                j.get("popularidad") if asc else -(j.get("popularidad") or 0),
            )
        )
    return juegos


def obtener_detalle_juego(juego_id):
    """Recupera información detallada de IGDB para un juego."""
    headers = _headers()
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
        where id = {juego_id};
    """
    res = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=query.strip())
    res.raise_for_status()
    data = res.json()
    if not data:
        return None

    juego = data[0]
    language_ids = juego.get("language_supports", [])
    idiomas = []
    if language_ids:
        ids_str = ",".join(str(i) for i in language_ids)
        q_ids = f"fields language.name,language.native_name; where id=({ids_str});"
        res_ids = requests.post(f"{IGDB_BASE_URL}/language_support", headers=headers, data=q_ids)
        if res_ids.status_code == 200:
            for l in res_ids.json():
                lang = l.get("language") or {}
                name = lang.get("name") or lang.get("native_name")
                if name:
                    idiomas.append(name)
    juego["idiomas"] = idiomas
    return juego


def obtener_filtros():
    """Solicita a IGDB las opciones de filtro disponibles."""
    headers = _headers()
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

    return {
        "genres": genres,
        "platforms": platforms,
        "publishers": publishers,
    }


def calcular_stats_bienvenida():
    """Estadísticas resumidas para mostrar en la pantalla de inicio."""
    usuarios = get_user_model().objects.count()
    bibliotecas = Biblioteca.objects.count()

    juegos = cargar_cache_juegos() or []
    total = len(juegos)

    juegos_filtrados = [
        j for j in juegos if j.get("cover") and 42 not in (j.get("themes") or [])
    ]
    total_mostrados = len(juegos_filtrados)

    populares = sorted(
        [j for j in juegos_filtrados if j.get("popularidad") is not None],
        key=lambda j: -j["popularidad"],
    )[:10]

    random_juegos = (
        random.sample(juegos_filtrados, min(10, total_mostrados))
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

    return {
        "totalJuegos": total,
        "totalJuegosMostrados": total_mostrados,
        "totalUsuarios": usuarios,
        "totalBibliotecas": bibliotecas,
        "juegosPopulares": [serializar(j) for j in populares],
        "juegosRandom": [serializar(j) for j in random_juegos],
    }


def buscar_juego_por_id_igdb(game_id):
    """Busca un juego por ID haciendo una consulta directa a IGDB."""
    headers = _headers()
    fields = (
        "id, name, summary, cover.url, first_release_date, "
        "aggregated_rating, rating_count, genres, platforms, involved_companies.publisher, "
        "involved_companies.company, themes"
    )
    query = f"fields {fields}; where id = {game_id}; limit 1;"

    resp = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=query)
    resp.raise_for_status()
    juegos = resp.json()
    return juegos[0] if juegos else None


def buscar_en_biblioteca_igdb(q, user):
    """Busca juegos en la biblioteca del usuario coincidiendo con un texto."""
    qs = Biblioteca.objects.filter(user=user)
    game_ids = qs.values_list("game_id", flat=True)

    headers = _headers()
    resultados = []
    for batch in chunked(game_ids, 500):
        ids_str = ",".join(str(i) for i in batch)
        query = f"""
            fields id, name, cover.url;
            where id = ({ids_str}) & name ~ *"{q}"*;
            limit 100;
        """
        res = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=query)
        if res.status_code == 200:
            resultados.extend(res.json())
    return resultados


def valorar_juego_service(juego_id, usuario, valor=None):
    """Registra o devuelve la valoraci\u00f3n de un usuario sobre un juego."""
    juego, _ = Juego.objects.get_or_create(id=juego_id)
    if valor is None:
        valoracion = Valoracion.objects.filter(juego=juego, usuario=usuario).first()
        media = Valoracion.objects.filter(juego=juego).aggregate(media=Avg("valor"), total=Count("id"))
        return {
            "mi_valoracion": valoracion.valor if valoracion else None,
            "media_valoracion": media["media"] or 0,
            "total_valoraciones": media["total"],
        }
    if valor < 0.5 or valor > 5 or (valor * 2) % 1 != 0:
        raise ValueError("Valor debe estar entre 1 y 5, en incrementos de 0.5.")
    obj, _ = Valoracion.objects.update_or_create(usuario=usuario, juego=juego, defaults={"valor": valor})
    media = Valoracion.objects.filter(juego=juego).aggregate(media=Avg("valor"), total=Count("id"))
    registrar_actividad(usuario, "juego_valorado", f"Valoró *{juego_id}* con {valor} estrellas")
    return {
        "ok": True,
        "mi_valoracion": obj.valor,
        "media_valoracion": media["media"] or 0,
        "total_valoraciones": media["total"],
    }


def calcular_recomendaciones_usuario(usuario, limite=10):
    """Devuelve juegos recomendados para un usuario."""
    juegos = cargar_cache_juegos() or []
    if not juegos:
        return []

    mis_ids = set(
        Biblioteca.objects.filter(user=usuario).values_list("game_id", flat=True)
    )
    if not mis_ids:
        return []

    contador = Counter(
        g
        for juego in juegos
        if juego["id"] in mis_ids
        for g in juego.get("genres", [])
    )

    if not contador:
        return []

    generos_top = [g for g, _ in contador.most_common(3)]

    perfil = getattr(usuario, "perfil", None)
    if perfil and perfil.gustos_generos != generos_top:
        perfil.gustos_generos = generos_top
        perfil.save(update_fields=["gustos_generos"])

    candidatos = [
        j
        for j in juegos
        if j["id"] not in mis_ids
        and any(g in j.get("genres", []) for g in generos_top)
    ]
    candidatos.sort(
        key=lambda j: (
            j.get("popularidad") is None,
            -(j.get("popularidad") or 0),
        )
    )

    recomendados = candidatos[:limite]

    return [
        {
            "id": j["id"],
            "name": j["name"],
            "cover": j.get("cover", {}),
            "summary": j.get("summary", ""),
            "first_release_date": j.get("first_release_date"),
        }
        for j in recomendados
    ]
