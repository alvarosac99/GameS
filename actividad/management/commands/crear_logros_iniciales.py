from django.core.management.base import BaseCommand
from actividad.models import Logro

LOGROS_PREDEFINIDOS = [
    {
        "clave": "primer_juego",
        "nombre": "Primer juego añadido",
        "descripcion": "Añadiste tu primer juego a la biblioteca.",
        "icono": "🎮",
        "orden": 1
    },
    {
        "clave": "cien_horas",
        "nombre": "Maratón 100h",
        "descripcion": "Jugaste un total de 100 horas.",
        "icono": "🔥",
        "orden": 2
    },
    {
        "clave": "amistad",
        "nombre": "Amistad lograda",
        "descripcion": "Hiciste tu primer amigo.",
        "icono": "🤝",
        "orden": 3
    },
    {
        "clave": "seguimiento",
        "nombre": "Interés común",
        "descripcion": "Seguiste a otro usuario.",
        "icono": "👀",
        "orden": 4
    },
    {
        "clave": "primer_comentario",
        "nombre": "Primera opinión",
        "descripcion": "Comentaste en un juego.",
        "icono": "🗨️",
        "orden": 5
    },
]

class Command(BaseCommand):
    help = "Crea los logros básicos si no existen."

    def handle(self, *args, **kwargs):
        creados = 0
        for logro in LOGROS_PREDEFINIDOS:
            obj, creado = Logro.objects.get_or_create(
                clave=logro["clave"],
                defaults={
                    "nombre": logro["nombre"],
                    "descripcion": logro["descripcion"],
                    "icono": logro["icono"],
                    "orden": logro["orden"]
                }
            )
            if creado:
                self.stdout.write(self.style.SUCCESS(f"✔ Logro creado: {obj.nombre}"))
                creados += 1
            else:
                self.stdout.write(f"• Logro ya existente: {obj.nombre}")
        
        self.stdout.write(self.style.NOTICE(f"Total nuevos logros creados: {creados}"))
