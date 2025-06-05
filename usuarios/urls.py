"""Rutas disponibles para la gestión de usuarios."""

from django.urls import path
from . import views

urlpatterns = [
    # Autenticación y gestión de sesión
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("session/", views.session_view, name="session"),
    path("register/", views.register_view, name="register"),

    # Perfil de usuarios
    path("perfil-publico/<str:nombre_usuario>/", views.perfil_publico_view),
    path("me/", views.perfil_usuario, name="perfil_usuario"),
    path("buscar/", views.buscar_usuarios, name="buscar_usuarios"),
    path(
        "me/filtro_adulto/",
        views.actualizar_filtro_adulto,
        name="actualizar_filtro_adulto",
    ),
    path("favoritos/", views.actualizar_favoritos, name="actualizar_favoritos"),

    # Seguimiento y bloqueos
    path("seguir/<str:username>/", views.seguir_usuario),
    path("dejar_seguir/<str:username>/", views.dejar_de_seguir),
    path("bloquear/<str:username>/", views.bloquear_usuario),
    path("desbloquear/<str:username>/", views.desbloquear_usuario),

    # Última ruta para mostrar perfiles por nombre de usuario
    path("<str:nombre_usuario>/", views.perfil_publico_view, name="perfil_publico"),
]