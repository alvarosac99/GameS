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

Configuración de Redis para Caché de Juegos

El sistema de caché utiliza Redis como backend para almacenar los juegos descargados desde IGDB y mejorar el rendimiento de búsqueda, filtrado y paginación.
1. Instalación de Redis (local)
En Ubuntu:

sudo apt update
sudo apt install redis-server
sudo systemctl enable redis
sudo systemctl start redis

Verifica que Redis está funcionando:

redis-cli ping
# Debería responder: PONG

2. Instalar dependencias en el proyecto Django

pip install django-redis

3. Configuración en settings.py

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

4. Uso en el código

Ya está integrado en el proyecto. El servidor comprueba la caché al iniciarse y,
si está vacía, descarga automáticamente todos los juegos de IGDB. Además se 
programa una actualización diaria a las 2:00 AM.

5. Comprobación manual

Puedes ver lo que hay almacenado:

redis-cli
> SELECT 1
> KEYS *

6. Limpieza de la caché manualmente

redis-cli
> SELECT 1
> FLUSHDB

Notas adicionales

    El uso de Redis evita accesos innecesarios a IGDB y mejora la velocidad en producción.

    Puedes combinar esto con persistencia en base de datos si lo deseas.

## Búsqueda con números romanos

La API de precios detecta números romanos en el título de un juego y los
convierte a cifras decimales antes de realizar la consulta a AllKeyShop. Por
ejemplo, "Dark Souls II" se transforma en "dark souls 2".

### Manejo de errores en la API de precios

Cuando AllKeyShop devuelve datos que no son JSON válidos (por ejemplo el texto
"NOPE"), la API ya no genera un fallo interno. En su lugar se omiten las ofertas
y se responde únicamente con la información disponible del juego.

### Extracción de ofertas

Para obtener las ofertas, la API analiza el script `aks-offers-js-extra` presente
en la página de AllKeyShop. Los resultados se ordenan por precio antes de
devolverlos al usuario.

### Búsqueda de ofertas por plataforma

El endpoint `/buscar-ofertas` extrae los enlaces de `ul.aks-offer-tabulations`
para recorrer cada plataforma disponible. Las ofertas se agrupan por plataforma
y se ordenan por precio en cada grupo.

## Modo claro

Desde la sección de **Ajustes** puedes elegir entre tema claro u oscuro.
La preferencia se guarda en el navegador y se aplica al recargar la página
## Recomendaciones personalizadas

El servidor calcula cada día los géneros más presentes en la biblioteca de cada usuario y expone sugerencias en `/api/juegos/recomendados/`. Estas recomendaciones aparecen en el panel principal.
## Puesta en marcha
1. Copia `gestor_videojuegos/.env.example` como `gestor_videojuegos/.env` y rellena cada variable.
2. Instala dependencias con `pip install -r requirements.txt`.
3. Aplica migraciones y crea un superusuario:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```
4. Ejecuta el servidor de desarrollo con:
   ```bash
   python manage.py runserver
   ```
