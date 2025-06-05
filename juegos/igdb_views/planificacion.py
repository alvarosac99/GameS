from rest_framework import viewsets, permissions

from ..models import Planificacion, Juego
from ..serializers import PlanificacionSerializer
from .utils import obtener_duracion_juego
from datetime import timedelta


class PlanificacionViewSet(viewsets.ModelViewSet):
    serializer_class = PlanificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Planificacion.objects.filter(usuario=self.request.user)

    def create(self, request, *args, **kwargs):
        juegos_ids = request.data.get("juegos", [])
        if isinstance(juegos_ids, list):
            for j_id in juegos_ids:
                Juego.objects.get_or_create(id=j_id)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        plan = serializer.save(usuario=self.request.user)
        total = timedelta()
        for juego in plan.juegos.all():
            dur = obtener_duracion_juego(juego.id)
            if dur:
                total += dur
        plan.duracion_total = total
        plan.save()
