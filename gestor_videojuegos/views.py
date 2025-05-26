from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.cache import cache
import threading
from .recopilar import recopilar_juegos_igdb
from django.shortcuts import render, redirect

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def forzar_cache_juegos(request):
    if request.method == "GET":
        progreso = cache.get(
            "progreso_cache_juegos", {
                "estado": "no iniciado",
                "fase": "",
                "offset": 0,
                "total": 0
            }
        )
        return Response(progreso)

    elif request.method == "POST":
        accion = request.data.get("accion")
        popularity_type = request.data.get("popularity_type", 1)  # <--- por defecto 1
        try:
            popularity_type = int(popularity_type)
        except:
            popularity_type = 1

        if accion == "detener":
            progreso = cache.get("progreso_cache_juegos", {})
            progreso["estado"] = "detenido"
            progreso["fase"] = "detenido"
            cache.set("progreso_cache_juegos", progreso, timeout=86400)
            return Response({"success": True, "mensaje": "Recopilación detenida."})

        elif accion == "iniciar":
            progreso = cache.get("progreso_cache_juegos", {})
            if progreso.get("estado") == "en progreso":
                return Response({"success": False, "mensaje": "Ya está en curso."})
            cache.set("progreso_cache_juegos", {
                "estado": "en progreso",
                "fase": "Preparando…",
                "offset": 0,
                "total": 0
            }, timeout=86400)
            threading.Thread(target=recopilar_juegos_igdb, args=(popularity_type,), daemon=True).start()
            return Response({"success": True, "mensaje": f"Recopilación iniciada para popularity_type={popularity_type}."})

        return Response({"success": False, "mensaje": "Acción no válida."})
