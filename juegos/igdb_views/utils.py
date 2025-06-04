import requests
import time
from datetime import datetime
from django.conf import settings
from django.core.cache import cache
from requests.exceptions import SSLError

IGDB_BASE_URL = "https://api.igdb.com/v4"
DESCARGANDO_KEY = "igdb_descargando_todo"
DESCARGANDO_COMPLETADO_KEY = "igdb_descarga_completa"


def safe_post(url, headers, data, max_retries=10):
    """Realiza peticiones POST controlando reintentos y errores."""
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