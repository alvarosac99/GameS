from rest_framework import serializers
from .models import Comentario
from django.contrib.auth.models import User

class UsuarioSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name')

class ComentarioSerializer(serializers.ModelSerializer):
    user = UsuarioSimpleSerializer(read_only=True)
    respuestas = serializers.SerializerMethodField()

    class Meta:
        model = Comentario
        fields = ['id', 'user', 'juego_id', 'texto', 'fecha', 'editado', 'respuesta_a', 'respuestas']

    def get_respuestas(self, obj):
        return ComentarioSerializer(obj.respuestas.all(), many=True).data
