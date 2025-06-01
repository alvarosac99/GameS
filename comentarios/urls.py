from django.urls import path
from . import views

urlpatterns = [
    path('juego/<int:juego_id>/', views.ComentariosJuegoView.as_view(), name='comentarios_juego'),
    path('responder/', views.ResponderComentarioView.as_view(), name='responder_comentario'),
    path('borrar/<int:pk>/', views.BorrarComentarioView.as_view(), name='borrar_comentario'),
]