"""Configuración de la aplicación `usuarios`."""

from django.apps import AppConfig


class UsuariosConfig(AppConfig):
    """Clase de configuración para registrar la app en Django."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "usuarios"
