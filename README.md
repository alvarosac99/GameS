# Gestor de videojuegos

Este repositorio forma parte de un trabajo de fin de curso cuyo objetivo principal es recopilar datos sobre videojuegos y ofrecer asistencia a los usuarios en la gestión de sus horarios y tiempos de juego.

## Objetivo

Desarrollar una herramienta que permita a los usuarios:

- Consultar información detallada sobre videojuegos.
- Organizar y planificar sus sesiones de juego.
- Llevar un seguimiento de sus tiempos de juego.

## Tecnologías

Este proyecto utilizará tecnologías modernas para garantizar un desarrollo eficiente y una experiencia de usuario óptima.

## Estado del Proyecto

Este es el commit inicial del proyecto. Próximamente se añadirán más detalles sobre la estructura del repositorio y las funcionalidades.

🚀 Configuración de Redis para Caché de Juegos

El sistema de caché utiliza Redis como backend para almacenar los juegos descargados desde IGDB y mejorar el rendimiento de búsqueda, filtrado y paginación.
🧰 1. Instalación de Redis (local)
En Ubuntu:

sudo apt update
sudo apt install redis-server
sudo systemctl enable redis
sudo systemctl start redis

Verifica que Redis está funcionando:

redis-cli ping
# Debería responder: PONG

⚙️ 2. Instalar dependencias en el proyecto Django

pip install django-redis

🧠 3. Configuración en settings.py

Añade o modifica el bloque de configuración de caché:

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",  # usa la base de datos 1 de Redis
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

✅ 4. Uso en el código

Ya está integrado en el proyecto. El servidor comprueba la caché al iniciarse y,
si está vacía, descarga automáticamente todos los juegos de IGDB. Además se 
programa una actualización diaria a las 2:00 AM.

🧪 5. Comprobación manual

Puedes ver lo que hay almacenado:

redis-cli
> SELECT 1
> KEYS *

🧼 6. Limpieza de la caché manualmente

redis-cli
> SELECT 1
> FLUSHDB

📌 Notas adicionales

    El uso de Redis evita accesos innecesarios a IGDB y mejora la velocidad en producción.

    Puedes combinar esto con persistencia en base de datos si lo deseas.