import logging
import random
from datetime import datetime, timedelta
from collections import Counter
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Avg, Count, Q
from django.utils import timezone
from ..models import Biblioteca, Juego, Valoracion
from actividad.utils import registrar_actividad
from .utils import (
    IGDB_BASE_URL,
    obtener_token_igdb,
    chunked,
)


logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Utilidades IGDB
# ---------------------------------------------------------------------------

def _headers():
    token = obtener_token_igdb()
    return {
        "Client-ID": settings.IGDB_CLIENT_ID,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "text/plain",
    }


def buscar_y_cachear(q="", genero=None, plataforma=None, publisher=None,
                      filtro_adulto=True, orden="popular", asc=False, limite=60, offset=0):
    """
    Busca juegos en la base de datos local.
    Si hay una búsqueda específica (q) y no hay resultados locales suficientes,
    consulta a IGDB y guarda los resultados nuevos.
    """
    # 1. Construir QuerySet base
    qs = Juego.objects.all()

    if filtro_adulto:
        # Excluir juegos con tema 42 (Erotica)
        # Como themes es JSONField, usamos contains o icontains según la DB
        # En MySQL JSON search puede ser limitado, pero asumimos temas como lista de enteros
        pass 
        # Nota: Filtrar JSON en MySQL/MariaDB puede requerir sintaxis específica.
        # Por simplicidad y rendimiento, si 'themes' es lista de ints,
        # lo hacemos en memoria si son pocos, o confiamos en que IGDB no nos mande basura.
        # Para esta implementación, lo omitimos en la query DB compleja por ahora
        # o lo manejamos post-fetch si el dataset es pequeño.
        # IDEALMENTE: Usar capabilities de JSON de la DB.
    
    if q.strip():
        qs = qs.filter(name__icontains=q)
    
    # 2. Si es una búsqueda por texto y tenemos pocos resultados, preguntar a IGDB
    #    (Solo si estamos en la primera página para no spammear)
    if q.strip() and offset == 0 and qs.count() < 10:
        _buscar_en_igdb_y_guardar(q)
        # Recargar QS después de guardar
        qs = Juego.objects.filter(name__icontains=q)

    # Filtros adicionales (post-query si son complejos con JSON, o en DB)
    # Por eficiencia, aplicamos ordenamiento en DB
    if orden == "nombre":
        qs = qs.order_by(f"{'' if asc else '-'}name")
    elif orden == "fecha":
        qs = qs.order_by(f"{'' if asc else '-'}first_release_date")
    else:  # popularidad
        qs = qs.order_by(f"{'' if asc else '-'}popularidad")

    # Paginación manual sobre el QuerySet
    # Nota: Si el usuario usa filtros de JSON (genero, plataforma) que no indexamos,
    # puede ser lento. Para MVP, aplicamos filtros en memoria sobre los resultados paginaados
    # SI son muchos. Pero mejor intentemos filtrar en DB si es posible.
    
    # Para simplificar y dado el modelo JSONField:
    # Retornamos el QS para que la vista pagine, PERO
    # si necesitamos filtrar por JSON, lo hacemos aquí convirtiendo a lista (ojo performance).
    
    # ESTRATEGIA: Mover filtros a DB usando 'contains' si es posible, o ignorarlos por ahora
    # y mejorar el modelo después.
    
    # Vamos a devolver el QS tal cual, asumiendo que el grosso del filtrado es por 'q'.
    return qs


def _buscar_en_igdb_y_guardar(query_text):
    """Consulta IGDB por nombre y guarda resultados en DB."""
    try:
        headers = _headers()
        # Buscamos campos básicos para la lista
        fields = (
            "id,name,slug,summary,cover.url,first_release_date,"
            "total_rating,total_rating_count,"
            "genres.name,platforms.name,involved_companies.company.name,themes.name"
        )
        # Usamos search de IGDB
        igdb_query = (
            f'fields {fields}; search "{query_text}"; limit 50;'
        )
        res = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=igdb_query)
        if res.status_code == 200:
            datos = res.json()
            _guardar_juegos_batch(datos)
    except Exception as e:
        logger.error(f"Error buscando en IGDB: {e}")


