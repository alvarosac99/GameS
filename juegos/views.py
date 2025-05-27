import math
import requests
from django.conf import settings
from django.core.cache import cache

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Biblioteca
from .serializers import BibliotecaSerializer

IGDB_BASE_URL = "https://api.igdb.com/v4"


def obtener_token_igdb():
    token = cache.get("igdb_token")
    if not token:
        auth = requests.post(
            "https://id.twitch.tv/oauth2/token",
            data={
                "client_id": settings.IGDB_CLIENT_ID,
                "client_secret": settings.IGDB_CLIENT_SECRET,
                "grant_type": "client_credentials",
            },
        )
        auth.raise_for_status()
        token = auth.json()["access_token"]
        cache.set("igdb_token", token, timeout=auth.json().get("expires_in", 3600))
    return token


@api_view(["GET"])
@permission_classes([AllowAny])
def listar_juegos(request):
    """
    Lista juegos con:
      - búsqueda por texto (q)
      - filtros (genero, plataforma, publisher)
      - orden y paginación delegados a IGDB
    """
    try:
        page = int(request.GET.get("page", 1))
        per_page = int(request.GET.get("per_page", 60))
        orden = request.GET.get("orden", "popular")
        q = request.GET.get("q", "").strip()
        genero = request.GET.get("genero")
        plataforma = request.GET.get("plataforma")
        publisher = request.GET.get("publisher")

        # Construir cláusulas WHERE y SEARCH
        clauses = []
        if genero:
            clauses.append(f"genres = ({genero})")
        if plataforma:
            clauses.append(f"platforms = ({plataforma})")
        if publisher:
            clauses.append(
                f"involved_companies.publisher = true & involved_companies.company = ({publisher})"
            )
        where_part = f"where {' & '.join(clauses)};" if clauses else ""
        search_part = f'search "{q}";' if q else ""

        # Construir orden solo si no hay búsqueda
        sort_part = ""
        if not q:
            if orden == "nombre":
                sort_part = "sort name asc;"
            elif orden == "fecha":
                sort_part = "sort first_release_date desc;"
            else:
                sort_part = "sort popularity desc;"

        # Preparar headers comunes
        token = obtener_token_igdb()
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
        }

        # 1) Obtener total mediante endpoint /games/count
        count_parts = [search_part, where_part, "count;"]
        count_query = " ".join(p for p in count_parts if p)
        res_count = requests.post(
            f"{IGDB_BASE_URL}/games/count", headers=headers, data=count_query
        )
        res_count.raise_for_status()
        # IGDB devuelve un número entero en el body, p.ej. 400
        total = int(res_count.text) if res_count.text.isdigit() else 0
        paginas = math.ceil(total / per_page) if total > 0 else 0

        # 2) Obtener página concreta
        offset = (page - 1) * per_page
        fields = [
            "id",
            "name",
            "summary",
            "cover.url",
            "first_release_date",
            "aggregated_rating",
            "rating_count",
            "genres",
            "platforms",
            "involved_companies.publisher",
            "involved_companies.company",
        ]
        query_parts = [search_part, where_part, sort_part]
        query_parts.append(f"fields {', '.join(fields)};")
        query_parts.append(f"limit {per_page};")
        query_parts.append(f"offset {offset};")
        games_query = " ".join(p for p in query_parts if p)

        res = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=games_query)
        res.raise_for_status()
        juegos = res.json()

    except requests.exceptions.HTTPError as err:
        print(f"IGDB HTTPError {res.status_code}: {res.text}")
        return Response(
            {
                "juegos": [],
                "pagina_actual": page,
                "paginas_totales": paginas,
                "total_resultados": total,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        print("Error interno listar_juegos:", e)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(
        {
            "juegos": juegos,
            "pagina_actual": page,
            "paginas_totales": paginas,
            "total_resultados": total,
        },
        status=status.HTTP_200_OK,
    )


def chunked(iterable, size):
    for i in range(0, len(iterable), size):
        yield iterable[i : i + size]


@api_view(["GET"])
@permission_classes([AllowAny])
def detalle_juego(request, id):
    """
    Recupera todos los datos de un juego por su ID desde IGDB, incluyendo idiomas.
    """
    try:
        token = obtener_token_igdb()
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
        }

        query = f"""
            fields id, name, summary, storyline, first_release_date, cover.url,
                   screenshots.url, platforms.name, genres.name,
                   involved_companies.company.name, involved_companies.developer,
                   involved_companies.publisher, videos.video_id,
                   aggregated_rating, rating_count, collection.name,
                   age_ratings.rating, themes.name, game_modes.name,
                   player_perspectives.name, websites.url, websites.category,
                   similar_games.name, similar_games.cover.url,
                   language_supports;
            where id = {id};
        """
        res = requests.post(
            f"{IGDB_BASE_URL}/games", headers=headers, data=query.strip()
        )
        if res.status_code != 200:
            return Response(
                {"error": "Error al obtener datos del juego desde IGDB"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        data = res.json()
        if not data:
            return Response(
                {"error": "Juego no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        juego = data[0]

        # Idiomas
        language_ids = juego.get("language_supports", [])
        idiomas = []
        if language_ids:
            ids_str = ",".join(str(i) for i in language_ids)
            q_ids = f"fields language.name,language.native_name; where id=({ids_str});"
            res_ids = requests.post(
                f"{IGDB_BASE_URL}/language_support", headers=headers, data=q_ids
            )
            if res_ids.status_code == 200:
                for l in res_ids.json():
                    lang = l.get("language") or {}
                    name = lang.get("name") or lang.get("native_name")
                    if name:
                        idiomas.append(name)
        juego["idiomas"] = idiomas
        return Response(juego, status=status.HTTP_200_OK)

    except Exception as e:
        print("Error en detalle_juego:", e)
        return Response(
            {"error": "Error interno del servidor"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


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
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        if request.query_params.get("game_id"):
            serializer = self.get_serializer(self.get_queryset(), many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        qs = self.get_queryset()
        game_ids = [b.game_id for b in qs]
        if not game_ids:
            return Response({"juegos": []}, status=status.HTTP_200_OK)

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
            q_str = f"fields {campos}; where id = ({ids_str});"
            res = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=q_str)
            if res.status_code == 200:
                todos_juegos.extend(res.json())

        return Response({"juegos": todos_juegos}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def filtros_juegos(request):
    """
    Devuelve listas de géneros, plataformas y publishers para poblar filtros en el front.
    """
    try:
        token = obtener_token_igdb()
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
        }

        # Géneros
        res_gen = requests.post(
            f"{IGDB_BASE_URL}/genres",
            headers=headers,
            data="fields id,name; limit 500;",
        )
        genres = res_gen.json() if res_gen.status_code == 200 else []

        # Plataformas
        res_plat = requests.post(
            f"{IGDB_BASE_URL}/platforms",
            headers=headers,
            data="fields id,name; limit 500;",
        )
        platforms = res_plat.json() if res_plat.status_code == 200 else []

        # Publishers
        res_pub = requests.post(
            f"{IGDB_BASE_URL}/companies",
            headers=headers,
            data="fields id,name; where published = true; limit 500;",
        )
        publishers = res_pub.json() if res_pub.status_code == 200 else []

        return Response(
            {
                "genres": genres,
                "platforms": platforms,
                "publishers": publishers,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        print("Error en filtros_juegos:", e)
        return Response(
            {"error": "No se pudieron cargar los filtros."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
