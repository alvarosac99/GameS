"""Configuracion de modelos para la interfaz de administracion."""

from django.contrib import admin, messages
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path

from .cache_igdb import (
    actualizar_cache_ahora,
    limpiar_cache_igdb,
    obtener_estado_cache,
    solicitar_detener_descarga,
)
from .models import (
    Juego,
    Biblioteca,
    Valoracion,
    DuracionJuego,
    Planificacion,
    PlanificacionCompletada,
    JuegoDev,
)


admin.site.register(Juego)
admin.site.register(Biblioteca)
admin.site.register(Valoracion)
admin.site.register(DuracionJuego)
admin.site.register(Planificacion)
admin.site.register(PlanificacionCompletada)
admin.site.register(JuegoDev)


def igdb_cache_admin_view(request):
    """Vista de administracion para el estado y control de la cache IGDB."""
    if request.method == "POST":
        action = request.POST.get("action")
        if action == "start":
            actualizar_cache_ahora()
            messages.success(request, "Se inicio la actualizacion de la cache IGDB.")
        elif action == "stop":
            solicitar_detener_descarga()
            messages.warning(request, "Se solicito detener la descarga en curso.")
        elif action == "clear":
            limpiar_cache_igdb()
            messages.success(request, "Cache de IGDB limpiada.")
        return redirect("admin:igdb-cache")

    context = {
        **admin.site.each_context(request),
        "title": "IGDB Cache",
        "estado": obtener_estado_cache(),
    }
    return TemplateResponse(request, "admin/igdb_cache.html", context)


_original_get_urls = admin.site.get_urls


def _admin_urls():
    return [
        path(
            "igdb-cache/",
            admin.site.admin_view(igdb_cache_admin_view),
            name="igdb-cache",
        )
    ] + _original_get_urls()


admin.site.get_urls = _admin_urls
