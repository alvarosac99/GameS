from rest_framework import serializers
from .models import SesionJuego

class SesionJuegoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SesionJuego
        fields = "__all__"
        read_only_fields = ["id", "usuario", "inicio", "fin"]
