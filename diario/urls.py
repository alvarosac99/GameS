# src/apps/diario/urls.py
from rest_framework.routers import DefaultRouter
from .views import EntradaDiarioViewSet

router = DefaultRouter()
router.register(r"", EntradaDiarioViewSet, basename="diario")

urlpatterns = router.urls
