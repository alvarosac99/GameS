import math
import requests
from django.conf import settings
from rest_framework import viewsets, permissions
from rest_framework.response import Response

from .utils import obtener_token_igdb, IGDB_BASE_URL, chunked
from ..models import Biblioteca
from ..serializers import BibliotecaSerializer
from actividad.utils import registrar_actividad, otorgar_logro


class BibliotecaViewSet(viewsets.ModelViewSet):
    serializer_class = BibliotecaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Biblioteca.objects.filter(user=self.request.user)
        game_id = self.request.query_params.get("game_id")
        if game_id:
            qs = qs.filter(game_id=game_id)
        return qs

    def perform_create(self, serializer):
        instancia = serializer.save(user=self.request.user)
        registrar_actividad(
            self.request.user,
            "juego_agregado",
            f"Añadió *{instancia.game_id}* a su biblioteca",
        )
        if Biblioteca.objects.filter(user=self.request.user).count() == 1:
            otorgar_logro(self.request.user, "primer_juego")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        total = qs.count()

        game_id = request.query_params.get("game_id")
        if game_id:
            serializer = self.get_serializer(qs, many=True)
            return Response(serializer.data)

        try:
            pagina = max(int(request.GET.get("pagina", 1)), 1)
            por_pagina = max(int(request.GET.get("por_pagina", 60)), 1)
        except Exception:
            pagina, por_pagina = 1, 60

        offset = (pagina - 1) * por_pagina
        paginados = qs[offset : offset + por_pagina]

        game_ids = [b.game_id for b in paginados]
        if not game_ids:
            return Response(
                {
                    "juegos": [],
                    "pagina_actual": pagina,
                    "paginas_totales": 1,
                    "total_resultados": 0,
                }
            )

        token = obtener_token_igdb()
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
        }

        todos_juegos = []
        campos = (
            "id, name, summary, cover.url, first_release_date, "
            "screenshots.url, platforms.name, genres.name, "
            "aggregated_rating, rating_count, websites.url, websites.category"
        )
        for batch in chunked(game_ids, 500):
            ids_str = ",".join(str(i) for i in batch)
            q_str = f"fields {campos}; where id = ({ids_str}); limit {len(batch)};"
            res = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=q_str)
            if res.status_code == 200:
                todos_juegos.extend(res.json())
            else:
                print(f"[IGDB] Error al obtener datos de juegos: {res.text}")

        return Response(
            {
                "juegos": todos_juegos,
                "pagina_actual": pagina,
                "paginas_totales": math.ceil(total / por_pagina),
                "total_resultados": total,
            }
        )
