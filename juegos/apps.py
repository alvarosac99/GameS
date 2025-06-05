from django.apps import AppConfig


class JuegosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'juegos'

    def ready(self):
        import os
        if os.environ.get("DISABLE_IGDB_CACHE"):
            return
        from .cache_igdb import iniciar_programacion
        iniciar_programacion()
