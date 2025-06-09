from datetime import timedelta

from rest_framework import viewsets, permissions
from .models import EntradaDiario
from .serializers import EntradaDiarioSerializer
from sesiones.models import TiempoJuego
from juegos.models import Planificacion
from usuarios.models import Perfil

class EntradaDiarioViewSet(viewsets.ModelViewSet):
    serializer_class = EntradaDiarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EntradaDiario.objects.filter(usuario=self.request.user).order_by('-fecha')

    def perform_create(self, serializer):
        entrada = serializer.save(usuario=self.request.user)
        duracion = entrada.duracion or timedelta()
        if duracion:
            tiempo, _ = TiempoJuego.objects.get_or_create(
                usuario=entrada.usuario, juego=entrada.juego
            )
            tiempo.duracion_total += duracion
            tiempo.save()

            for plan in Planificacion.objects.filter(
                usuario=entrada.usuario, juegos=entrada.juego
            ):
                plan.duracion_jugada += duracion
                plan.save()

            perfil = Perfil.objects.filter(user=entrada.usuario).first()
            if perfil:
                if perfil.__dict__.get("tiempo_total") is None:
                    perfil.tiempo_total = timedelta()
                perfil.tiempo_total += duracion
                perfil.save()
