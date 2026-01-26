from rest_framework import generics, permissions
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from comentarios.models import Comentario
from .models import Reporte
from .serializers import ReporteSerializer
from django.core.mail import send_mail
from usuarios.models import Perfil

User = get_user_model()


class ReportarView(generics.CreateAPIView):
    serializer_class = ReporteSerializer
    permission_classes = [permissions.IsAuthenticated]

    MODELOS = {
        "usuario": User,
        "comentario": Comentario,
    }

    def perform_create(self, serializer):
        modelo = self.kwargs["modelo"]
        objeto_id = self.kwargs["object_id"]

        modelo_obj = self.MODELOS.get(modelo)
        if not modelo_obj:
            raise ValueError("Modelo no soportado")

        content_type = ContentType.objects.get_for_model(modelo_obj)
        reporte = serializer.save(
            reportado_por=self.request.user,
            content_type=content_type,
            object_id=objeto_id,
        )
        self.notificar_staff(reporte)

    def notificar_staff(self, reporte):
        staff_emails = User.objects.filter(perfil__rol="STAFF").values_list(
            "email", flat=True
        )
        if staff_emails:
            send_mail(
                "Nuevo reporte",
                f"Se ha reportado el objeto {reporte.content_type} #{reporte.object_id}",
                None,
                list(staff_emails),
            )
