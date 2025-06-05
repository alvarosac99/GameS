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
    if request.method == "GET":
        return Response({
            "descargando": bool(cache.get(DESCARGANDO_KEY)),
            "completado": bool(cache.get(DESCARGANDO_COMPLETADO_KEY)),
        })

    actualizar_cache_ahora()
    return Response({"success": True})
