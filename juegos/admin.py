"""Configuración de modelos para la interfaz de administración."""

from django.contrib import admin

from .models import (
    Juego,
    Biblioteca,
    Valoracion,
    DuracionJuego,
    Planificacion,
)


admin.site.register(Juego)
admin.site.register(Biblioteca)
admin.site.register(Valoracion)
admin.site.register(DuracionJuego)
admin.site.register(Planificacion)

