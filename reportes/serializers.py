from rest_framework import serializers
from .models import Reporte


class ReporteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reporte
        fields = ["id", "content_type", "object_id", "titulo", "motivo", "fecha"]
        read_only_fields = ["id", "fecha", "content_type", "object_id"]
