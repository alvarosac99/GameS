from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("session/", views.session_view, name="session"),
    path("register/", views.register_view, name="register"),
    path("perfil-publico/<str:nombre_usuario>/", views.perfil_publico_view),
    path('me/', views.perfil_usuario, name='perfil_usuario'),
    path('buscar/', views.buscar_usuarios, name='buscar_usuarios'),
    path('me/filtro_adulto/', views.actualizar_filtro_adulto, name='actualizar_filtro_adulto'),
    path('favoritos/', views.actualizar_favoritos, name='actualizar_favoritos'),
    path("<str:nombre_usuario>/", views.perfil_publico_view, name='perfil_publico'),
    
]