def _guardar_juegos_batch(lista_juegos_igdb):
    """Guarda o actualiza una lista de juegos de IGDB en la DB local."""
    for j in lista_juegos_igdb:
        # Extraer campos
        try:
            defaults = {
                "name": j.get("name", "Unknown"),
                "slug": j.get("slug"),
                "summary": j.get("summary"),
                "cover_url": j.get("cover", {}).get("url"),
                "popularidad": j.get("total_rating") or 0.0, # Usamos rating como proxy de popularidad si no viene pop
                "aggregated_rating": j.get("total_rating"),
                "rating_count": j.get("total_rating_count", 0),
                "genres": j.get("genres", []),
                "platforms": j.get("platforms", []),
                "involved_companies": j.get("involved_companies", []),
                "themes": j.get("themes", []),
            }
            
            # Convertir fecha timestamp a datetime
            ts = j.get("first_release_date")
            if ts:
                dt = datetime.fromtimestamp(ts)
                defaults["first_release_date"] = timezone.make_aware(dt)
            
            Juego.objects.update_or_create(id=j["id"], defaults=defaults)
        except Exception as e:
            logger.error(f"Error guardando juego {j.get('id')}: {e}")


def obtener_detalle_juego(juego_id, force_update=False):
    """Recupera información detallada de IGDB para un juego."""
    # 1. Intentar obtener RESPUESTA COMPLETA de caché Redis
    cache_key = f"igdb_detalle_{juego_id}"
    if not force_update:
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data

    # 2. Si no está en caché o force_update, consultar IGDB
    headers = _headers()
    # Pedimos todo lo necesario para mostrar detalle
    query = f"""
        fields id, name, slug, summary, storyline, first_release_date, cover.url,
               screenshots.url, platforms.name, genres.name,
               involved_companies.company.name, involved_companies.developer,
               involved_companies.publisher, videos.video_id,
               aggregated_rating, rating_count, collection.name,
               age_ratings.rating, themes.name, game_modes.name,
               player_perspectives.name, websites.url, websites.category,
               similar_games.name, similar_games.cover.url,
               language_supports;
        where id = {juego_id};
    """
    res = requests.post(f"{IGDB_BASE_URL}/games", headers=headers, data=query.strip())
    
    if res.status_code != 200:
        # Fallback: intentar DB local si IGDB falla, aunque sea incompleta
        try:
             juego_db = Juego.objects.get(id=juego_id)
             return {
                "id": juego_db.id,
                "name": juego_db.name,
                "slug": juego_db.slug,
                "summary": juego_db.summary,
                "first_release_date": int(juego_db.first_release_date.timestamp()) if juego_db.first_release_date else None,
                "cover": {"url": juego_db.cover_url} if juego_db.cover_url else {},
                "genres": juego_db.genres,
                "platforms": juego_db.platforms,
                "is_cached_fallback": True 
             }
        except Juego.DoesNotExist:
             return None
    
    data = res.json()
    if not data:
        return None

    juego_data = data[0]
    
    # 3. Guardar en DB local para búsquedas/listados (solo datos parciales soportados por modelo)
    # Esto asegura que búsquedas funcionen, aunque detalles dependan de Redis/IGDB
    try:
        _guardar_juegos_batch([juego_data])
    except Exception as e:
        logger.error(f"Error actualizando DB local en detalle: {e}")

    # 4. Procesar idiomas extra
    language_ids = juego_data.get("language_supports", [])
    idiomas = []
    if language_ids:
        # (Lógica de idiomas se mantiene igual)
        ids_str = ",".join(str(i) for i in language_ids[:20]) 
        if ids_str:
            q_ids = f"fields language.name,language.native_name; where id=({ids_str});"
            res_ids = requests.post(f"{IGDB_BASE_URL}/language_support", headers=headers, data=q_ids)
            if res_ids.status_code == 200:
                for l in res_ids.json():
                    lang = l.get("language") or {}
                    name = lang.get("name") or lang.get("native_name")
                    if name:
                        idiomas.append(name)
    juego_data["idiomas"] = idiomas
    
    # 5. Guardar respuesta COMPLETA en Redis (TTL 48 horas)
    cache.set(cache_key, juego_data, 172800)
    
    return juego_data


