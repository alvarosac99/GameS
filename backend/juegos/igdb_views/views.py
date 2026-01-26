"""Vistas de la API relacionadas con IGDB y la interacción de usuarios."""

import math
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from howlongtobeatpy import HowLongToBeat

from .services import (
    cargar_cache_juegos,
    filtrar_y_ordenar,
    obtener_detalle_juego,
    obtener_filtros,
    calcular_stats_bienvenida,
    buscar_juego_por_id_igdb,
    buscar_en_biblioteca_igdb,
    valorar_juego_service,
    calcular_recomendaciones_usuario,
)
from .utils import DESCARGANDO_KEY


@api_view(["GET"])
@permission_classes([AllowAny])
def listar_juegos(request):
    """Lista juegos almacenados en caché aplicando filtros de búsqueda."""
    try:
        pagina = max(int(request.GET.get("pagina", 1)), 1)
        por_pagina = max(int(request.GET.get("por_pagina", 60)), 1)
    except ValueError:
        pagina, por_pagina = 1, 60

    orden_param = request.GET.get("orden", "popular").lower()
    asc = False
    if orden_param.endswith("_asc"):
        asc = True
        orden_param = orden_param[:-4]

    q = request.GET.get("q", "")
    genero = request.GET.get("genero")
    plataforma = request.GET.get("plataforma")
    publisher = request.GET.get("publisher")

    filtro_adulto_param = request.GET.get("adult")
    filtro_adulto = True
    if request.user.is_authenticated and filtro_adulto_param is not None:
        filtro_adulto = filtro_adulto_param in ["1", "true", "True", True]

    juegos = cargar_cache_juegos()
    if juegos is None:
        return Response(
            {
                "error": "descargando",
                "message": "Estamos recopilando los datos de IGDB. Por favor, espera unos segundos y vuelve a intentarlo.",
                "descargando": True,
            },
            status=status.HTTP_202_ACCEPTED,
        )
    if not juegos:
        return Response({"error": "cache_no_disponible"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    total_sin_filtrar = len(juegos)

    juegos = filtrar_y_ordenar(
        juegos,
        q=q,
        genero=genero,
        plataforma=plataforma,
        publisher=publisher,
        filtro_adulto=filtro_adulto,
        orden=orden_param,
        asc=asc,
    )

    total_filtrado = len(juegos)
    ocultos = total_sin_filtrar - total_filtrado
    offset = (pagina - 1) * por_pagina
    juegos_pagina = juegos[offset: offset + por_pagina]

    return Response(
        {
            "juegos": juegos_pagina,
            "total_resultados": total_filtrado,
            "total_sin_filtrar": total_sin_filtrar,
            "ocultos": ocultos,
            "pagina_actual": pagina,
            "paginas_totales": math.ceil(total_filtrado / por_pagina),
        },
        status=status.HTTP_200_OK,
    )
    
    


@api_view(["GET"])
@permission_classes([AllowAny])
def detalle_juego(request, id):
    """Devuelve la información detallada de un juego por su ID."""
    try:
        juego = obtener_detalle_juego(id)
        if not juego:
            return Response({"error": "Juego no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(juego, status=status.HTTP_200_OK)
    except Exception as e:
        print("Error en detalle_juego:", e)
        return Response(
            {"error": "Error interno del servidor"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def filtros_juegos(request):
    """Obtiene listas de géneros, plataformas y compañías."""
    try:
        return Response(obtener_filtros(), status=status.HTTP_200_OK)
    except Exception as e:
        print("Error en filtros_juegos:", e)
        return Response(
            {"error": "No se pudieron cargar los filtros."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def stats_bienvenida(request):
    """Estadísticas generales mostradas en la página inicial."""
    try:
        return Response(calcular_stats_bienvenida())
    except Exception as e:
        print("Error en stats_bienvenida:", e)
        return Response(
            {"error": "Error interno del servidor"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def buscar_juego_por_id(request):
    """Busca un juego en IGDB por su ID y lo devuelve."""
    game_id = request.GET.get("id")
    if not game_id or not str(game_id).isdigit():
        return Response(
            {"error": "Parámetro 'id' requerido y debe ser numérico."}, status=400
        )

    try:
        juego = buscar_juego_por_id_igdb(game_id)
        if not juego:
            return Response({"error": "No encontrado en IGDB"}, status=404)
        return Response(juego, status=200)
    except Exception as e:
        print("Error buscar_juego_por_id:", e)
        return Response({"error": str(e)}, status=500)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def buscar_en_biblioteca(request):
    """Realiza una búsqueda local en la biblioteca del usuario."""
    q = request.GET.get("q", "").strip().lower()
    if not q:
        return Response([])
    juegos = buscar_en_biblioteca_igdb(q, request.user)
    return Response(juegos)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def valorar_juego(request, juego_id):
    """Consulta o envía la valoración de un juego."""
    try:
        if request.method == "GET":
            datos = valorar_juego_service(juego_id, request.user)
            return Response(datos)

        valor = request.data.get("valor")
        try:
            valor = float(valor)
        except (TypeError, ValueError):
            return Response({"error": "Valor inválido."}, status=400)

        try:
            datos = valorar_juego_service(juego_id, request.user, valor)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)
        return Response(datos)
    except Exception as e:
        print("Error valorar_juego:", e)
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
@permission_classes([AllowAny])
def tiempo_juego(request):
    """Obtiene la duración estimada de un juego mediante HowLongToBeat."""
    nombre = request.GET.get("nombre")
    if not nombre:
        return Response({"error": "nombre requerido"}, status=400)
    try:
        resultados = HowLongToBeat().search(nombre)
        if not resultados:
            return Response({"found": False}, status=200)
        mejor = max(resultados, key=lambda r: r.similarity)
        return Response(
            {
                "found": True,
                "main": mejor.main_story,
                "main_extra": mejor.main_extra,
                "completionist": mejor.completionist,
            }
        )
    except Exception as e:
        print("Error tiempo_juego:", e)
        return Response({"found": False, "error": "hl2b_unavailable"}, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recomendaciones_usuario(request):
    """Devuelve recomendaciones de juegos para el usuario logueado."""
    try:
        juegos = calcular_recomendaciones_usuario(request.user)
        return Response({"recomendaciones": juegos})
    except Exception as e:
        print("Error recomendaciones_usuario:", e)
        return Response(
            {"error": "Error interno del servidor"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
