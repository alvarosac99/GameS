"""Serializadores utilizados por la API de juegos."""

from rest_framework import serializers

from .models import Biblioteca, Valoracion, Planificacion, JuegoDev

class BibliotecaSerializer(serializers.ModelSerializer):
    """Gestiona la serialización de elementos de la biblioteca."""
    class Meta:
        model = Biblioteca
        fields = ("id", "game_id", "added_at", "estado")
        read_only_fields = ("id", "added_at")

    def validate(self, attrs):
        user = self.context["request"].user
        game_id = attrs.get("game_id") or getattr(self.instance, "game_id", None)
        if game_id:
            qs = Biblioteca.objects.filter(user=user, game_id=game_id)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    "Este juego ya está en tu biblioteca."
                )
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ValoracionSerializer(serializers.ModelSerializer):
    """Serializa las valoraciones de los usuarios."""
    class Meta:
        model = Valoracion
        fields = ["id", "usuario", "juego", "valor", "fecha"]
        read_only_fields = ["id", "usuario", "juego", "fecha"]


class PlanificacionSerializer(serializers.ModelSerializer):
    """Serializa los planes de juego de cada usuario."""
    duracion_total = serializers.SerializerMethodField()
    duracion_jugada = serializers.SerializerMethodField()

    class Meta:
        model = Planificacion
        fields = [
            "id",
            "nombre",
            "juegos",
            "creado",
            "duracion_total",
            "duracion_jugada",
        ]
        read_only_fields = ["id", "creado", "duracion_total", "duracion_jugada"]

    def get_duracion_total(self, obj):
        return obj.duracion_total.total_seconds() if obj.duracion_total else 0

    def get_duracion_jugada(self, obj):
        return obj.duracion_jugada.total_seconds() if obj.duracion_jugada else 0


class JuegoDevSerializer(serializers.ModelSerializer):
    class Meta:
        model = JuegoDev
        fields = ["id", "nombre", "descripcion", "desarrollador", "creado"]
        read_only_fields = ["id", "desarrollador", "creado"]
