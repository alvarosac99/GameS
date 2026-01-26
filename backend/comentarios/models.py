from django.db import models
from django.conf import settings

class Comentario(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    juego_id = models.PositiveIntegerField()  # Se guarda el ID de IGDB o del sistema propio
    texto = models.TextField(max_length=1500)
    fecha = models.DateTimeField(auto_now_add=True)
    editado = models.BooleanField(default=False)
    respuesta_a = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='respuestas')

    class Meta:
        ordering = ['-fecha']
        permissions = [
            ("ver_comentarios", "Puede ver todos los comentarios"),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.juego_id} - {self.texto[:30]}"
