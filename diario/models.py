from django.db import models
from django.contrib.auth import get_user_model
from juegos.models import Juego

User = get_user_model()

class EntradaDiario(models.Model):
    ESTADO_JUEGO = [
        ("jugando", "Jugando"),
        ("completado", "Completado"),
        ("abandonado", "Abandonado"),
        ("en_espera", "En espera"),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="entradas_diario")
    juego = models.ForeignKey(Juego, on_delete=models.CASCADE, related_name="entradas_diario")
    fecha = models.DateTimeField(auto_now_add=True)
    duracion = models.DurationField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_JUEGO, default="jugando")
    nota = models.TextField(blank=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.juego.nombre} - {self.estado}"
