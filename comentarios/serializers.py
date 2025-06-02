from rest_framework import serializers
from .models import Comentario
from juegos.models import Valoracion, Juego
from django.contrib.auth.models import User


class UsuarioSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name")


class ComentarioSerializer(serializers.ModelSerializer):
    user = UsuarioSimpleSerializer(read_only=True)
    valoracion = serializers.SerializerMethodField()
    respuestas = serializers.SerializerMethodField()
    juego_id = serializers.IntegerField(required=False)

    class Meta:
        model = Comentario
        fields = [
            "id",
            "user",
            "juego_id",
            "texto",
            "fecha",
            "editado",
            "respuesta_a",
            "valoracion",
            "respuestas",
        ]

    def get_valoracion(self, obj):
        # Busca el modelo Juego por id
        juego = Juego.objects.filter(id=obj.juego_id).first()
        if not juego:
            return None
        val = Valoracion.objects.filter(usuario=obj.user, juego=juego).first()
        return val.valor if val else None

    def get_respuestas(self, obj):
        hijos = Comentario.objects.filter(respuesta_a=obj).order_by("fecha")
        return ComentarioSerializer(hijos, many=True, context=self.context).data
