# actividad/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Actividad(models.Model):
    TIPO_CHOICES = [
        ("comentario", "Comentario"),
        ("logro", "Logro"),
        ("juego_agregado", "Juego Agregado"),
        ("juego_valorado", "Juego Valorado"),
        ("entrada_diario", "Entrada Diario"),
    ]

    usuario = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="actividades"
    )
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    descripcion = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha"]


class Logro(models.Model):
    clave = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    icono = models.CharField(max_length=50, blank=True)
    orden = models.IntegerField(default=0)

    def __str__(self):
        return self.nombre


class LogroUsuario(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="logros")
    logro = models.ForeignKey(Logro, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("usuario", "logro")
        ordering = ["-fecha"]
