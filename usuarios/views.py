from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from usuarios.models import Perfil
from django.shortcuts import get_object_or_404
from actividad.utils import registrar_actividad
import json

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def perfil_publico_view(request, nombre_usuario):
    user = get_object_or_404(User, username=nombre_usuario)

    # Si el usuario ha sido bloqueado por el objetivo, se rechaza
    if request.user in user.perfil.bloqueados.all():
        return Response({"detail": "Has sido bloqueado por este usuario."}, status=403)

    perfil, _ = Perfil.objects.get_or_create(user=user)
    favoritos = perfil.favoritos if perfil.favoritos else []
    favoritos = list(favoritos) + [None] * (5 - len(favoritos))
    favoritos = favoritos[:5]

    yo_sigo = perfil.seguidores.filter(id=request.user.id).exists()
    yo_lo_bloquee = request.user.perfil.bloqueados.filter(id=user.id).exists()

    return Response(
        {
            "id": user.id,
            "nombre": user.first_name or user.username,
            "username": user.username,
            "email": user.email,
            "es_mi_perfil": request.user.username == user.username,
            "foto": (
                request.build_absolute_uri(perfil.avatar.url)
                if perfil.avatar
                else request.build_absolute_uri("/media/avatares/default.png")
            ),
            "horas": getattr(perfil, "horas", 0),
            "juegos": getattr(perfil, "juegos", 0),
            "amigos": getattr(perfil, "amigos", 0),
            "seguidores": perfil.seguidores.count(),
            "favoritos": favoritos,
            "bio": perfil.biografia or "",
            "yo_sigo": yo_sigo,
            "yo_lo_bloquee": yo_lo_bloquee,
            "tu_lo_bloqueaste": yo_lo_bloquee,  # <-- ESTE ES EL NUEVO CAMPO
        }
    )


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

        registrar_actividad(usuario, "logro", "Actualizó su perfil")  # NUEVO

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

            registrar_actividad(user, "logro", "Se unió a la comunidad 🎉")  # NUEVO

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


@csrf_exempt
def logout_view(request):
    if request.method == "POST":
        logout(request)
        return JsonResponse({"success": True})


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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def actualizar_favoritos(request):
    favoritos = request.data.get("favoritos", [])
    if not isinstance(favoritos, list) or len(favoritos) > 5:
        return Response(
            {"error": "Solo puedes tener hasta 5 juegos favoritos."}, status=400
        )

    perfil = getattr(request.user, "perfil", None)
    if not perfil:
        perfil, _ = Perfil.objects.get_or_create(user=request.user)
    perfil.favoritos = favoritos
    perfil.save()

    registrar_actividad(
        request.user, "juego_agregado", "Actualizó sus juegos favoritos"
    )  # NUEVO

    return Response({"ok": True})


@api_view(["GET"])
@permission_classes([AllowAny])
def buscar_usuarios(request):
    q = request.GET.get("q", "").strip().lower()
    print(">>> Recibida búsqueda:", q)
    usuarios = User.objects.filter(username__icontains=q) | User.objects.filter(
        first_name__icontains=q
    )
    print(">>> Resultados:", usuarios)
    if not q or len(q) < 2:
        return Response({"resultados": []})

    usuarios = User.objects.filter(username__icontains=q) | User.objects.filter(
        first_name__icontains=q
    )

    encontrados = []
    ids_vistos = set()
    for user in usuarios.distinct()[:10]:
        if user.id in ids_vistos:
            continue
        ids_vistos.add(user.id)
        perfil = getattr(user, "perfil", None)
        if not perfil:
            perfil = Perfil.objects.filter(user=user).first()
        encontrados.append(
            {
                "username": user.username,
                "nombre": user.first_name or user.username,
                "foto": (
                    request.build_absolute_uri(perfil.avatar.url)
                    if perfil and perfil.avatar
                    else request.build_absolute_uri("/media/avatares/default.png")
                ),
            }
        )

    return Response({"resultados": encontrados})


# SEGUIR Y BLOQUEAR


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def seguir_usuario(request, username):
    objetivo = get_object_or_404(User, username=username)
    perfil_objetivo = getattr(objetivo, "perfil", None)
    perfil_actual = request.user.perfil

    if objetivo == request.user:
        return Response({"error": "No puedes seguirte a ti mismo."}, status=400)

    if perfil_objetivo in perfil_actual.bloqueados.all():
        return Response(
            {"error": "Debes desbloquear al usuario para seguirlo."}, status=400
        )

    perfil_objetivo.seguidores.add(request.user)

    if not perfil_objetivo.seguidores.filter(id=request.user.id).exists():
        registrar_actividad(
            request.user, "seguimiento", f"Siguió a {objetivo.username}"
        )

    return Response({"ok": True, "mensaje": f"Ahora sigues a {objetivo.username}."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def dejar_de_seguir(request, username):
    objetivo = get_object_or_404(User, username=username)
    perfil_objetivo = getattr(objetivo, "perfil", None)

    perfil_objetivo.seguidores.remove(request.user)
    return Response(
        {"ok": True, "mensaje": f"Has dejado de seguir a {objetivo.username}."}
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bloquear_usuario(request, username):
    objetivo = get_object_or_404(User, username=username)
    perfil_actual = request.user.perfil

    if objetivo == request.user:
        return Response({"error": "No puedes bloquearte a ti mismo."}, status=400)

    perfil_actual.bloqueados.add(objetivo)
    # Deja de seguir automáticamente
    objetivo.perfil.seguidores.remove(request.user)
    perfil_actual.seguidores.remove(objetivo)

    return Response({"ok": True, "mensaje": f"Has bloqueado a {objetivo.username}."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def desbloquear_usuario(request, username):
    objetivo = get_object_or_404(User, username=username)
    perfil_actual = request.user.perfil

    perfil_actual.bloqueados.remove(objetivo)
    return Response({"ok": True, "mensaje": f"Has desbloqueado a {objetivo.username}."})
