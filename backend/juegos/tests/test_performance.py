from django.test import TestCase
from unittest.mock import patch
from django.utils import timezone
from datetime import timedelta
from juegos.models import Juego
from juegos.igdb_views.services import obtener_detalle_juego, obtener_filtros

class PerformanceTest(TestCase):
    def setUp(self):
        # Crear un juego "fresco" en la DB local
        self.juego_reciente = Juego.objects.create(
            id=12345,
            name="Juego Test Reciente",
            updated_at=timezone.now()
        )
        # Crear un juego "antiguo"
        self.juego_antiguo = Juego.objects.create(
            id=67890,
            name="Juego Test Antiguo"
        )
        # Forzamos que updated_at sea viejo (django auto_now lo pone a now al guardar)
        Juego.objects.filter(id=67890).update(updated_at=timezone.now() - timedelta(days=10))

    @patch('juegos.igdb_views.services.requests.post')
    def test_obtener_detalle_usa_cache_local(self, mock_post):
        """Prueba que si el juego es reciente, NO se llama a la API de IGDB."""
        
        # Ejecutar servicio para juego reciente
        resultado = obtener_detalle_juego(12345)
        
        # Verificar resultado
        self.assertIsNotNone(resultado)
        self.assertEqual(resultado['name'], "Juego Test Reciente")
        
        # Verificar que NO se llamó a requests.post
        mock_post.assert_not_called()

    @patch('juegos.igdb_views.services.requests.post')
    def test_obtener_detalle_actualiza_si_es_antiguo(self, mock_post):
        """Prueba que si el juego es antiguo, SI se llama a la API de IGDB."""
        
        # Configurar mock para devolver datos de IGDB
        mock_response = mock_post.return_value
        mock_response.status_code = 200
        mock_response.json.return_value = [{
            "id": 67890,
            "name": "Juego Test Actualizado",
            "slug": "juego-test-actualizado",
            "first_release_date": 1600000000
        }]
        
        # Ejecutar servicio para juego antiguo
        resultado = obtener_detalle_juego(67890)
        
        # Verificar que SI se llamó a requests.post
        self.assertTrue(mock_post.called)
        
        # Verificar que se actualizó el nombre (simulado por el mock)
        # Nota: obtener_detalle_juego devuelve el dict, no el objeto DB
        self.assertEqual(resultado['name'], "Juego Test Actualizado")

    @patch('juegos.igdb_views.services.cache')
    @patch('juegos.igdb_views.services.requests.post')
    def test_obtener_filtros_usa_redis(self, mock_post, mock_cache):
        """Prueba que obtener_filtros usa caché de Redis."""
        
        # Escenario 1: Caché vacía
        mock_cache.get.return_value = None
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = [{"id": 1, "name": "Test"}]
        
        filtros = obtener_filtros()
        
        # Debe haber llamado a la API
        self.assertTrue(mock_post.called)
        # Debe haber guardado en caché
        self.assertTrue(mock_cache.set.called)
        
        # Reset mocks
        mock_post.reset_mock()
        mock_cache.reset_mock()
        
        # Escenario 2: Caché llena (simulando que services.cache.get devuelve datos)
        # Nota: En la implementación real usaremos cache.get_or_set o similar.
        # Si la implementación cambia para usar cache directamente, este test debe adaptarse.
        # Por ahora asumimos que verificará cache.get
        mock_cache.get.return_value = {
            "genres": [{"id": 1, "name": "Cached"}],
            "platforms": [],
            "publishers": []
        }
        
        # OJO: Si la función no está implementada aún con caché, este test fallará o pasará falsamente
        # dependiendo de cómo hagamos el mock.
        # Como vamos a modificar el código, este test sirve para TDD.
