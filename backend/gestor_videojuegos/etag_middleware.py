"""Middleware para añadir ETags automáticamente a todas las respuestas GET."""

from gestor_videojuegos.etag_utils import generate_etag, check_etag
from rest_framework.response import Response
from rest_framework import status as http_status


class AutoETagMiddleware:
    """
    Middleware que añade ETags automáticamente a todas las respuestas GET de la API.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Procesar la petición
        response = self.get_response(request)

        # Solo aplicar a peticiones GET de la API
        if request.method != 'GET':
            return response

        # Solo aplicar a respuestas DRF con datos JSON
        if not isinstance(response, Response):
            return response

        # No aplicar a respuestas de error
        if response.status_code >= 400:
            return response

        # Generar ETag basado en el contenido de la respuesta
        try:
            etag = generate_etag(response.data)
        except Exception:
            # Si falla, devolver respuesta sin ETag
            return response

        # Verificar si el cliente tiene la versión actual
        if check_etag(request, etag):
            # Devolver 304 Not Modified
            response = Response(status=http_status.HTTP_304_NOT_MODIFIED)
            response['ETag'] = f'"{etag}"'
            return response

        # Añadir ETag a la respuesta
        response['ETag'] = f'"{etag}"'
        
        # Configurar Cache-Control para trabajar con Cloudflare
        # public: permite que Cloudflare y navegadores cacheen
        # max-age=0: fuerza revalidación en cada petición
        # must-revalidate: debe validar con el servidor si está expirado
        if 'Cache-Control' not in response:
            response['Cache-Control'] = 'public, max-age=0, must-revalidate'
        
        # Añadir Vary para que Cloudflare cachee por Authorization
        # Esto asegura que usuarios diferentes no compartan caché
        if 'Vary' not in response:
            response['Vary'] = 'Accept-Encoding, Authorization'

        return response
