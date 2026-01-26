"""Configuración del panel de administración para la app de usuarios."""

from django.contrib import admin
from .models import Perfil

@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    """Ajustes para mostrar los perfiles en el admin."""

    # Campos que se mostrarán en el listado
    list_display = ["user", "rol", "filtro_adulto"]
    actions = ["asignar_desarrollador", "asignar_staff"]

    def asignar_desarrollador(self, request, queryset):
        queryset.update(rol="DEV")
        self.message_user(request, "Usuarios actualizados a Desarrollador")

    asignar_desarrollador.short_description = "Marcar como desarrollador"

    def asignar_staff(self, request, queryset):
        queryset.update(rol="STAFF")
        self.message_user(request, "Usuarios actualizados a Staff")

    asignar_staff.short_description = "Marcar como staff"
