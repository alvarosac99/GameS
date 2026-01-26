"""Modelos para la aplicación de usuarios."""

from django.contrib.auth.models import User  # Modelo base de Django
from django.db import models
import os  # Para construir la ruta de los avatares
from django.utils.deconstruct import deconstructible
from datetime import timedelta


@deconstructible
class avatar_path:
    """Genera la ruta donde se almacena cada avatar."""

    def __call__(self, instance, filename):
        # Se conserva la extensión original del archivo
        ext = os.path.splitext(filename)[1]
        # Los avatares se guardan en /media/avatares/<usuario>.<ext>
        return os.path.join("avatares", f"{instance.user.username}{ext}")


class Perfil(models.Model):
    """Extiende la información del usuario con datos adicionales."""

    ROLES = [
        ("ADMIN", "Administrador"),
        ("DEV", "Desarrollador"),
        ("STAFF", "Staff"),
        ("PLAYER", "Jugador"),
    ]

    # Relación uno a uno con el usuario
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # Rol que desempeña en la plataforma
    rol = models.CharField(max_length=10, choices=ROLES, default="PLAYER")
    # Imagen de avatar
    avatar = models.ImageField(upload_to=avatar_path(), null=True, blank=True)
    # Texto descriptivo del usuario
    biografia = models.TextField(blank=True)
    # Indica si el usuario desea ocultar contenido adulto
    filtro_adulto = models.BooleanField(default=True)
    # Lista de identificadores de juegos favoritos
    favoritos = models.JSONField(default=list, blank=True)
    # Lista de identificadores de géneros preferidos
    gustos_generos = models.JSONField(default=list, blank=True)
    # Usuarios que siguen al perfil
    seguidores = models.ManyToManyField(User, related_name="seguidos", blank=True)
    # Usuarios bloqueados por este perfil
    bloqueados = models.ManyToManyField(User, related_name="bloqueados_por", blank=True)
    # Tiempo total jugado en todos los juegos
    tiempo_total = models.DurationField(default=timedelta())

    def __str__(self) -> str:
        """Representación legible del perfil."""
        return f"{self.user.username} - {self.rol}"
