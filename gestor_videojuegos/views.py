"""Vistas utilitarias para gestionar la caché de juegos."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.cache import cache
from juegos.cache_igdb import actualizar_cache_ahora
from juegos.igdb_views.utils import (
    DESCARGANDO_KEY,
    DESCARGANDO_COMPLETADO_KEY,
)

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def forzar_cache_juegos(request):
    """Inicia manualmente la actualización de la caché de juegos."""

    if request.method == "GET":
        # Indicamos el estado actual de la descarga
        return Response({
            "descargando": bool(cache.get(DESCARGANDO_KEY)),
            "completado": bool(cache.get(DESCARGANDO_COMPLETADO_KEY)),
        })

    # Lanzamos la tarea de actualización inmediata
    actualizar_cache_ahora()
    return Response({"success": True})
