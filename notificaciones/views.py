"""Vistas para gestionar las notificaciones de cada usuario."""

from rest_framework import viewsets, permissions
from .models import Notificacion
from .serializers import NotificacionSerializer


class NotificacionViewSet(viewsets.ModelViewSet):
    """CRUD de notificaciones personales."""

    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Restringe las notificaciones al usuario logueado."""
        return Notificacion.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        """Asigna el usuario a la notificación creada."""
        serializer.save(usuario=self.request.user)
