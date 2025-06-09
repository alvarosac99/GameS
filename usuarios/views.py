"""Vistas encargadas de la gestión de usuarios y perfiles."""

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
    """Devuelve la información pública de un perfil."""

    user = get_object_or_404(User, username=nombre_usuario)

    # Si el usuario ha sido bloqueado por el objetivo, se rechaza
    if request.user in user.perfil.bloqueados.all():
        return Response({"detail": "Has sido bloqueado por este usuario."}, status=403)

    perfil, _ = Perfil.objects.get_or_create(user=user)

    # Los favoritos se rellenan con "None" hasta completar 5 elementos
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
                else request.build_absolute_uri("/media/avatares/default.jpg")
            ),
            "horas": getattr(perfil, "horas", 0),
            "juegos": getattr(perfil, "juegos", 0),
            "amigos": getattr(perfil, "amigos", 0),
            "seguidores": perfil.seguidores.count(),
            "favoritos": favoritos,
            "gustos_generos": perfil.gustos_generos,
            "bio": perfil.biografia or "",
            "yo_sigo": yo_sigo,
            "yo_lo_bloquee": yo_lo_bloquee,
            "tu_lo_bloqueaste": yo_lo_bloquee,  # <-- ESTE ES EL NUEVO CAMPO
        }
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def perfil_usuario(request):
    """Obtiene o actualiza el perfil del usuario autenticado."""

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
                    else request.build_absolute_uri("/media/avatares/default.jpg")
                ),
                "filtro_adulto": perfil.filtro_adulto,
                "gustos_generos": perfil.gustos_generos,
            }
        )

    elif request.method == "PATCH":
        # Datos que puede modificar el usuario
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

        # Registramos la actividad de actualización de perfil
        registrar_actividad(usuario, "logro", "Actualizó su perfil")

        return Response({"message": "Perfil actualizado correctamente"})


@csrf_exempt
def register_view(request):
    """Registra un nuevo usuario y crea su sesión."""
    if request.method == "POST":
        # Extraemos datos del cuerpo de la petición
        data = json.loads(request.body)

        username = data.get("username")
        password = data.get("password")
        confirmarPassword = data.get("confirmarPassword")
        email = data.get("email")

        # Validamos que todos los campos estén presentes
        if not all([username, password, confirmarPassword, email]):
            return JsonResponse(
                {"error": "Todos los campos son obligatorios"}, status=400
            )

        if password != confirmarPassword:
            return JsonResponse({"error": "Las contraseñas no coinciden"}, status=400)

        # Comprobaciones de unicidad
        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "El usuario ya existe"}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({"error": "Ya existe una cuenta con ese correo"}, status=400)

        try:
            # Creación del nuevo usuario
            user = User.objects.create_user(
                username=username, email=email, password=password
            )
            login(request, user)

            # Registramos que se unió a la comunidad
            registrar_actividad(user, "logro", "Se unió a la comunidad 🎉")

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
            # Cualquier error se envía en la respuesta
            return JsonResponse({"error": str(e)}, status=500)


@ensure_csrf_cookie
def session_view(request):
    """Devuelve el estado de autenticación de la sesión actual."""
    if request.user.is_authenticated:
        return JsonResponse(
            {
                "authenticated": True,
                "username": request.user.username,
                "nombre": request.user.first_name or request.user.username,
                "id": request.user.id,
                "email": request.user.email,
                "rol": getattr(request.user.perfil, "rol", "PLAYER"),
            }
        )
    return JsonResponse({"authenticated": False})


@csrf_exempt
def login_view(request):
    """Inicia la sesión del usuario si las credenciales son válidas."""
    data = json.loads(request.body)
    username = data.get("username")
    password = data.get("password")

    # Autenticamos al usuario
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
                    "rol": getattr(user.perfil, "rol", "PLAYER"),
                },
            }
        )

    return JsonResponse(
        {"success": False, "error": "Credenciales inválidas"}, status=400
    )


@csrf_exempt
def logout_view(request):
    """Cierra la sesión del usuario actual."""
    if request.method == "POST":
        logout(request)
        return JsonResponse({"success": True})


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def actualizar_filtro_adulto(request):
    """Actualiza la preferencia de filtro de contenido adulto."""
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
    """Guarda la lista de juegos favoritos del usuario."""
    favoritos = request.data.get("favoritos", [])
    # Validamos que sea una lista y que no supere el máximo permitido
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
    """Realiza una búsqueda simple de usuarios por nombre o username."""

    q = request.GET.get("q", "").strip().lower()

    if not q or len(q) < 2:
        return Response({"resultados": []})

    usuarios = (
        User.objects.filter(username__icontains=q)
        | User.objects.filter(first_name__icontains=q)
    ).distinct()[:10]

    # Evitamos usuarios duplicados en el resultado
    encontrados = []
    ids_vistos = set()
    for user in usuarios:
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
    """Permite seguir a otro usuario."""
    objetivo = get_object_or_404(User, username=username)
    perfil_objetivo = getattr(objetivo, "perfil", None)
    perfil_actual = request.user.perfil

    if objetivo == request.user:
        return Response({"error": "No puedes seguirte a ti mismo."}, status=400)

    if perfil_objetivo in perfil_actual.bloqueados.all():
        return Response(
            {"error": "Debes desbloquear al usuario para seguirlo."}, status=400
        )

    if not perfil_objetivo.seguidores.filter(id=request.user.id).exists():
        perfil_objetivo.seguidores.add(request.user)
        registrar_actividad(
            request.user, "seguimiento", f"Siguió a {objetivo.username}"
        )
        from notificaciones.utils import crear_notificacion
        crear_notificacion(
            objetivo,
            f"{request.user.username} te ha seguido",
            link=f"/perfil/{request.user.username}"
        )

    return Response({"ok": True, "mensaje": f"Ahora sigues a {objetivo.username}."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def dejar_de_seguir(request, username):
    """Deja de seguir al usuario indicado."""
    objetivo = get_object_or_404(User, username=username)
    perfil_objetivo = getattr(objetivo, "perfil", None)

    perfil_objetivo.seguidores.remove(request.user)
    return Response(
        {"ok": True, "mensaje": f"Has dejado de seguir a {objetivo.username}."}
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bloquear_usuario(request, username):
    """Bloquea al usuario indicado y lo elimina de seguidores."""
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
    """Elimina al usuario indicado de la lista de bloqueados."""
    objetivo = get_object_or_404(User, username=username)
    perfil_actual = request.user.perfil

    perfil_actual.bloqueados.remove(objetivo)
    return Response({"ok": True, "mensaje": f"Has desbloqueado a {objetivo.username}."})
