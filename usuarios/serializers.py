from rest_framework import serializers
from .models import Perfil

class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ['user', 'rol', 'avatar', 'biografia', 'filtro_adulto']
