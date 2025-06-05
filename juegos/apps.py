"""Configuración de la aplicación Django para ``juegos``."""

from django.apps import AppConfig


class JuegosConfig(AppConfig):
    """Inicializa la app y arranca la programación de la caché."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "juegos"

    def ready(self):
        import os

        if os.environ.get("DISABLE_IGDB_CACHE"):
            return

        from .cache_igdb import iniciar_programacion

        iniciar_programacion()
