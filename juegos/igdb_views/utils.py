import requests
from datetime import timedelta
from django.conf import settings
from django.core.cache import cache
from utils.http import safe_post
from howlongtobeatpy import HowLongToBeat
from ..models import Juego, DuracionJuego

IGDB_BASE_URL = "https://api.igdb.com/v4"
DESCARGANDO_KEY = "igdb_descargando_todo"
DESCARGANDO_COMPLETADO_KEY = "igdb_descarga_completa"

def obtener_token_igdb():
    """Recupera y cachea el token de autenticación de IGDB."""
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
    """Divide un iterable en porciones de tamaño `size`."""
    for i in range(0, len(iterable), size):
        yield iterable[i : i + size]


def obtener_nombre_juego(juego_id):
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
    obj = DuracionJuego.objects.filter(juego_id=juego_id).first()
    if obj and obj.duracion_main is not None:
        return obj.duracion_main

    nombre = obtener_nombre_juego(juego_id)
    if not nombre:
        return None
    try:
        resultados = HowLongToBeat().search(nombre)
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
