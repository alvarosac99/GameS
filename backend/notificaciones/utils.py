from .models import Notificacion


def crear_notificacion(usuario, mensaje, link=""):
    Notificacion.objects.create(usuario=usuario, mensaje=mensaje, link=link)
