from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from usuarios.models import Perfil

import json

User = get_user_model()


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def perfil_usuario(request):
    usuario = request.user
    perfil, creado = Perfil.objects.get_or_create(user=usuario)

    if request.method == "GET":
        return Response(
            {
                "nombre": usuario.get_full_name() or 'John Doe',
                "email": usuario.email,
                "rol": perfil.rol,
                "bio": perfil.biografia,
                "foto": (
                    request.build_absolute_uri(perfil.avatar.url)
                    if perfil.avatar
                    else None
                ),
            }
        )

    elif request.method == "PATCH":
        nombre = request.data.get("nombre")
        email = request.data.get("email")
        bio = request.data.get("bio")
        avatar = request.FILES.get("foto")

        if nombre:
            usuario.first_name = nombre
        if email:
            usuario.email = email
        usuario.save()

        if bio is not None:
            perfil.biografia = bio or ""
        if avatar:
            perfil.avatar = avatar
        perfil.save()

        return Response({"message": "Perfil actualizado correctamente"})


@csrf_exempt
def register_view(request):
    if request.method == "POST":
        data = json.loads(request.body)

        username = data.get("username")
        password = data.get("password")
        confirmarPassword = data.get("confirmarPassword")
        email = data.get("email")

        if not all([username, password, confirmarPassword, email]):
            return JsonResponse(
                {"error": "Todos los campos son obligatorios"}, status=400
            )

        if password != confirmarPassword:
            return JsonResponse({"error": "Las contraseñas no coinciden"}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "El usuario ya existe"}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse(
                {"error": "Ya existe una cuenta con ese correo"}, status=400
            )

        try:
            user = User.objects.create_user(
                username=username, email=email, password=password
            )
            login(request, user)
            return JsonResponse({"message": "Usuario creado y sesión iniciada"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@ensure_csrf_cookie
def session_view(request):
    if request.user.is_authenticated:
        return JsonResponse({"authenticated": True, "username": request.user.username})
    return JsonResponse({"authenticated": False})


@csrf_exempt
def login_view(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user = authenticate(
            request, username=data.get("username"), password=data.get("password")
        )
        if user is not None:
            login(request, user)
            return JsonResponse({"message": "Login correcto"})
        return JsonResponse({"error": "Credenciales inválidas"}, status=401)


@csrf_exempt
def logout_view(request):
    if request.method == "POST":
        logout(request)
        return JsonResponse({"success": True})
