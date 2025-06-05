from rest_framework import serializers
from .models import Biblioteca, Valoracion, Planificacion

class BibliotecaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Biblioteca
        fields = ("id", "game_id", "added_at", "estado")
        read_only_fields = ("id", "game_id", "added_at")


class ValoracionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Valoracion
        fields = ["id", "usuario", "juego", "valor", "fecha"]
        read_only_fields = ["id", "usuario", "juego", "fecha"]


class PlanificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planificacion
        fields = ["id", "nombre", "juegos", "creado"]
        read_only_fields = ["id", "creado"]
