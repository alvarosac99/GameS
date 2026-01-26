from datetime import timedelta
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import SesionJuego, TiempoJuego
from .serializers import SesionJuegoSerializer
from diario.models import EntradaDiario
from actividad.utils import registrar_actividad
from usuarios.models import Perfil
from juegos.models import Planificacion


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sesion_activa(request):
    sesion = SesionJuego.objects.filter(usuario=request.user, fin__isnull=True).first()
    if not sesion:
        return Response({}, status=204)
    data = {
        "id": sesion.id,
        "juego": sesion.juego_id,
        "inicio": sesion.inicio.isoformat(),
    }
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def iniciar_sesion(request):
    juego_id = request.data.get("juego")
    if not juego_id:
        return Response({"error": "juego requerido"}, status=400)
    SesionJuego.objects.filter(usuario=request.user, fin__isnull=True).update(
        fin=timezone.now()
    )
    sesion = SesionJuego.objects.create(usuario=request.user, juego_id=juego_id)
    return Response({"id": sesion.id, "inicio": sesion.inicio.isoformat()})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def finalizar_sesion(request):
    sesion_id = request.data.get("sesion")
    guardar = request.data.get("guardar", True)
    nota = request.data.get("nota", "")
    sesion = get_object_or_404(SesionJuego, id=sesion_id, usuario=request.user)
    if sesion.fin:
        return Response({"error": "Ya finalizada"}, status=400)
    sesion.fin = timezone.now()
    sesion.save()
    duracion = sesion.fin - sesion.inicio

    tiempo, _ = TiempoJuego.objects.get_or_create(
        usuario=request.user, juego_id=sesion.juego_id
    )
    tiempo.duracion_total += duracion
    tiempo.save()

    for plan in Planificacion.objects.filter(usuario=request.user, juegos=sesion.juego):
        plan.duracion_jugada += duracion
        plan.save()

    perfil = Perfil.objects.filter(user=request.user).first()
    if perfil:
        if perfil.__dict__.get("tiempo_total") is None:
            perfil.tiempo_total = timedelta()
        perfil.tiempo_total += duracion
        perfil.save()

    if guardar:
        EntradaDiario.objects.create(
            usuario=request.user,
            juego_id=sesion.juego_id,
            duracion=duracion,
            estado="jugando",
            nota=nota,
        )
        registrar_actividad(
            request.user,
            "entrada_diario",
            f"Jugó *{sesion.juego_id}*",
        )

    return Response({"duracion": duracion.total_seconds()})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def tiempos_juego(request):
    registros = TiempoJuego.objects.filter(usuario=request.user)
    datos = {r.juego_id: r.duracion_total.total_seconds() for r in registros}
    return Response(datos)
