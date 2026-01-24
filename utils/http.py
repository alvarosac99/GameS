import time
import requests
from requests.exceptions import SSLError


def safe_post(url, headers, data, max_retries=10, timeout=30):
    """Realiza peticiones POST controlando reintentos y errores."""
    retries = 0
    resp = None
    while retries < max_retries:
        try:
            resp = requests.post(url, headers=headers, data=data, timeout=timeout)
            if resp.status_code == 429:
                wait = int(resp.headers.get("Retry-After", 30))
                print(
                    f"[safe_post] 429 Too Many Requests. Esperando {wait} segundos antes de reintentar..."
                )
                time.sleep(wait)
                retries += 1
                continue
            resp.raise_for_status()
            return resp
        except SSLError as ssl_err:
            print(f"[safe_post] Error SSL: {ssl_err} - Reintentando...")
        except requests.Timeout:
            print(
                f"[safe_post] Timeout tras {timeout}s - Intento {retries + 1}/{max_retries}"
            )
        except requests.HTTPError as http_err:
            print(
                f"[safe_post] Error HTTP: {http_err} - Intento {retries + 1}/{max_retries}"
            )
            if resp is not None:
                print(f"[safe_post] Body: {resp.text}")
        time.sleep(3 * (retries + 1))
        retries += 1
    raise Exception(f"Demasiados intentos fallidos ({max_retries}).")
