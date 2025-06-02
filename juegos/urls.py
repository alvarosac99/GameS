# src/apps/juegos/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"biblioteca", views.BibliotecaViewSet, basename="biblioteca")

urlpatterns = [
    path("stats_bienvenida/", views.stats_bienvenida, name="stats_bienvenida"),
    path("filtros/", views.filtros_juegos, name="filtros_juegos"),
    # Listado de juegos (alias populares/)
    path("populares/", views.listar_juegos, name="listar_juegos"),
    # Detalle de un juego por ID
    path("detalle/<int:id>/", views.detalle_juego, name="detalle_juego"),
    # Rutas de BibliotecaViewSet: list, create, retrieve, update, destroy...
    path("", include(router.urls)),
    # Juegos por ID
    path("buscar_id/", views.buscar_juego_por_id, name="buscar_juego_por_id"),
    path("valoracion/<int:juego_id>/", views.valorar_juego, name="valorar_juego"),
]
