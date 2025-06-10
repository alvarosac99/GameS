# Manual de Desarrollador Completo

[insertar imagen]

Este documento describe en detalle la arquitectura y el flujo de trabajo del proyecto **Gestor de Videojuegos**. A lo largo de estas secciones encontrarás una guía completa para entender, instalar y mantener la aplicación.

## 1. Introducción al Proyecto

- **Descripción**: Plataforma para organizar videojuegos y registrar la actividad de los usuarios.
- **Tecnologías clave**: Django REST, React/Vite, MySQL, Redis, Selenium, IGDB.

[insertar imagen]

## 2. Requisitos del sistema

- Hardware mínimo: 4 GB RAM, 20 GB de almacenamiento.
- **SO recomendado**: Linux (Ubuntu 22.04 o superior).
- Versiones: Python 3.12, Node 18+, npm 9+.
- Dependencias externas: Redis, MySQL Server, WebDriver para Selenium.

[insertar imagen]

## 3. Instalación del entorno de desarrollo

### Backend (Django)

1. Crear y activar entorno virtual.
2. Instalar dependencias con `pip install -r requirements.txt`.
3. Configurar `.env` con credenciales de base de datos y claves de IGDB.
- El microservicio FastAPI se comunica a través del endpoint `precios/views.py` que consulta `http://localhost:8080/buscar-ofertas`.
- Si AllKeyShop devuelve texto inválido, la API filtra los resultados en `apiPrecios` antes de enviarlos al frontend.
4. Ejecutar migraciones y crear superusuario.
- Las rutas principales se declaran en `gestor_videojuegos/urls.py` y cada app define sus URLs particulares en `urls.py`.
- Para los viewsets se utiliza `DefaultRouter` de DRF, como en `juegos/urls.py`.

### Frontend (React + Vite)

1. Ejecutar `npm install`.
2. Definir variables en `frontend/.env` para la URL de la API.
3. Usar `npm run dev` para desarrollo y `npm run build` para producción.

### Conexión Django <-> React

- Configurar CORS en `settings.py`.
- Definir `proxy` en `vite.config.js` para redirigir peticiones durante el desarrollo.

[insertar imagen]

## 4. Estructura del proyecto

```text
/gestor_videojuegos      # Configuración principal de Django
/frontend                # Aplicación React
/juegos, /usuarios, ...  # Apps Django independientes
/media                   # Archivos subidos por los usuarios
/docs                    # Documentación del proyecto
```

Cada app de Django contiene `models.py`, `views.py`, `serializers.py`, `urls.py` y `tests.py`.

[insertar imagen]

## 5. Modelado de datos y base de datos

- Los modelos principales son **Usuario**, **Juego**, **Biblioteca**, **Logro**, **Actividad** y **Diario**.
- Consulta el diagrama entidad-relación en la carpeta `docs/diagramas/`. [insertar imagen]
- Las migraciones automáticas se generan con `python manage.py makemigrations`.
- Los modelos se encuentran en `juegos/models.py`, `usuarios/models.py`, `diario/models.py`, etc.
- Cada uno define métodos como `__str__` y relaciones entre sí; por ejemplo `Biblioteca` enlaza `User` con `Juego`.

[insertar imagen]

## 6. Autenticación y permisos

- Registro y login mediante JWT.
- Middleware en Django para validar el token en cada petición.
- Roles disponibles: administrador, revisor, jugador y desarrollador.
- Las vistas de autenticación y gestión de perfiles se encuentran en `usuarios/views.py` y las rutas en `usuarios/urls.py`.
- Los permisos personalizados, como ver todos los comentarios, están definidos en `comentarios/permissions.py`.

[insertar imagen]

## 7. EndPoints REST

- `/api/juegos/` – Gestión de juegos y bibliotecas.
- `/api/usuarios/` – Registro, perfiles y seguidores.
- `/api/comentarios/` – Comentarios y valoraciones.
- `/api/actividad/` – Registro de logros y acciones.
- `/api/diario/` – Entradas del diario de juego.

Cada endpoint define métodos `GET`, `POST`, `PUT` y `DELETE` según los permisos del usuario.
- Las rutas principales se declaran en `gestor_videojuegos/urls.py` y cada app define sus URLs particulares en `urls.py`.
- Para los viewsets se utiliza `DefaultRouter` de DRF, como en `juegos/urls.py`.

[insertar imagen]

## 8. Integración con IGDB

- Autenticación OAuth2 para obtener el token.
- Ejemplo de petición a la API de IGDB para buscar juegos.
- Sistema de caché en Redis para reducir llamadas repetidas.
- Las funciones de integración están en `juegos/igdb_views/services.py` y `juegos/cache_igdb.py`.
- Para realizar peticiones seguras se usa `utils/http.safe_post` con reintentos automáticos.

