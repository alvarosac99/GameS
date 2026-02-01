# Certificados de Origen de Cloudflare

Esta carpeta contiene los certificados SSL/TLS necesarios para asegurar la conexión entre los servidores de **Cloudflare** y este servidor de origen (**Nginx**).

## Archivos Requeridos

Para que Nginx funcione correctamente con SSL, se esperan los siguientes archivos en esta carpeta:

- **`api.pem`**: El certificado público generado por Cloudflare.
- **`api.key`**: La clave privada del certificado.

> **⚠️ IMPORTANTE**: Estos archivos contienen información sensible.
> Asegúrate de que **NUNCA** se suban al repositorio de control de versiones.
> Deben estar incluidos en tu archivo `.gitignore`.

## Configuración en Cloudflare

1. Ve a **SSL/TLS** > **Origin Server** en tu panel de Cloudflare.
2. Haz clic en **Create Certificate**.
3. Mantén las opciones por defecto (RSA 2048, validez de 15 años).
4. Copia el contenido del "Origin Certificate" y guárdalo como `api.pem`.
5. Copia el contenido de la "Private Key" y guárdalo como `api.key`.
6. En **SSL/TLS** > **Overview**, asegura que el modo de encriptación esté en **Full (Strict)**.

## Uso con Docker

Estos certificados son montados en el contenedor de Nginx según la configuración en `docker-compose.yml`:

```yaml
services:
  nginx:
    volumes:
      - ./cloudflare/certs:/etc/nginx/certs:ro
```

Nginx los utilizará para terminar la conexión segura entrante desde Cloudflare.
