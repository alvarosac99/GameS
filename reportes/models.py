from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


class Reporte(models.Model):
    reportado_por = models.ForeignKey(User, on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    contenido = GenericForeignKey('content_type', 'object_id')
    motivo = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Reporte sobre {self.content_type} {self.object_id}"
