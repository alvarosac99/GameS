from django.contrib.auth.models import User
from django.db import models
import os
from django.utils.deconstruct import deconstructible


@deconstructible
class avatar_path:
    def __call__(self, instance, filename):
        # Genera una ruta única para el avatar
        ext = os.path.splitext(filename)[1]
        return os.path.join("avatares", f"{instance.user.username}{ext}")


class Perfil(models.Model):
    ROLES = [
        ("ADMIN", "Administrador"),
        ("DEV", "Desarrollador"),
        ("REVIEWER", "Revisor"),
        ("PLAYER", "Jugador"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    rol = models.CharField(max_length=10, choices=ROLES, default="PLAYER")
    avatar = models.ImageField(upload_to=avatar_path(), null=True, blank=True)
    biografia = models.TextField(blank=True)
    filtro_adulto = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.rol}"
