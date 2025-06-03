from rest_framework import viewsets, permissions
from .models import EntradaDiario
from .serializers import EntradaDiarioSerializer

class EntradaDiarioViewSet(viewsets.ModelViewSet):
    serializer_class = EntradaDiarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EntradaDiario.objects.filter(usuario=self.request.user).order_by('-fecha')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)
