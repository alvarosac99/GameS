"""Utilidades para generar ETags basados en datos de modelos."""

from hashlib import md5
import json
from django.db import models
from functools import wraps
from rest_framework.response import Response
from rest_framework import status as http_status


def generate_etag(*args):
    """
    Genera un ETag único basado en los argumentos proporcionados.
    
    Args:
        *args: Cualquier número de valores para incluir en el ETag
        
    Returns:
        str: Hash MD5 de los argumentos concatenados
    """
    # Convertir todos los argumentos a string y concatenar
    content_parts = []
    for arg in args:
        if isinstance(arg, models.Model):
            # Para modelos Django, usar pk
            content_parts.append(str(arg.pk))
        elif isinstance(arg, (list, dict)):
            # Para estructuras de datos, usar JSON
            content_parts.append(json.dumps(arg, sort_keys=True))
        else:
            content_parts.append(str(arg))
    
    content = ":".join(content_parts)
    return md5(content.encode()).hexdigest()


def check_etag(request, etag):
    """
    Verifica si el cliente tiene la versión actual basándose en el ETag.
    
    Args:
        request: Request de Django
        etag: ETag del servidor
        
    Returns:
        bool: True si el cliente tiene la versión actual
    """
    client_etag = request.META.get('HTTP_IF_NONE_MATCH', '').strip('"')
    return client_etag and client_etag == etag


def with_etag(etag_func=None):
    """
    Decorador para añadir soporte de ETag automático a vistas DRF.
    
    Uso:
        @with_etag(lambda request, response: generate_etag(response.data))
        def mi_vista(request):
            return Response({"data": "..."})
    
    O para generar ETag basado en el contenido de la respuesta:
        @with_etag()
        def mi_vista(request):
            return Response({"data": "..."})
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Solo aplicar ETags a peticiones GET
            if request.method != 'GET':
                return view_func(request, *args, **kwargs)
            
            # Ejecutar la vista original
            response = view_func(request, *args, **kwargs)
            
            # Si no es una Response de DRF, devolver sin modificar
            if not isinstance(response, Response):
                return response
            
            # Generar ETag
            if etag_func:
                # Usar función personalizada
                etag = etag_func(request, response)
            else:
                # Generar ETag basado en el contenido de la respuesta
                etag = generate_etag(response.data)
            
            # Verificar si el cliente tiene la versión actual
            if check_etag(request, etag):
                # Devolver 304 Not Modified
                response = Response(status=http_status.HTTP_304_NOT_MODIFIED)
                response['ETag'] = f'"{etag}"'
                return response
            
            # Añadir ETag a la respuesta
            response['ETag'] = f'"{etag}"'
            response['Cache-Control'] = 'private, max-age=0, must-revalidate'
            
            return response
        
        return wrapper
    return decorator

