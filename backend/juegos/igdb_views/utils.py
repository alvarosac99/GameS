"""Funciones auxiliares usadas por los servicios de IGDB."""

import time
import requests
from datetime import timedelta
from django.conf import settings
from django.core.cache import cache
from utils.http import safe_post
from howlongtobeatpy import HowLongToBeat
from howlongtobeatpy.JSONResultParser import JSONResultParser
from ..models import Juego, DuracionJuego

IGDB_BASE_URL = "https://api.igdb.com/v4"
DESCARGANDO_KEY = "igdb_descargando_todo"
DESCARGANDO_COMPLETADO_KEY = "igdb_descarga_completa"
HLTB_BASE_URL = "https://howlongtobeat.com"
HLTB_GAME_URL = f"{HLTB_BASE_URL}/game/"
HLTB_TOKEN_CACHE_KEY = "hltb_search_token"
HLTB_TOKEN_TTL = 10 * 60
HLTB_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0 Safari/537.36"
)

def obtener_token_igdb():
    """Recupera y cachea el token de autenticación de IGDB."""
    if getattr(settings, 'IS_TESTING', False):
        return "test_token_dummy_12345"

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


def chunked(iterable, size):
    """Divide un iterable en porciones de tamaño ``size``."""
    for i in range(0, len(iterable), size):
        yield iterable[i : i + size]


def _hltb_headers():
    return {
        "User-Agent": HLTB_USER_AGENT,
        "Referer": HLTB_BASE_URL,
        "Origin": HLTB_BASE_URL,
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
    }


def _hltb_fetch_token():
    params = {"t": int(time.time() * 1000)}
    resp = requests.get(
        f"{HLTB_BASE_URL}/api/search/init",
        headers=_hltb_headers(),
        params=params,
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("token")


def _hltb_get_token(force_refresh=False):
    if not force_refresh:
        token = cache.get(HLTB_TOKEN_CACHE_KEY)
        if token:
            return token
    token = _hltb_fetch_token()
    if token:
        cache.set(HLTB_TOKEN_CACHE_KEY, token, timeout=HLTB_TOKEN_TTL)
    return token


def _hltb_payload(game_name, page=1):
    return {
        "searchType": "games",
        "searchTerms": game_name.split(),
        "searchPage": page,
        "size": 20,
        "searchOptions": {
            "games": {
                "userId": 0,
                "platform": "",
                "sortCategory": "popular",
                "rangeCategory": "main",
                "rangeTime": {"min": 0, "max": 0},
                "gameplay": {"perspective": "", "flow": "", "genre": "", "difficulty": ""},
                "rangeYear": {"min": "", "max": ""},
                "modifier": "",
            },
            "users": {"sortCategory": "postcount"},
            "lists": {"sortCategory": "follows"},
            "filter": "",
            "sort": 0,
            "randomizer": 0,
        },
        "useCache": True,
    }


def _hltb_search_api(game_name):
    payload = _hltb_payload(game_name)
    token = _hltb_get_token()
    if not token:
        return None
    headers = _hltb_headers()
    headers["x-auth-token"] = token
    resp = requests.post(
        f"{HLTB_BASE_URL}/api/search",
        headers=headers,
        json=payload,
        timeout=20,
    )
    if resp.status_code == 403:
        token = _hltb_get_token(force_refresh=True)
        if not token:
            return None
        headers["x-auth-token"] = token
        resp = requests.post(
            f"{HLTB_BASE_URL}/api/search",
            headers=headers,
            json=payload,
            timeout=20,
        )
    if resp.status_code != 200:
        return None
    return resp.text


def buscar_hltb(nombre, minimum_similarity=0.4, similarity_case_sensitive=True, auto_filter_times=False):
    if not nombre:
        return None
    try:
        json_text = _hltb_search_api(nombre)
        if json_text:
            parser = JSONResultParser(
                nombre,
                HLTB_GAME_URL,
                minimum_similarity,
                input_similarity_case_sensitive=similarity_case_sensitive,
                input_auto_filter_times=auto_filter_times,
            )
            parser.parse_json_result(json_text)
            return parser.results
    except requests.RequestException:
        pass
    except Exception:
        pass
    try:
        return HowLongToBeat(minimum_similarity, auto_filter_times).search(
            nombre,
            similarity_case_sensitive=similarity_case_sensitive,
        )
    except Exception:
        return None


def obtener_nombre_juego(juego_id):
    """Obtiene el nombre de un juego a partir de su ID."""
    cache_key = f"nombre_juego_{juego_id}"
    nombre = cache.get(cache_key)
    if nombre:
        return nombre
    token = obtener_token_igdb()
    headers = {
        "Client-ID": settings.IGDB_CLIENT_ID,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "text/plain",
    }
    query = f"fields name; where id = {juego_id}; limit 1;"
    resp = safe_post(f"{IGDB_BASE_URL}/games", headers, query)
    data = resp.json()
    if not data:
        return None
    nombre = data[0].get("name")
    cache.set(cache_key, nombre, timeout=24 * 3600)
    return nombre


def obtener_duracion_juego(juego_id):
    """Consulta la duración principal de un juego en HowLongToBeat."""
    obj = DuracionJuego.objects.filter(juego_id=juego_id).first()
    if obj and obj.duracion_main is not None:
        return obj.duracion_main

    nombre = obtener_nombre_juego(juego_id)
    if not nombre:
        return None
    try:
        resultados = buscar_hltb(nombre)
        if not resultados:
            duracion = None
        else:
            mejor = max(resultados, key=lambda r: r.similarity)
            duracion = timedelta(hours=mejor.main_story)
    except Exception:
        duracion = None

    obj, _ = DuracionJuego.objects.get_or_create(juego_id=juego_id)
    obj.duracion_main = duracion
    obj.save()
    return duracion