[insertar imagen]

## 9. Scraping con Selenium

- Configuración del WebDriver (Chrome o Firefox).
- Script de scraping en `apiPrecios/` para consultar AllKeyShop.
- Agrupación de precios por plataforma y almacenamiento en la base de datos.
- El microservicio FastAPI se comunica a través del endpoint `precios/views.py` que consulta `http://localhost:8080/buscar-ofertas`.
- Si AllKeyShop devuelve texto inválido, la API filtra los resultados en `apiPrecios` antes de enviarlos al frontend.

[insertar imagen]

## 10. Frontend

- Componentes reutilizables: `GameCard`, `Perfil`, `Calendario`, `BuscadorGlobal`.
- Navegación con `react-router-dom` y protección de rutas privadas.
- Estilos con Tailwind y componentes de Radix UI.

[insertar imagen]

## 11. Gestión de actividad y logros

- Cada acción del usuario genera una entrada en la tabla **Actividad**.
- El sistema de logros revisa hitos y los asocia al perfil del jugador.
- Las actividades se muestran en el feed principal.
- Las utilidades que registran actividad y otorgan logros están en `actividad/utils.py`.
- Los modelos correspondientes se encuentran en `actividad/models.py`.

[insertar imagen]

## 12. Diario de juego

- Permite registrar sesiones de juego con un cronómetro automático.
- Las entradas se asocian a un juego de la biblioteca.
- Vista de calendario para revisar el historial.
- Las vistas están en `diario/views.py` y usan el modelo `EntradaDiario` de `diario/models.py`.
- Al crear una entrada se actualiza el tiempo de juego (`sesiones/models.py`) y la planificación (`juegos/igdb_views/planificacion.py`).

[insertar imagen]

## 13. Caché con Redis

- Redis almacena juegos, tokens de IGDB y búsquedas frecuentes.
- Para purgar la caché se puede ejecutar `redis-cli FLUSHDB`.
- Estrategia de renovación diaria mediante tareas programadas.
- La lógica de inicialización y refresco está en `juegos/cache_igdb.py` y se invoca desde `gestor_videojuegos/recopilar.py`.

[insertar imagen]

## 14. Compilación como App Android

1. Instalar Capacitor y ejecutar `npx cap init`.
2. Añadir la plataforma Android con `npx cap add android`.
3. Abrir el proyecto en Android Studio con `npx cap open android`.
4. Generar APK con `npx cap build android`.

[insertar imagen]

## 15. Pruebas

- Ejecutar `python manage.py test` para correr las pruebas del backend.
- Validar la conexión con IGDB mediante un test de integración.
- Revisar que la API de precios responde correctamente.
- Los archivos de pruebas están en cada app como `tests.py`. Actualmente la mayoría son ejemplos mínimos (ver `usuarios/tests.py`).
- Puedes extenderlos con `pytest` o `TestCase` estándar de Django.

[insertar imagen]

## 16. Tareas automatizadas y mantenimiento

- Scripts en `utils/cron/` ejecutan la actualización de precios y la limpieza diaria.
- El servidor se reinicia cada noche para liberar recursos.
- Logs antiguos se purgan semanalmente.
- Puedes crear scripts de mantenimiento programados mediante cron o systemd para ejecutar estas tareas periódicas.

[insertar imagen]

## 17. Despliegue

- Puede realizarse en un VPS Linux o mediante Docker.
- En producción se recomienda ejecutar `gunicorn gestor_videojuegos.wsgi` detrás de Nginx.
- Todas las variables sensibles deben definirse en un fichero `.env` como se muestra en `gestor_videojuegos/settings.py`.
- Ajustar variables de entorno para producción y configurar HTTPS.
- Para Android, firmar el APK antes de publicarlo en Google Play.

[insertar imagen]

## 18. Buenas prácticas

- Formateo con Black para Python y Prettier para JavaScript.
- Mantener commits pequeños y descriptivos.
- Revisar dependencias y vulnerabilidades de forma periódica.
- Configura `pre-commit` para ejecutar `black` y `flake8` antes de cada commit.
- Las dependencias se gestionan en `requirements.txt` y `apiPrecios/pyproject.toml`.

[insertar imagen]

## 19. Problemas comunes y solución

- Errores de CORS: revisar configuración en Django y React.
- Timeout en peticiones a IGDB: comprobar el token y la conexión.
- Fallos en Selenium: asegurarse de que el WebDriver coincide con el navegador instalado.

[insertar imagen]

## 20. Apéndices

- Tabla completa de variables de entorno.
- Enlaces a la documentación oficial de IGDB, Django y React.
- Lista de comandos de gestión (`manage.py`, `npm`, `npx cap`).

[insertar imagen]

Fin del manual.
