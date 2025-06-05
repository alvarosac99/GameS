"""Serializadores para la app de usuarios."""

from rest_framework import serializers
from .models import Perfil

class PerfilSerializer(serializers.ModelSerializer):
    """Convierte instancias de ``Perfil`` a representaciones JSON."""

    class Meta:
        model = Perfil
        fields = ["user", "rol", "avatar", "biografia", "filtro_adulto"]
