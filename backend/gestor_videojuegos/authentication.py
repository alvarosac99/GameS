"""Autenticación personalizada para evitar problemas con CSRF."""

from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication sin validación CSRF.
    
    Útil cuando hay problemas con cookies duplicadas o dominios.
    """

    def enforce_csrf(self, request):
        """
        Sobrescribe el método para no validar CSRF.
        """
        return  # No hacer nada, no validar CSRF
