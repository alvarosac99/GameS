from rest_framework import serializers
from .models import EntradaDiario

class EntradaDiarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntradaDiario
        fields = '__all__'
        read_only_fields = ['id', 'fecha', 'usuario']
