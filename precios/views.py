from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import httpx

FASTAPI_URL = "http://localhost:8080/buscar-ofertas"

@api_view(["GET"])
@permission_classes([AllowAny])
def consultar_precios(request):
    game = request.GET.get("game")
    if not game:
        return Response({"message": "Missing 'game' parameter"}, status=400)
    try:
        with httpx.Client(timeout=60) as client:
            resp = client.get(FASTAPI_URL, params={"game": game})
            data = resp.json()
            return Response(data, status=resp.status_code)
    except httpx.HTTPError as e:
        return Response({"message": str(e)}, status=500)
