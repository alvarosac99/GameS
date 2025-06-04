from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import requests

FASTAPI_URL = "http://localhost:8080/check-price"

@api_view(["GET"])
@permission_classes([AllowAny])
def consultar_precios(request):
    game = request.GET.get("game")
    if not game:
        return Response({"message": "Missing 'game' parameter"}, status=400)
    platform = request.GET.get("platform", "pc")

    try:
        resp = requests.get(FASTAPI_URL, params={"game": game, "platform": platform}, timeout=60)
        data = resp.json()
        return Response(data, status=resp.status_code)
    except Exception as e:
        return Response({"message": str(e)}, status=500)