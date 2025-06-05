from django.apps import AppConfig


class JuegosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'juegos'

    def ready(self):
        from .cache_igdb import iniciar_programacion
        iniciar_programacion()
