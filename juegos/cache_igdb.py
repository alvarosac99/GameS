"""Módulo encargado de mantener la caché local de juegos de IGDB."""

import pickle
import threading
import time
import sys
from tqdm import tqdm
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
_STOP_KEY = "igdb_cache_stop"
_STATUS_KEY = "igdb_cache_status"
_LAST_UPDATE_KEY = "igdb_cache_last_update"
_LAST_ERROR_KEY = "igdb_cache_last_error"
_COUNT_KEY = "igdb_cache_juegos_count"

def solicitar_detener_descarga():
    """Solicita detener la descarga en el proximo punto seguro."""
    cache.set(_STOP_KEY, True, timeout=3600)

def limpiar_cache_igdb():
    """Limpia la cache de IGDB y estado asociado."""
    cache.delete("igdb_cache_juegos_masivos")
    cache.delete("igdb_token")
    cache.delete(DESCARGANDO_KEY)
    cache.delete(DESCARGANDO_COMPLETADO_KEY)
    cache.delete(_STOP_KEY)
    cache.delete(_STATUS_KEY)
    cache.delete(_LAST_UPDATE_KEY)
    cache.delete(_LAST_ERROR_KEY)
    cache.delete(_COUNT_KEY)

def obtener_estado_cache():
    """Devuelve el estado actual de la cache de IGDB para administracion."""
    return {
        "descargando": bool(cache.get(DESCARGANDO_KEY)),
        "completado": bool(cache.get(DESCARGANDO_COMPLETADO_KEY)),
        "stop_requested": bool(cache.get(_STOP_KEY)),
        "status": cache.get(_STATUS_KEY) or {},
        "last_update": cache.get(_LAST_UPDATE_KEY),
        "last_error": cache.get(_LAST_ERROR_KEY),
        "cache_count": cache.get(_COUNT_KEY),
    }


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
        total_juegos = None
        try:
            count_query = (
                "where cover.url != null "
                "& first_release_date != null;"
            )
            count_res = safe_post(f"{IGDB_BASE_URL}/games/count", headers, count_query)
            if count_res.status_code == 200:
                total_juegos = count_res.json().get("count")
        except Exception:
            total_juegos = None
        cache.set(
            _STATUS_KEY,
            {"estado": "en progreso", "fase": "Descargando juegos", "offset": 0, "total": total_juegos},
            timeout=86400,
        )
        juegos_bar = tqdm(
            total=total_juegos,
            desc="IGDB cache juegos",
            unit="juegos",
            dynamic_ncols=True,
            ascii=True,
            file=sys.stderr,
            mininterval=0.2,
        )
        try:
            while True:
                if cache.get(_STOP_KEY):
                    cache.set(
                        _STATUS_KEY,
                        {"estado": "detenido", "fase": "Descargando juegos", "offset": offset_loop, "total": total_juegos},
                        timeout=86400,
                    )
                    return
                tqdm.write(f"IGDB cache: solicitando juegos offset={offset_loop}", file=sys.stderr)
                query = f"""
                    fields {", ".join(fields)};
                    sort popularity desc;
                    limit 500;
                    offset {offset_loop};
                """
                res = safe_post(f"{IGDB_BASE_URL}/games", headers, query)
                tqdm.write(
                    f"IGDB cache: respuesta juegos status={res.status_code} offset={offset_loop}",
                    file=sys.stderr,
                )
                chunk = res.json()
                tqdm.write(
                    f"IGDB cache: recibidos {len(chunk)} juegos en offset={offset_loop}",
                    file=sys.stderr,
                )
                if not chunk:
                    tqdm.write(
                        "IGDB cache: sin mas juegos, finalizando descarga",
                        file=sys.stderr,
                    )
                    break
                juegos.extend(chunk)
                ids.extend([j["id"] for j in chunk])
                offset_loop += 500
                juegos_bar.update(len(chunk))
                cache.set(_COUNT_KEY, len(juegos), timeout=86400)
                cache.set(
                    _STATUS_KEY,
                    {
                        "estado": "en progreso",
                        "fase": "Descargando juegos",
                        "offset": offset_loop,
                        "total": total_juegos,
                    },
                    timeout=86400,
                )
                if len(chunk) < 500:
                    tqdm.write(
                        "IGDB cache: ultimo bloque parcial, finalizando descarga",
                        file=sys.stderr,
                    )
                    break
        finally:
            juegos_bar.close()

        cache.set(
            _STATUS_KEY,
            {"estado": "en progreso", "fase": "Descargando popularidad", "offset": 0, "total": len(ids)},
            timeout=86400,
        )
        popularidad_map = {}
        pop_total = None
        try:
            count_pop_res = safe_post(
                f"{IGDB_BASE_URL}/popularity_primitives/count",
                headers,
                "where popularity_type = 1;",
            )
            if count_pop_res.status_code == 200:
                pop_total = count_pop_res.json().get("count")
        except Exception:
            pop_total = len(ids)
        if pop_total is None:
            pop_total = len(ids)
        pop_bar = tqdm(
            total=pop_total,
            desc="IGDB cache popularidad",
            unit="juegos",
            dynamic_ncols=True,
            ascii=True,
            file=sys.stderr,
            mininterval=0.2,
        )
        try:
            for i in range(0, len(ids), 500):
                if cache.get(_STOP_KEY):
                    cache.set(
                        _STATUS_KEY,
                        {"estado": "detenido", "fase": "Descargando popularidad", "offset": i, "total": pop_total},
                        timeout=86400,
                    )
                    return
                tqdm.write(
                    f"IGDB cache: solicitando popularidad {i}/{len(ids)}",
                    file=sys.stderr,
                )
                ids_slice = ",".join(str(x) for x in ids[i:i + 500])
                pop_query = (
                    f"fields game_id,value; where game_id = ({ids_slice}) & popularity_type = 1;"
                )
                pop_res = safe_post(
                    f"{IGDB_BASE_URL}/popularity_primitives", headers, pop_query
                )
                tqdm.write(
                    f"IGDB cache: respuesta popularidad status={pop_res.status_code} i={i}",
                    file=sys.stderr,
                )
                if pop_res.status_code == 200:
                    pop_data = pop_res.json()
                    tqdm.write(
                        f"IGDB cache: recibidos {len(pop_data)} registros de popularidad",
                        file=sys.stderr,
                    )
                    popularidad_map.update({p["game_id"]: p["value"] for p in pop_data})
                pop_bar.update(min(500, len(ids) - i))
                cache.set(
                    _STATUS_KEY,
                    {
                        "estado": "en progreso",
                        "fase": "Descargando popularidad",
                        "offset": i + 500,
                        "total": pop_total,
                    },
                    timeout=86400,
                )

        finally:
            pop_bar.close()

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
        cache.set(_LAST_UPDATE_KEY, datetime.utcnow().isoformat(), timeout=86400)
        cache.set(
            _STATUS_KEY,
            {"estado": "completado", "fase": "Completado", "offset": len(juegos), "total": len(juegos)},
            timeout=86400,
        )
    except Exception as e:
        print("Error al actualizar caché IGDB:", e)
        cache.set(_LAST_ERROR_KEY, str(e), timeout=86400)
        cache.set(
            _STATUS_KEY,
            {"estado": "error", "fase": "Error", "offset": 0, "total": 0},
            timeout=86400,
        )
    finally:
        cache.delete(DESCARGANDO_KEY)
        cache.delete(_STOP_KEY)


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

