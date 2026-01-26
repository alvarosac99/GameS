from django.contrib import admin
from .models import Comentario


@admin.register(Comentario)
class ComentarioAdmin(admin.ModelAdmin):
    """Configuración del modelo Comentario para el admin."""

    list_display = ["id", "user", "juego_id", "texto", "fecha"]
    search_fields = ["texto", "user__username"]
    list_filter = ["fecha", "juego_id"]
