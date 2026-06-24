import urllib.request
import urllib.parse
import json

from django.conf import settings

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}

EXEMPT_PATHS = [
    "/admin/",
    "/api/usuarios/session/",
]


class TurnstileMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not settings.TURNSTILE_SECRET_KEY:
            return self.get_response(request)

        if request.method in SAFE_METHODS:
            return self.get_response(request)

        if any(request.path.startswith(p) for p in EXEMPT_PATHS):
            return self.get_response(request)

        token = request.headers.get("X-Turnstile-Token", "")
        if not token:
            from django.http import JsonResponse
            return JsonResponse(
                {"error": "Verificación de seguridad requerida."},
                status=403,
            )

        if not self._verify_token(token, request):
            from django.http import JsonResponse
            return JsonResponse(
                {"error": "Verificación de seguridad fallida."},
                status=403,
            )

        return self.get_response(request)

    def _verify_token(self, token, request):
        ip = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
        if not ip:
            ip = request.META.get("REMOTE_ADDR", "")

        data = urllib.parse.urlencode({
            "secret": settings.TURNSTILE_SECRET_KEY,
            "response": token,
            "remoteip": ip,
        }).encode()

        try:
            req = urllib.request.Request(TURNSTILE_VERIFY_URL, data=data)
            with urllib.request.urlopen(req, timeout=5) as resp:
                result = json.loads(resp.read())
            return result.get("success", False)
        except Exception:
            return False
