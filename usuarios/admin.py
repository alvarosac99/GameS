"""Configuración del panel de administración para la app de usuarios."""

from django.contrib import admin
from .models import Perfil

@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    """Ajustes para mostrar los perfiles en el admin."""

    # Campos que se mostrarán en el listado
    list_display = ["user", "rol", "filtro_adulto"]