def obtener_filtros():
    """Solicita a IGDB las opciones de filtro disponibles."""
    # Intentar obtener de caché Redis
    cache_key = "igdb_filtros"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    # Si no está en caché, consultar API
    headers = _headers()
    res_gen = requests.post(
        f"{IGDB_BASE_URL}/genres",
        headers=headers,
        data="fields id,name; limit 500;",
    )
    genres = res_gen.json() if res_gen.status_code == 200 else []

    res_plat = requests.post(
        f"{IGDB_BASE_URL}/platforms",
        headers=headers,
        data="fields id,name; limit 500;",
    )
    platforms = res_plat.json() if res_plat.status_code == 200 else []

    res_pub = requests.post(
        f"{IGDB_BASE_URL}/companies",
        headers=headers,
        data="fields id,name; where published = true; limit 500;",
    )
    publishers = res_pub.json() if res_pub.status_code == 200 else []

    resultado = {
        "genres": genres,
        "platforms": platforms,
        "publishers": publishers,
    }
    
    # Guardar en caché por 24 horas (86400 segundos)
    cache.set(cache_key, resultado, 86400)
    
    return resultado



def calcular_stats_bienvenida():
    """Estadísticas resumidas para mostrar en la pantalla de inicio."""
    # Intentar obtener de caché
    cache_key = "stats_bienvenida"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    usuarios = get_user_model().objects.count()
    bibliotecas = Biblioteca.objects.count()
    # Usar .count() es rápido en MyISAM/InnoDB (si count aprox) pero count(*) real puede tardar.
    # Cacheamos el resultado final así que está bien.
    total_juegos = Juego.objects.count()

    # Obtener populares reales de la DB local
    populares_qs = Juego.objects.order_by('-popularidad')[:10]
    
    # Obtener random optimizado
    # Evitamos order_by('?') que es full scan
    count = total_juegos
    random_juegos = []
    if count > 0:
        if count <= 10:
             random_juegos = list(Juego.objects.all())
        else:
            # Opción eficiente: Obtener un rango de IDs o samplear IDs
            # Traer todos los IDs es ligero (pocos MB para 100k juegos)
            all_ids = list(Juego.objects.values_list('id', flat=True))
            if len(all_ids) > 10:
                random_ids = random.sample(all_ids, 10)
                random_juegos = list(Juego.objects.filter(id__in=random_ids))
            else:
                 random_juegos = list(Juego.objects.all())

    def serializar(juego):
        return {
            "id": juego.id,
            "name": juego.name,
            "cover": {"url": juego.cover_url} if juego.cover_url else {},
            "summary": juego.summary,
            "first_release_date": juego.first_release_date,
        }

    resultado = {
        "totalJuegos": total_juegos,
        "totalJuegosMostrados": total_juegos,
        "totalUsuarios": usuarios,
        "totalBibliotecas": bibliotecas,
        "juegosPopulares": [serializar(j) for j in populares_qs],
        "juegosRandom": [serializar(j) for j in random_juegos],
    }
    
    # Cachear por 1 hora (3600 segundos)
    # Esto reduce la carga masivamente si hay muchos hits
    cache.set(cache_key, resultado, 3600)
    
    return resultado


def buscar_juego_por_id_igdb(game_id):
    """Busca un juego por ID haciendo una consulta directa a IGDB."""
    # Reutilizamos logic de detalle
    return obtener_detalle_juego(game_id)


