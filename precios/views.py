"""Vistas relacionadas con la consulta de precios."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import httpx

# Endpoint de la API externa que ofrece los precios.
FASTAPI_URL = "http://localhost:8080/buscar-ofertas"

@api_view(["GET"])
@permission_classes([AllowAny])
def consultar_precios(request):
    """Consulta los precios de un juego a través de la API FastAPI."""

    # Nombre del juego recibido por parámetro
    game = request.GET.get("game")
    if not game:
        # Si no se envía el parámetro devolvemos error de petición
        return Response({"message": "Missing 'game' parameter"}, status=400)
    try:
        # Realizamos la petición HTTP al servicio externo con httpx
        with httpx.Client(timeout=60) as client:
            resp = client.get(FASTAPI_URL, params={"game": game})
            data = resp.json()
            # Devolvemos la respuesta tal cual la recibimos
            return Response(data, status=resp.status_code)
    except httpx.HTTPError as e:
        # Cualquier error de red se envía al cliente
        return Response({"message": str(e)}, status=500)
