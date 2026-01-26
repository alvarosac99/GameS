from rest_framework.permissions import BasePermission

class PuedeVerTodosLosComentarios(BasePermission):
    """Permite el acceso solo a staffs con el permiso adecuado."""

    def has_permission(self, request, view):
        usuario = request.user
        if not usuario.is_authenticated:
            return False
        rol = getattr(getattr(usuario, "perfil", None), "rol", "")
        return rol in ["STAFF", "ADMIN"] and usuario.has_perm("comentarios.ver_comentarios")
