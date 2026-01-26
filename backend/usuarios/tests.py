from django.test import SimpleTestCase

from .models import avatar_path


class AvatarPathTests(SimpleTestCase):
    def test_generar_ruta_avatar(self):
        class Dummy:
            user = type('U', (), {'username': 'tester'})()

        path = avatar_path()(Dummy(), 'foto.png')
        self.assertEqual(path, 'avatares/tester.png')
