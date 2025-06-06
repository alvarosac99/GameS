from django.contrib import admin
from django.contrib.auth import get_user_model
from comentarios.models import Comentario
from .models import Reporte

User = get_user_model()


@admin.register(Reporte)
class ReporteAdmin(admin.ModelAdmin):
    list_display = ["id", "content_type", "object_id", "reportado_por", "fecha"]
    actions = ["borrar_comentario", "banear_usuario"]

    def borrar_comentario(self, request, queryset):
        for reporte in queryset:
            if isinstance(reporte.contenido, Comentario):
                reporte.contenido.delete()
        self.message_user(request, "Comentarios eliminados")

    borrar_comentario.short_description = "Borrar comentario reportado"

    def banear_usuario(self, request, queryset):
        for reporte in queryset:
            if isinstance(reporte.contenido, User):
                reporte.contenido.delete()
        self.message_user(request, "Usuarios baneados")

    banear_usuario.short_description = "Banear usuario reportado"
