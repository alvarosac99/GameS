"""Reexporta las vistas definidas en `juegos.igdb_views`."""

from .igdb_views.views import (
    listar_juegos,
    detalle_juego,
    filtros_juegos,
    stats_bienvenida,
    buscar_juego_por_id,
    buscar_en_biblioteca,
    valorar_juego,
    tiempo_juego,
    recomendaciones_usuario,
)

from .igdb_views.biblioteca import BibliotecaViewSet
from .igdb_views.planificacion import (
    PlanificacionViewSet,
    PlanificacionCompletadaViewSet,
)
from .developer import JuegoDevViewSet

__all__ = [
    "listar_juegos",
    "detalle_juego",
    "filtros_juegos",
    "stats_bienvenida",
    "buscar_juego_por_id",
    "buscar_en_biblioteca",
    "valorar_juego",
    "tiempo_juego",
    "recomendaciones_usuario",
    "BibliotecaViewSet",
    "PlanificacionViewSet",
    "PlanificacionCompletadaViewSet",
    "JuegoDevViewSet",
]
