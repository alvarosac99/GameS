from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def forzar_cache_juegos(request):
    """
    Endpoint obsoleto.
    El sistema ahora usa caché bajo demanda.
    """
    return Response({
        "message": "Sistema de caché actualizado a bajo demanda. No es necesario forzar actualización.",
        "descargando": False,
        "completado": True
    })
