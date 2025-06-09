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
4. Ejecutar migraciones y crear superusuario.

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

[insertar imagen]

## 6. Autenticación y permisos

- Registro y login mediante JWT.
- Middleware en Django para validar el token en cada petición.
- Roles disponibles: administrador, revisor, jugador y desarrollador.

[insertar imagen]

## 7. EndPoints REST

- `/api/juegos/` – Gestión de juegos y bibliotecas.
- `/api/usuarios/` – Registro, perfiles y seguidores.
- `/api/comentarios/` – Comentarios y valoraciones.
- `/api/actividad/` – Registro de logros y acciones.
- `/api/diario/` – Entradas del diario de juego.

Cada endpoint define métodos `GET`, `POST`, `PUT` y `DELETE` según los permisos del usuario.

[insertar imagen]

## 8. Integración con IGDB

- Autenticación OAuth2 para obtener el token.
- Ejemplo de petición a la API de IGDB para buscar juegos.
- Sistema de caché en Redis para reducir llamadas repetidas.

[insertar imagen]

## 9. Scraping con Selenium

- Configuración del WebDriver (Chrome o Firefox).
- Script de scraping en `apiPrecios/` para consultar AllKeyShop.
- Agrupación de precios por plataforma y almacenamiento en la base de datos.

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

[insertar imagen]

## 12. Diario de juego

- Permite registrar sesiones de juego con un cronómetro automático.
- Las entradas se asocian a un juego de la biblioteca.
- Vista de calendario para revisar el historial.

[insertar imagen]

## 13. Caché con Redis

- Redis almacena juegos, tokens de IGDB y búsquedas frecuentes.
- Para purgar la caché se puede ejecutar `redis-cli FLUSHDB`.
- Estrategia de renovación diaria mediante tareas programadas.

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

[insertar imagen]

## 16. Tareas automatizadas y mantenimiento

- Scripts en `utils/cron/` ejecutan la actualización de precios y la limpieza diaria.
- El servidor se reinicia cada noche para liberar recursos.
- Logs antiguos se purgan semanalmente.

[insertar imagen]

## 17. Despliegue

- Puede realizarse en un VPS Linux o mediante Docker.
- Ajustar variables de entorno para producción y configurar HTTPS.
- Para Android, firmar el APK antes de publicarlo en Google Play.

[insertar imagen]

## 18. Buenas prácticas

- Formateo con Black para Python y Prettier para JavaScript.
- Mantener commits pequeños y descriptivos.
- Revisar dependencias y vulnerabilidades de forma periódica.

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
