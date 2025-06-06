from django.urls import path
from .views import ReportarView

urlpatterns = [
    path('<str:modelo>/<int:object_id>/', ReportarView.as_view(), name='crear_reporte'),
]
