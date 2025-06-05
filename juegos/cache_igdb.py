"""Módulo encargado de mantener la caché local de juegos de IGDB."""

import pickle
import threading
import time
from datetime import datetime, timedelta

from django.conf import settings
from django.core.cache import cache

from .igdb_views.utils import (
    IGDB_BASE_URL,
    DESCARGANDO_KEY,
    DESCARGANDO_COMPLETADO_KEY,
    obtener_token_igdb,
    safe_post,
)


# Marca si la tarea de actualización ya se ha iniciado
_CACHE_THREAD_STARTED = False


def _descargar_juegos():
    """Descarga todos los juegos de IGDB y los guarda en caché."""
    try:
        cache.set(
            DESCARGANDO_KEY,
            {"estado": True, "inicio": datetime.utcnow().isoformat()},
            timeout=None,
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
            ids_slice = ",".join(str(x) for x in ids[i:i + 500])
            pop_query = (
                f"fields game_id,value; where game_id = ({ids_slice}) & popularity_type = 1;"
            )
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

        cache.set("igdb_cache_juegos_masivos", pickle.dumps(juegos), timeout=24 * 3600)
        cache.set(DESCARGANDO_COMPLETADO_KEY, True, timeout=24 * 3600)
    except Exception as e:
        print("Error al actualizar caché IGDB:", e)
    finally:
        cache.delete(DESCARGANDO_KEY)


def actualizar_cache_ahora():
    """Lanza la descarga de juegos en un hilo independiente."""
    threading.Thread(target=_descargar_juegos, daemon=True).start()


def _programar_descargas():
    """Ejecuta la actualización diaria de la caché a las 2:00 AM."""
    while True:
        ahora = datetime.now()
        proxima = ahora.replace(hour=2, minute=0, second=0, microsecond=0)
        if proxima <= ahora:
            proxima += timedelta(days=1)
        time.sleep((proxima - ahora).total_seconds())
        _descargar_juegos()


def iniciar_programacion():
    """Inicia la tarea de actualización de la caché si no está corriendo."""
    global _CACHE_THREAD_STARTED
    if _CACHE_THREAD_STARTED:
        return
    _CACHE_THREAD_STARTED = True

    if not cache.get("igdb_cache_juegos_masivos"):
        actualizar_cache_ahora()

    threading.Thread(target=_programar_descargas, daemon=True).start()

