from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("session/", views.session_view, name="session"),
    path("register/", views.register_view, name="register"),
    path('me/', views.perfil_usuario, name='perfil_usuario'),
    path("<str:nombre_usuario>/", views.perfil_publico_view, name='perfil_publico'),
]
