from .models import Actividad, Logro, LogroUsuario


def registrar_actividad(usuario, tipo, descripcion):
    Actividad.objects.create(usuario=usuario, tipo=tipo, descripcion=descripcion)


def otorgar_logro(usuario, clave):
    try:
        logro = Logro.objects.get(clave=clave)
    except Logro.DoesNotExist:
        return

    if not LogroUsuario.objects.filter(usuario=usuario, logro=logro).exists():
        LogroUsuario.objects.create(usuario=usuario, logro=logro)
        registrar_actividad(usuario, "logro", f"Desbloqueó el logro *{logro.nombre}*")
        from notificaciones.utils import crear_notificacion
        crear_notificacion(usuario, f"¡Has obtenido el logro {logro.nombre}!")
