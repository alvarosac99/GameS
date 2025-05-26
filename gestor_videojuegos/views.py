from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.cache import cache
import threading

from .recopilar import recopilar_juegos_igdb

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def forzar_cache_juegos(request):
    if request.method == "GET":
        progreso = cache.get(
            "progreso_cache_juegos", {"estado": "no iniciado", "offset": 0, "total": 0}
        )
        return Response(progreso)

    elif request.method == "POST":
        accion = request.data.get("accion")
        if accion == "detener":
            progreso = cache.get("progreso_cache_juegos", {})
            progreso["estado"] = "detenido"
            cache.set("progreso_cache_juegos", progreso)
            return Response({"success": True, "mensaje": "Recopilación detenida."})

        elif accion == "iniciar":
            progreso = cache.get("progreso_cache_juegos", {})
            if progreso.get("estado") == "en progreso":
                return Response({"success": False, "mensaje": "Ya está en curso."})
            threading.Thread(target=recopilar_juegos_igdb).start()
            return Response({"success": True, "mensaje": "Recopilación iniciada."})

        return Response({"success": False, "mensaje": "Acción no válida."})
