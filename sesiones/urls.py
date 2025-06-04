from django.urls import path
from . import views

urlpatterns = [
    path("activa/", views.sesion_activa),
    path("iniciar/", views.iniciar_sesion),
    path("finalizar/", views.finalizar_sesion),
]
