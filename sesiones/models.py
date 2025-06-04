from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from juegos.models import Juego

User = get_user_model()

def default_duration():
    return timedelta()

class SesionJuego(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sesiones")
    juego = models.ForeignKey(Juego, on_delete=models.CASCADE, related_name="sesiones")
    inicio = models.DateTimeField(default=timezone.now)
    fin = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-inicio"]

    def __str__(self):
        return f"{self.usuario.username} - {self.juego_id}"

class TiempoJuego(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tiempos_juego")
    juego = models.ForeignKey(Juego, on_delete=models.CASCADE, related_name="tiempos_juego")
    duracion_total = models.DurationField(default=default_duration)

    class Meta:
        unique_together = ("usuario", "juego")
