from rest_framework import generics, permissions
from .models import Comentario
from .serializers import ComentarioSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from .permissions import PuedeVerTodosLosComentarios


class ComentariosJuegoView(generics.ListCreateAPIView):
    serializer_class = ComentarioSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        juego_id = self.kwargs.get("juego_id")
        return Comentario.objects.filter(juego_id=juego_id, respuesta_a__isnull=True)

    def perform_create(self, serializer):
        juego_id = self.kwargs.get("juego_id")
        serializer.save(user=self.request.user, juego_id=juego_id)


class ResponderComentarioView(generics.CreateAPIView):
    serializer_class = ComentarioSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BorrarComentarioView(generics.DestroyAPIView):
    serializer_class = ComentarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        rol = getattr(getattr(user, "perfil", None), "rol", "")
        if rol in ["STAFF", "ADMIN"]:
            return Comentario.objects.all()
        return Comentario.objects.filter(user=user)


class ComentariosAdminView(generics.ListAPIView):
    """Lista todos los comentarios para usuarios staff."""

    serializer_class = ComentarioSerializer
    permission_classes = [PuedeVerTodosLosComentarios]
    queryset = Comentario.objects.all()