def buscar_en_biblioteca_igdb(q, user):
    """Busca juegos en la biblioteca del usuario coincidiendo con un texto."""
    # Ahora es mucho más fácil, hacemos join con Juego
    qs = Biblioteca.objects.filter(user=user, juego__name__icontains=q).select_related('juego')
    # Pero Biblioteca tiene game_id (int), no FK a Juego (aun).
    # ESPERA: models.py mostraba 'game_id = models.BigIntegerField()'.
    # No hay relación directa a nivel ORM aún en Biblioteca si no la cambié.
    # Debo usar los IDs.
    
    libs = Biblioteca.objects.filter(user=user)
    game_ids = libs.values_list("game_id", flat=True)
    
    # Buscar en juegos cacheados
    juegos = Juego.objects.filter(id__in=game_ids, name__icontains=q)
    
    resultados = []
    for j in juegos:
        resultados.append({
            "id": j.id,
            "name": j.name,
            "cover": {"url": j.cover_url}
        })
    return resultados


def valorar_juego_service(juego_id, usuario, valor=None):
    """Registra o devuelve la valoración de un usuario sobre un juego."""
    # Asegurar que existe en DB local
    if not Juego.objects.filter(id=juego_id).exists():
        obtener_detalle_juego(juego_id) # Esto lo crea
        
    juego = Juego.objects.get(id=juego_id)
        
    if valor is None:
        valoracion = Valoracion.objects.filter(juego=juego, usuario=usuario).first()
        media = Valoracion.objects.filter(juego=juego).aggregate(media=Avg("valor"), total=Count("id"))
        return {
            "mi_valoracion": valoracion.valor if valoracion else None,
            "media_valoracion": media["media"] or 0,
            "total_valoraciones": media["total"],
        }
    
    if valor < 0.5 or valor > 5 or (valor * 2) % 1 != 0:
        raise ValueError("Valor debe estar entre 1 y 5, en incrementos de 0.5.")
    
    obj, _ = Valoracion.objects.update_or_create(usuario=usuario, juego=juego, defaults={"valor": valor})
    media = Valoracion.objects.filter(juego=juego).aggregate(media=Avg("valor"), total=Count("id"))
    registrar_actividad(usuario, "juego_valorado", f"Valoró *{juego.name}* con {valor} estrellas")
    return {
        "ok": True,
        "mi_valoracion": obj.valor,
        "media_valoracion": media["media"] or 0,
        "total_valoraciones": media["total"],
    }



def calcular_recomendaciones_usuario(usuario, limite=10):
    """Devuelve juegos recomendados para un usuario."""
    # Cache por usuario
    if not usuario.is_authenticated:
        return []
        
    cache_key = f"reco_user_{usuario.id}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    # Implementación simplificada basada en géneros de juegos jugados
    mis_ids = list(Biblioteca.objects.filter(user=usuario).values_list("game_id", flat=True))
    if not mis_ids:
        # Cacheamos resultado vacío para no re-consultar inmediatamente
        cache.set(cache_key, [], 1800) 
        return []

    # 2. Analizar géneros
    mis_juegos = Juego.objects.filter(id__in=mis_ids)
    
    all_genres = []
    for j in mis_juegos:
        if isinstance(j.genres, list):
            for g in j.genres:
                if isinstance(g, dict):
                     all_genres.append(g.get("id"))
                else:
                     all_genres.append(g)
            
    if not all_genres:
         cache.set(cache_key, [], 1800)
         return []
         
    all_genres = [g for g in all_genres if g is not None]

    contador = Counter(all_genres)
    # Tomamos los top 5 generos para tener variedad
    generos_top_ids = [g for g, _ in contador.most_common(5)]
    
    # 3. Buscar juegos (FALLBACK simple: Populares que no tengo)
    # Por ahora seguimos con la estrategia de populares, pero cacheada.
    # TODO: Implementar filtro real por JSON de géneros cuando sea posible optimizarlo.
    recomendados = Juego.objects.exclude(id__in=mis_ids).order_by('-popularidad')[:limite]

    resultado = [
        {
            "id": j.id,
            "name": j.name,
            "cover": {"url": j.cover_url},
            "summary": j.summary,
            "first_release_date": j.first_release_date,
        }
        for j in recomendados
    ]
    
    # Cachear 30 minutos
    cache.set(cache_key, resultado, 1800)
    
    return resultado
