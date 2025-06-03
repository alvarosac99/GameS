# actividad/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Actividad, LogroUsuario
from .serializers import ActividadSerializer
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404


User = get_user_model()

@api_view(["GET"])
@permission_classes([AllowAny])
def actividades_usuario(request, nombre_usuario):
    user = get_object_or_404(User, username=nombre_usuario)
    actividades = Actividad.objects.filter(usuario=user).order_by('-fecha')[:30]
    serializer = ActividadSerializer(actividades, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([AllowAny])
def logros_usuario(request, nombre_usuario):
    User = get_user_model()
    user = get_object_or_404(User, username=nombre_usuario)
    logros = LogroUsuario.objects.filter(usuario=user).select_related("logro")
    data = [{"nombre": l.logro.nombre, "descripcion": l.logro.descripcion, "fecha": l.fecha} for l in logros]
    return Response(data)
