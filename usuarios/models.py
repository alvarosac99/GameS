from django.contrib.auth.models import User
from django.db import models

class Perfil(models.Model):
    ROLES = [
        ('ADMIN', 'Administrador'),
        ('DEV', 'Desarrollador'),
        ('REVIEWER', 'Revisor'),
        ('PLAYER', 'Jugador'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    rol = models.CharField(max_length=10, choices=ROLES, default='PLAYER')
    avatar = models.ImageField(upload_to='avatares/', null=True, blank=True)
    biografia = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.rol}"
