from django.db import models
from django.conf import settings
from datetime import timedelta


def default_duration():
    return timedelta()


class Juego(models.Model):
    id = models.BigIntegerField(primary_key=True)

    def __str__(self):
        return f"Juego IGDB {self.id}"


class Biblioteca(models.Model):
    ESTADOS = [
        ("jugando", "Jugando"),
        ("completado", "Completado"),
        ("abandonado", "Abandonado"),
        ("en_espera", "En espera"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="biblioteca"
    )
    game_id = models.IntegerField()
    added_at = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="jugando")

    class Meta:
        unique_together = ("user", "game_id")
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.user.username} – juego {self.game_id}"


class Valoracion(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="valoraciones"
    )
    juego = models.ForeignKey(
        Juego, on_delete=models.CASCADE, related_name="valoraciones"
    )
    valor = models.FloatField()
    fecha = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("usuario", "juego")

    def __str__(self):
        return f"{self.usuario.username} - {self.juego.name}: {self.valor}"


class DuracionJuego(models.Model):
    juego = models.OneToOneField(
        Juego, on_delete=models.CASCADE, related_name="duracion_juego"
    )
    duracion_main = models.DurationField(null=True, blank=True)
    fecha_consulta = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Duraci\u00f3n {self.juego_id}: {self.duracion_main}"


class Planificacion(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="planificaciones"
    )
    nombre = models.CharField(max_length=100)
    juegos = models.ManyToManyField(Juego, related_name="planificaciones")
    creado = models.DateTimeField(auto_now_add=True)
    duracion_total = models.DurationField(default=default_duration)
    duracion_jugada = models.DurationField(default=default_duration)

    class Meta:
        ordering = ["-creado"]

    def __str__(self):
        return f"{self.usuario.username} - {self.nombre}"
