from django.db import models
from django.conf import settings

class Biblioteca(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="biblioteca"
    )
    game_id = models.IntegerField()
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "game_id")
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.user.username} – juego {self.game_id}"

