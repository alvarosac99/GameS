from django.urls import path
from . import views

urlpatterns = [
    path('<str:nombre_usuario>/', views.actividades_usuario, name='actividades_usuario'),
    path('logros/<str:nombre_usuario>/', views.logros_usuario, name='logros_usuario'),
]
