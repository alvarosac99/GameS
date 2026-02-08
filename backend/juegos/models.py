"""Modelos relacionados con la gestión de juegos y bibliotecas."""

from datetime import timedelta

from django.conf import settings
from django.db import models


def default_duration():
    """Duración nula para campos ``DurationField``."""
    return timedelta()


class Juego(models.Model):
    """Representa un juego identificado por su ID de IGDB, con caché local de datos."""
    id = models.BigIntegerField(primary_key=True)
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, db_index=True, blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    cover_url = models.URLField(max_length=500, blank=True, null=True)
    first_release_date = models.DateTimeField(blank=True, null=True)
    popularidad = models.FloatField(default=0.0, db_index=True)
    aggregated_rating = models.FloatField(blank=True, null=True)
    rating_count = models.IntegerField(default=0)
    
    # Datos JSON para listas simples
    genres = models.JSONField(default=list, blank=True)
    platforms = models.JSONField(default=list, blank=True)
    involved_companies = models.JSONField(default=list, blank=True)
    themes = models.JSONField(default=list, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name or f"Juego IGDB {self.id}"


class Biblioteca(models.Model):
    """Relación entre un usuario y los juegos que posee."""
    ESTADOS = [
        ("jugando", "Jugando"),
        ("completado", "Completado"),
        ("abandonado", "Abandonado"),
        ("en_espera", "En espera"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="biblioteca"
    )
    game_id = models.BigIntegerField()
    added_at = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="jugando")

    class Meta:
        unique_together = ("user", "game_id")
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.user.username} – juego {self.game_id}"


class Valoracion(models.Model):
    """Puntuación otorgada por un usuario a un juego."""
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
    """Duración aproximada de un juego obtenida de HowLongToBeat."""
    juego = models.OneToOneField(
        Juego, on_delete=models.CASCADE, related_name="duracion_juego"
    )
    duracion_main = models.DurationField(null=True, blank=True)
    fecha_consulta = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Duraci\u00f3n {self.juego_id}: {self.duracion_main}"


class Planificacion(models.Model):
    """Planificaciones personalizadas de juegos por parte del usuario."""
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


class PlanificacionCompletada(models.Model):
    """Planificaciones finalizadas con su resumen de juego."""

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="planificaciones_completadas",
    )
    nombre = models.CharField(max_length=100)
    resumen = models.JSONField(default=dict)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado"]

    def __str__(self) -> str:
        return f"{self.usuario.username} - {self.nombre} (completada)"


class JuegoDev(models.Model):
    """Juego creado por un desarrollador de la plataforma."""

    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    desarrollador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="juegos_dev",
    )
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado"]

    def __str__(self) -> str:
        return self.nombre
