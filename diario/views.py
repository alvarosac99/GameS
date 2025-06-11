from datetime import timedelta

"""Vistas para gestionar el diario personal de juego."""

from rest_framework import viewsets, permissions
from .models import EntradaDiario
from .serializers import EntradaDiarioSerializer
from sesiones.models import TiempoJuego
from juegos.models import Planificacion
from usuarios.models import Perfil

class EntradaDiarioViewSet(viewsets.ModelViewSet):
    """CRUD de entradas del diario de juego del usuario."""

    serializer_class = EntradaDiarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filtra las entradas al usuario autenticado."""
        return EntradaDiario.objects.filter(usuario=self.request.user).order_by('-fecha')

    def perform_create(self, serializer):
        """Guarda la entrada y actualiza estadísticas relacionadas."""

        entrada = serializer.save(usuario=self.request.user)
        duracion = entrada.duracion or timedelta()
        if duracion:
            # Sumamos la duración a los tiempos de juego acumulados
            tiempo, _ = TiempoJuego.objects.get_or_create(
                usuario=entrada.usuario, juego=entrada.juego
            )
            tiempo.duracion_total += duracion
            tiempo.save()

            # Actualizamos también las planificaciones en las que aparezca
            for plan in Planificacion.objects.filter(
                usuario=entrada.usuario, juegos=entrada.juego
            ):
                plan.duracion_jugada += duracion
                plan.save()

            # Finalmente acumulamos el tiempo total en el perfil
            perfil = Perfil.objects.filter(user=entrada.usuario).first()
            if perfil:
                if perfil.__dict__.get("tiempo_total") is None:
                    perfil.tiempo_total = timedelta()
                perfil.tiempo_total += duracion
                perfil.save()
