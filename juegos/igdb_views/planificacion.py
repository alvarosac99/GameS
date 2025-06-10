"""Vistas para gestionar las planificaciones de los usuarios."""

from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import (
    Planificacion,
    Juego,
    PlanificacionCompletada,
    Biblioteca,
)
from ..serializers import (
    PlanificacionSerializer,
    PlanificacionCompletadaSerializer,
)
from .utils import obtener_duracion_juego
from datetime import timedelta


class PlanificacionViewSet(viewsets.ModelViewSet):
    """Permite crear y listar planificaciones de juegos."""

    serializer_class = PlanificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Restringe el listado al usuario autenticado."""
        return Planificacion.objects.filter(usuario=self.request.user)

    def create(self, request, *args, **kwargs):
        """Asegura que los juegos existan antes de crear la planificación."""
        juegos_ids = request.data.get("juegos", [])
        if isinstance(juegos_ids, list):
            for j_id in juegos_ids:
                Juego.objects.get_or_create(id=j_id)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Calcula la duración total estimada de la planificación."""
        plan = serializer.save(usuario=self.request.user)
        total = timedelta()
        for juego in plan.juegos.all():
            dur = obtener_duracion_juego(juego.id)
            if dur:
                total += dur
        plan.duracion_total = total
        plan.save()

    @action(detail=True, methods=["post"], url_path="finalizar")
    def finalize_plan(self, request, pk=None):
        """Marca la planificación como completada y genera un resumen."""
        plan = self.get_object()
        estatus = request.data.get("juegos", {})
        resumen_juegos = []
        total_segundos = 0
        completados = 0
        saltados = 0
        from sesiones.models import TiempoJuego

        for juego in plan.juegos.all():
            tiempo = TiempoJuego.objects.filter(
                usuario=request.user, juego=juego
            ).first()
            seg = int(tiempo.duracion_total.total_seconds()) if tiempo else 0
            total_segundos += seg
            estado = estatus.get(str(juego.id), "pendiente")
            if estado == "completado":
                completados += 1
                Biblioteca.objects.filter(
                    user=request.user, game_id=juego.id
                ).update(estado="completado")
            elif estado == "saltado":
                saltados += 1
            resumen_juegos.append(
                {"id": juego.id, "estado": estado, "segundos": seg}
            )

        resumen = {
            "juegos": resumen_juegos,
            "total_segundos": total_segundos,
            "completados": completados,
            "saltados": saltados,
        }

        PlanificacionCompletada.objects.create(
            usuario=request.user, nombre=plan.nombre, resumen=resumen
        )
        plan.delete()
        return Response(resumen)


class PlanificacionCompletadaViewSet(viewsets.ReadOnlyModelViewSet):
    """Lista de planificaciones ya completadas."""

    serializer_class = PlanificacionCompletadaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PlanificacionCompletada.objects.filter(usuario=self.request.user)
