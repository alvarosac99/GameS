from django.urls import path
from . import views

urlpatterns = [
    path("populares/", views.listar_juegos, name="listar_juegos"),
    path("detalle/<int:id>/", views.detalle_juego, name="detalle_juego"),
]
