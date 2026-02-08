"""Módulo encargado de sincronizar el catálogo de IGDB con la base de datos local."""

import logging
import threading
import time
from datetime import datetime
from django.conf import settings
from .igdb_views.services import _guardar_juegos_batch, _headers
from .igdb_views.utils import IGDB_BASE_URL, safe_post

logger = logging.getLogger(__name__)

# Configuración
BATCH_SIZE = 500
DELAY_BETWEEN_BATCHES = 0.5  # Segundos de espera entre lotes para no saturar CPU/Red
_SYNC_THREAD_STARTED = False
_STOP_SYNC = False

def stop_sync():
    """Detiene la sincronización en el próximo ciclo."""
    global _STOP_SYNC
    _STOP_SYNC = True

def _worker_sync_catalog():
    """
    Tarea de fondo que recorre IODB y actualiza la base de datos local.
    Diseñado para ser interrumpible y 'amable' con los recursos.
    """
    global _STOP_SYNC
    logger.info("Iniciando sincronización de catálogo IGDB en segundo plano...")

    offset = 0
    # Intentar retomar desde donde quedamos o verificar total (simple start from 0 for robustness)
    # Para optimización futura: Guardar offset en DB o Cache.
    
    headers = _headers()
    fields = (
        "id,name,slug,summary,cover.url,first_release_date,"
        "total_rating,total_rating_count,genres,platforms,involved_companies,themes"
    )
    
    while not _STOP_SYNC:
        try:
            query = f"fields {fields}; limit {BATCH_SIZE}; offset {offset}; sort id asc;"
            res = safe_post(f"{IGDB_BASE_URL}/games", headers, query)
            
            if res.status_code != 200:
                logger.error(f"Error IGDB Sync: {res.status_code} - {res.text}")
                time.sleep(60) # Esperar un minuto si hay error de API
                continue
            
            juegos = res.json()
            if not juegos:
                logger.info("Sincronización IGDB completada (no más juegos).")
                break
                
            _guardar_juegos_batch(juegos)
            logger.info(f"Sincronizados {len(juegos)} juegos. Offset actual: {offset}")
            
            offset += len(juegos)
            time.sleep(DELAY_BETWEEN_BATCHES)
            
        except Exception as e:
            logger.error(f"Excepción en IGDB Sync: {e}")
            time.sleep(60)

    logger.info("Hilo de sincronización IGDB detenido.")

def iniciar_programacion():
    """Inicia el hilo de sincronización si no está corriendo."""
    global _SYNC_THREAD_STARTED
    if _SYNC_THREAD_STARTED:
        return
    
    _SYNC_THREAD_STARTED = True
    t = threading.Thread(target=_worker_sync_catalog, daemon=True)
    t.start()



