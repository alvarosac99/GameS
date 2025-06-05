from rest_framework import serializers
from .models import Biblioteca, Valoracion, Planificacion

class BibliotecaSerializer(serializers.ModelSerializer):
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
    class Meta:
        model = Valoracion
        fields = ["id", "usuario", "juego", "valor", "fecha"]
        read_only_fields = ["id", "usuario", "juego", "fecha"]


class PlanificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planificacion
        fields = ["id", "nombre", "juegos", "creado"]
        read_only_fields = ["id", "creado"]
