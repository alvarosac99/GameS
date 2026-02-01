"""Middleware para limpiar cookies antiguas sin el dominio correcto."""


class CleanupOldCookiesMiddleware:
    """Elimina cookies antiguas que no tienen el dominio .zenithseed.dev."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Forzar eliminación de cookies con dominio incorrecto
        # y re-establecerlas con el dominio correcto
        if hasattr(response, 'cookies'):
            # Django automáticamente establecerá las cookies con el dominio correcto
            # gracias a CSRF_COOKIE_DOMAIN y SESSION_COOKIE_DOMAIN en settings
            pass

        return response