"""Vistas para juegos creados por desarrolladores."""

from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from .models import JuegoDev
from .serializers import JuegoDevSerializer


class JuegoDevViewSet(viewsets.ModelViewSet):
    """Permite a los desarrolladores gestionar sus propios juegos."""

    serializer_class = JuegoDevSerializer
    queryset = JuegoDev.objects.all()

    def get_permissions(self):
        """Restringe las acciones de escritura a usuarios autenticados."""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        """Asigna el desarrollador al juego creado tras validar permisos."""
        user = self.request.user
        rol = getattr(getattr(user, "perfil", None), "rol", "")
        if rol not in ["DEV", "ADMIN"]:
            raise PermissionDenied("Solo desarrolladores pueden crear juegos")
        serializer.save(desarrollador=user)

    def perform_update(self, serializer):
        """Solo el creador o un administrador pueden actualizarlo."""
        instance = self.get_object()
        user = self.request.user
        rol = getattr(getattr(user, "perfil", None), "rol", "")
        if instance.desarrollador != user and rol != "ADMIN":
            raise PermissionDenied("No puedes modificar este juego")
        serializer.save()

    def perform_destroy(self, instance):
        """Solo el creador o un administrador pueden eliminarlo."""
        user = self.request.user
        rol = getattr(getattr(user, "perfil", None), "rol", "")
        if instance.desarrollador != user and rol != "ADMIN":
            raise PermissionDenied("No puedes borrar este juego")
        instance.delete()

