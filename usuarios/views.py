from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from usuarios.models import Perfil
from django.shortcuts import get_object_or_404
import json

User = get_user_model()


# PERFIL PÚBLICO (para /perfil/:username)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def perfil_publico_view(request, nombre_usuario):
    user = get_object_or_404(User, username=nombre_usuario)
    perfil, _ = Perfil.objects.get_or_create(user=user)
    print(f"Perfil de {user.username} obtenido: {perfil}")
    return Response(
        {
            "id": user.id,
            "nombre": user.first_name or user.username,
            "username": user.username,
            "email": user.email,
            "es_mi_perfil": request.user.username == user.username,
            "foto": (
                request.build_absolute_uri(perfil.avatar.url) if perfil.avatar else None
            ),
            "horas": getattr(perfil, "horas", 0),
            "juegos": getattr(perfil, "juegos", 0),
            "amigos": getattr(perfil, "amigos", 0),
            "seguidores": getattr(perfil, "seguidores", 0),
            "favoritos": (
                perfil.favoritos_json() if hasattr(perfil, "favoritos_json") else []
            ),
        }
    )


# PERFIL PERSONAL (/me/)
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def perfil_usuario(request):
    usuario = request.user
    perfil, _ = Perfil.objects.get_or_create(user=usuario)

    if request.method == "GET":
        return Response(
            {
                "id": usuario.id,
                "nombre": usuario.get_full_name() or usuario.username,
                "username": usuario.username,
                "email": usuario.email,
                "rol": perfil.rol,
                "bio": perfil.biografia,
                "foto": (
                    request.build_absolute_uri(perfil.avatar.url)
                    if perfil.avatar
                    else None
                ),
                "filtro_adulto": perfil.filtro_adulto,
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


# REGISTRO
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
            return JsonResponse(
                {
                    "message": "Usuario creado y sesión iniciada",
                    "usuario": {
                        "id": user.id,
                        "nombre": user.first_name or user.username,
                        "username": user.username,
                        "email": user.email,
                    },
                }
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


# SESIÓN
@ensure_csrf_cookie
def session_view(request):
    if request.user.is_authenticated:
        return JsonResponse(
            {
                "authenticated": True,
                "username": request.user.username,
                "nombre": request.user.first_name or request.user.username,
                "id": request.user.id,
                "email": request.user.email,
            }
        )
    return JsonResponse({"authenticated": False})


# LOGIN
@csrf_exempt
def login_view(request):
    data = json.loads(request.body)
    username = data.get("username")
    password = data.get("password")

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return JsonResponse(
            {
                "success": True,
                "token": "session",
                "usuario": {
                    "id": user.id,
                    "nombre": user.first_name or user.username,
                    "username": user.username,
                    "email": user.email,
                },
            }
        )

    return JsonResponse(
        {"success": False, "error": "Credenciales inválidas"}, status=400
    )


# LOGOUT
@csrf_exempt
def logout_view(request):
    if request.method == "POST":
        logout(request)
        return JsonResponse({"success": True})


# uyuyui
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def actualizar_filtro_adulto(request):
    perfil, _ = Perfil.objects.get_or_create(user=request.user)
    filtro_adulto = request.data.get("filtro_adulto")

    if filtro_adulto is not None:
        perfil.filtro_adulto = bool(filtro_adulto)
        perfil.save()
        return Response(
            {
                "filtro_adulto": perfil.filtro_adulto,
                "message": "Filtro de contenido adulto actualizado correctamente",
            }
        )
    else:
        return Response(
            {"error": "No se ha proporcionado el valor de filtro_adulto"}, status=400
        )
