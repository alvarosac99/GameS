<div align="center">

# <img src="https://api.iconify.design/mdi:gamepad-variant.svg?color=%2361DAFB" width="32" height="32" align="absmiddle" /> GameS (Gestor de Videojuegos)

**Plataforma web integral para descubrir, organizar y gestionar videojuegos, con búsqueda avanzada, historial de precios y recomendaciones personalizadas.**



[![React](https://img.shields.io/badge/react-19.1-%2361DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Django](https://img.shields.io/badge/django-5.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![MySQL](https://img.shields.io/badge/mysql-8.0-%234479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/redis-7-%23DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/docker--compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

[![License](https://img.shields.io/badge/license-Copyright-blue?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-v1-orange?style=for-the-badge)](#)
[![Django CI](https://img.shields.io/github/actions/workflow/status/alvarosac99/GameS/django.yml?logo=github&label=Django%20CI&style=for-the-badge)](https://github.com/alvarosac99/GameS/actions/workflows/django.yml)
[![Node CI](https://img.shields.io/github/actions/workflow/status/alvarosac99/GameS/node.js.yml?logo=github&label=Node.js%20CI&style=for-the-badge)](https://github.com/alvarosac99/GameS/actions/workflows/node.js.yml)

<br/>

### <img src="https://api.iconify.design/mdi:lightning-bolt.svg?color=%23F59E0B" width="20" height="20" align="absmiddle" /> Características Destacadas

<table>
<tr align="center">
<td><img src="https://api.iconify.design/mdi:database.svg?color=%234479A1" width="40" height="40" align="absmiddle" /><br/><b>+100K</b><br/>Juegos en BD</td>
<td><img src="https://api.iconify.design/mdi:clock.svg?color=%2361DAFB" width="40" height="40" align="absmiddle" /><br/><b>Tiempo Real</b><br/>Seguimiento</td>
<td><img src="https://api.iconify.design/mdi:trending-down.svg?color=%2310B981" width="40" height="40" align="absmiddle" /><br/><b>Precios</b><br/>Históricos</td>
<td><img src="https://api.iconify.design/mdi:shield-check.svg?color=%23F59E0B" width="40" height="40" align="absmiddle" /><br/><b>JWT Auth</b><br/>Seguro</td>
<td><img src="https://api.iconify.design/mdi:lightning-bolt.svg?color=%23DC382D" width="40" height="40" align="absmiddle" /><br/><b>Redis Cache</b><br/>Ultra Rápido</td>
</tr>
</table>

<br/>

[<img src="https://api.iconify.design/mdi:rocket.svg?color=%233B82F6" width="20" height="20" align="absmiddle" /> Inicio Rápido](#inicio-rapido) · [<img src="https://api.iconify.design/mdi:book-open-page-variant.svg?color=%2310B981" width="20" height="20" align="absmiddle" /> Documentación](#uso) · [<img src="https://api.iconify.design/mdi:bug.svg?color=%23F59E0B" width="20" height="20" align="absmiddle" /> Problemas](../../issues)

</div>

---

## <img src="https://api.iconify.design/mdi:format-list-bulleted.svg?color=%233B82F6" width="20" height="20" align="absmiddle" /> Tabla de Contenidos
- [Sobre el Proyecto](#sobre-el-proyecto)
- [Demo y Capturas](#demo-y-capturas)
- [Stack Tecnológico](#stack-tecnologico)
- [Arquitectura](#arquitectura)
- [Inicio Rápido](#inicio-rapido)
  - [Requisitos Previos](#requisitos-previos)
  - [Instalación](#instalacion)
  - [Variables de Entorno](#variables-de-entorno)
  - [Configuración Inicial](#configuracion-inicial)
- [Uso](#uso)
- [API REST](#api-rest)
  - [Autenticación](#autenticacion)
  - [Endpoints Principales](#endpoints-principales)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Pruebas](#pruebas)
- [Despliegue](#despliegue)
- [Solución de Problemas](#solucion-de-problemas)
- [FAQ](#faq)
- [Licencia y Derechos](#licencia-y-derechos)

---

<a name="sobre-el-proyecto"></a>
## <img src="https://api.iconify.design/mdi:rocket-launch.svg?color=%23EF4444" width="20" height="20" align="absmiddle" /> Sobre el Proyecto

> **GameS** es un gestor de videojuegos conceptualizado y desarrollado para ofrecer una experiencia completa a los apasionados de los juegos. Permite a los usuarios consultar información meticulosamente extraída de IGDB, planificar sus sesiones, administrar meticulosamente bibliotecas personales, hacer un seguimiento del tiempo y descubrir las mejores ofertas y precios históricos del mercado de claves. Todo bajo una interfaz estilizada y responsiva con un backend dinámico preparado para optimización por tráfico.

### <img src="https://api.iconify.design/mdi:star-four-points.svg?color=%23F59E0B" width="20" height="20" align="absmiddle" /> Características Principales

<table>
<tr>
<td width="50%">

#### <img src="https://api.iconify.design/mdi:fire.svg?color=%23EF4444" width="20" height="20" align="absmiddle" /> Catálogo Completo con IGDB
Integración automática con la API de IGDB para disponer de la base de una de las mayores plataformas de internet. El proyecto usa **Redis** para almacenar la data localmente y agilizar brutalmente las peticiones de búsquedas.

#### <img src="https://api.iconify.design/mdi:currency-usd.svg?color=%2310B981" width="20" height="20" align="absmiddle" /> Buscador Inteligente de Ofertas
Rastreador de precios con base en **AllKeyShop** con algoritmo de mapeo automático de títulos (haciendo conversiones en títulos con numeración romana y procesando resultados para mostrarlos perfectamente agrupados por consola y rebajados). *Nota: Debido a que usa web scraping, no se recomienda su uso en producción abierta para evitar consumir ancho de banda no deseado.*

#### <img src="https://api.iconify.design/mdi:clock-outline.svg?color=%233B82F6" width="20" height="20" align="absmiddle" /> Gestión de Colección y Tiempo
Registra y modera tus sesiones. Haz un recuento de tu tiempo jugado o añade notas en formato de diario, con **estadísticas precisas** y visualizaciones gráficas.

</td>
<td width="50%">

#### <img src="https://api.iconify.design/mdi:robot.svg?color=%238B5CF6" width="20" height="20" align="absmiddle" /> Recomendaciones Personalizadas
Motor de recomendaciones propio y automático basado en los géneros de los videojuegos alojados en la biblioteca del usuario con **algoritmos de similitud**.

#### <img src="https://api.iconify.design/mdi:theme-light-dark.svg?color=%23EC4899" width="20" height="20" align="absmiddle" /> Sistema Temático Adaptativo
Interfaz altamente cuidada que guarda automáticamente tu preferencia visual con tema **Claro y Oscuro** guardado en caché de forma persistente.

#### <img src="https://api.iconify.design/mdi:account-group.svg?color=%233B82F6" width="20" height="20" align="absmiddle" /> Sistema Social
Comentarios, valoraciones y reseñas de videojuegos con sistema de notificaciones en tiempo real para interacción entre usuarios.

</td>
</tr>
</table>

---

<a name="demo-y-capturas"></a>
## <img src="https://api.iconify.design/mdi:image-multiple.svg?color=%23EC4899" width="20" height="20" align="absmiddle" /> Demo y Capturas

### Bienvenida
<img src="docs/screenshots/Bienvenida.png" alt="Bienvenida" width="100%">

### Catálogo de Juegos
<img src="docs/screenshots/Juegos.png" alt="Catálogo de Juegos" width="100%">

### Biblioteca Personal
<img src="docs/screenshots/Biblioteca.png" alt="Biblioteca Personal" width="100%">

### Perfil de Usuario
<img src="docs/screenshots/Perfil.png" alt="Perfil de Usuario" width="100%">

---

<a name="stack-tecnologico"></a>
## <img src="https://api.iconify.design/mdi:layers-triple.svg?color=%23F59E0B" width="20" height="20" align="absmiddle" /> Stack Tecnológico

<table>
<tr>
<td width="50%" valign="top">

### <img src="https://api.iconify.design/mdi:monitor.svg?color=%233B82F6" width="20" height="20" align="absmiddle" /> Frontend
- **React 19.1** - Biblioteca UI con hooks y context
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Componentes accesibles headless
- **React Router DOM** - Enrutamiento SPA
- **Axios** - Cliente HTTP

### <img src="https://api.iconify.design/mdi:database.svg?color=%234479A1" width="20" height="20" align="absmiddle" /> Base de Datos
- **MySQL 8.0** - Base de datos relacional
- **Redis 7** - Caché en memoria para juegos y sesiones
- **Django ORM** - Mapeo objeto-relacional

</td>
<td width="50%" valign="top">

### <img src="https://api.iconify.design/mdi:server.svg?color=%2310B981" width="20" height="20" align="absmiddle" /> Backend
- **Django 5.2** - Framework web de alto nivel
- **Python 3.10+** - Lenguaje de programación
- **Django REST Framework** - API REST toolkit
- **SimpleJWT** - Autenticación JWT
- **Gunicorn** - WSGI HTTP Server
- **Celery** (opcional) - Tareas asíncronas

### <img src="https://api.iconify.design/mdi:docker.svg?color=%232496ED" width="20" height="20" align="absmiddle" /> DevOps
- **Docker & Docker Compose** - Containerización
- **Nginx** - Proxy inverso y servidor estático
- **Sablier** - Auto-suspensión de contenedores
- **GitHub Actions** - CI/CD pipelines

</td>
</tr>
</table>

### <img src="https://api.iconify.design/mdi:api.svg?color=%238B5CF6" width="20" height="20" align="absmiddle" /> APIs Externas

- **IGDB API** (Twitch) - Base de datos de videojuegos
- **AllKeyShop** - Comparador de precios de claves

---

<a name="arquitectura"></a>
## <img src="https://api.iconify.design/mdi:crane.svg?color=%236366F1" width="20" height="20" align="absmiddle" /> Arquitectura

```mermaid
graph TD
    Client[Navegador / SPA React] <-->|HTTPS / 443| Nginx[Proxy Inverso Nginx]
    
    subgraph Frontend [Aplicación Cliente]
        UI[Componentes UI Radix]
        Router[React Router DOM]
    end
    
    subgraph Backend [Backend Django]
        API[Servicios REST API]
        Apps(Auth JWT, juegos, precios, diario...)
    end
    
    subgraph Almacenamiento
        MySQL[(MySQL 8.0)]
        Redis[(Redis 7)]
    end

    Nginx -.->|Distribución Peticiones| Frontend
    Nginx <-->|Proxy Pass 8000| API
    
    API <-->|Models ORM| MySQL
    API <-->|Caché de Juegos| Redis
    
    API -.->|Request Paginado| IGDB[API de IGDB]
    API -.->|Búsqueda de Ofertas| AKS[AllKeyShop / APIs]
```

---

<a name="inicio-rapido"></a>
## <img src="https://api.iconify.design/mdi:play-circle.svg?color=%2310B981" width="20" height="20" align="absmiddle" /> Inicio Rápido

<a name="requisitos-previos"></a>
### Requisitos Previos 

Asegúrate de contar con lo siguiente instalado en tu host o máquina de despliegue:

- **Docker** `>= 20.x`
- **Docker Compose** `>= 2.x`
- En caso de ejecutar en formato de pre-desarrollo local y nativo, precisarás **Node.js** v20+, **Python** 3.10+, **MySQL Server** 8+, **Redis** 7+

<a name="instalacion"></a>
### Instalación 

```bash
# 1. Clonar el repositorio
git clone https://github.com/alvarosac99/GameS.git
cd GameS

# 2. Configurar las variables de entorno
cp .env_example .env
# IMPORTANTE: Reemplazar las credenciales, secrets y hosts vacíos del .env de manera acorde.

# 3. Construir y Levantar servicios (Modo Producción con Compose)
docker-compose up -d --build

# (Opcional - Levantando únicamente Frontend aisladamente)
cd frontend
npm install
npm run dev
```

<a name="variables-de-entorno"></a>
### Variables de Entorno 

Variables a completar alojadas en `.env`:

| Variable | Descripción | Requerimiento | Default Referencia |
|----------|-------------|:----------:|---------|
| `DEBUG` | Mostrar trazados de errores de Django | ✅ Sí | `1` |
| `DJANGO_SECRET_KEY` | Credencial secreta de seguridad del sistema | ✅ Sí | - |
| `DJANGO_ALLOWED_HOSTS` | Array de Hostnames admitidos | ✅ Sí | - |
| `CSRF_TRUSTED_ORIGINS` | Orígenes cors autorizados para envíos POST | ✅ Sí | - |
| `MYSQL_DATABASE` | Nombre final de la DB local | ✅ Sí | - |
| `MYSQL_USER` | Nombre de usuario propietario | ✅ Sí | - |
| `MYSQL_PASSWORD` | Pass del user propietario | ✅ Sí | - |
| `MYSQL_ROOT_PASSWORD` | Pass maestro MySQL | ✅ Sí | - |
| `DB_HOST` | Host DB desde Backend (en red Docker) | ✅ Sí | `db` |
| `DB_PORT` | Puerto relacional expuesto | ✅ Sí | `3306` |
| `REDIS_HOST` | Host para Caché (en red Docker) | ✅ Sí | `redis` |
| `REDIS_PORT` | Puerto de escucha Redis | ✅ Sí | `6379` |
| `VITE_API_BASE_URL` | Base URL a la ruta de Nginx en Frontend | ✅ Sí | `/api` |
| `IGDB_CLIENT_ID` | Clave API Twitch Developers / IGDB | ⚠️ Si se actualiza | *(Predefinido)* |
| `IGDB_CLIENT_SECRET`| Token rotador de IGDB | ⚠️ Si se actualiza | *(Predefinido)* |

<details>
<summary><b><img src="https://api.iconify.design/mdi:lightbulb.svg?color=%23F59E0B" width="20" height="20" align="absmiddle" /> Generar DJANGO_SECRET_KEY</b></summary>

```bash
# Generar una clave secreta segura
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

</details>

<a name="configuracion-inicial"></a>
### <img src="https://api.iconify.design/mdi:cog.svg?color=%2364748B" width="20" height="20" align="absmiddle" /> Configuración Inicial

Una vez levantados los contenedores, es necesario realizar la configuración inicial:

```bash
# 1. Ejecutar migraciones de base de datos
docker-compose exec backend python manage.py migrate

# 2. Crear superusuario para el panel de administración
docker-compose exec backend python manage.py createsuperuser

# 3. (Opcional) Cargar datos de prueba
docker-compose exec backend python manage.py loaddata initial_data

# 4. Verificar que Redis está funcionando
docker-compose exec redis redis-cli ping
# Debería responder: PONG

# 5. Acceder a la aplicación
# Frontend: http://localhost (o tu dominio configurado)
# Admin Django: http://localhost/admin
```

> **<img src="https://api.iconify.design/mdi:lightbulb.svg?color=%23F59E0B" width="20" height="20" align="absmiddle" /> Tip**: La primera vez que accedas, el sistema sincronizará automáticamente la base de datos de IGDB con Redis. Este proceso puede tardar varios minutos dependiendo de tu conexión.

---

<a name="uso"></a>
## <img src="https://api.iconify.design/mdi:book-open-page-variant.svg?color=%233B82F6" width="20" height="20" align="absmiddle" /> Uso

### Estructura base
La aplicación centraliza la experiencia en el frontend expuesto nativamente en los puertos de Nginx (habitualmente 443 vía TLS si Cloudflare está enganchado o por el 80 directo). 

Redis inicializa inmediatamente una captura del repositorio de IGDB la primera vez que inicia o durante horas de baja actividad programada para almacenar localmente lo mas destacable de la red y optimizar las búsquedas. 

### Gestión Automática
Nginx se gestiona de forma global en `nginx-central` fuera del contenedor (para configuraciones custom multiproyecto del host), sin embargo, este proyecto cuenta con un volumen específico `./nginx/conf.d` incrustado como solo-lectura para configurar sus virtualhosts de forma modularizada y escalable.

---

<a name="api-rest"></a>
## <img src="https://api.iconify.design/mdi:api.svg?color=%238B5CF6" width="20" height="20" align="absmiddle" /> API REST

La API REST de GameS proporciona endpoints para todas las funcionalidades principales del sistema.

<a name="autenticacion"></a>
### <img src="https://api.iconify.design/mdi:lock.svg?color=%23F59E0B" width="20" height="20" align="absmiddle" /> Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** para la autenticación:

```bash
# 1. Obtener token de acceso
curl -X POST http://localhost/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "tu_usuario", "password": "tu_contraseña"}'

# Respuesta:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

# 2. Usar el token en peticiones
curl -X GET http://localhost/api/juegos/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."

# 3. Refrescar token expirado
curl -X POST http://localhost/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."}'
```

<a name="endpoints-principales"></a>
### <img src="https://api.iconify.design/mdi:database.svg?color=%2310B981" width="20" height="20" align="absmiddle" /> Endpoints Principales

<table>
<tr>
<td width="50%" valign="top">

#### <img src="https://api.iconify.design/mdi:gamepad-variant.svg?color=%2361DAFB" width="20" height="20" align="absmiddle" /> Juegos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/juegos/` | Listar juegos (paginado) |
| `GET` | `/api/juegos/{id}/` | Detalle de un juego |
| `GET` | `/api/juegos/buscar/` | Búsqueda avanzada |
| `GET` | `/api/juegos/{id}/precios/` | Precios del juego |
| `POST` | `/api/juegos/{id}/favorito/` | Añadir a favoritos |

#### <img src="https://api.iconify.design/mdi:bookshelf.svg?color=%238B5CF6" width="20" height="20" align="absmiddle" /> Biblioteca

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/biblioteca/` | Mis juegos |
| `POST` | `/api/biblioteca/` | Añadir juego |
| `PUT` | `/api/biblioteca/{id}/` | Actualizar estado |
| `DELETE` | `/api/biblioteca/{id}/` | Eliminar juego |
| `GET` | `/api/biblioteca/estadisticas/` | Estadísticas |

#### <img src="https://api.iconify.design/mdi:clock.svg?color=%233B82F6" width="20" height="20" align="absmiddle" /> Actividad

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/actividad/` | Historial |
| `POST` | `/api/actividad/` | Registrar sesión |
| `GET` | `/api/actividad/hoy/` | Sesiones de hoy |
| `GET` | `/api/actividad/graficas/` | Datos gráficos |

</td>
<td width="50%" valign="top">

#### <img src="https://api.iconify.design/mdi:currency-usd.svg?color=%2310B981" width="20" height="20" align="absmiddle" /> Precios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/precios/{id}/` | Precios actuales |
| `GET` | `/api/precios/{id}/historial/` | Historial precios |
| `GET` | `/api/precios/ofertas/` | Mejores ofertas |
| `POST` | `/api/precios/{id}/alerta/` | Crear alerta |

#### <img src="https://api.iconify.design/mdi:comment-text.svg?color=%23F59E0B" width="20" height="20" align="absmiddle" /> Comentarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/comentarios/{juego_id}/` | Ver comentarios |
| `POST` | `/api/comentarios/` | Crear comentario |
| `PUT` | `/api/comentarios/{id}/` | Editar comentario |
| `DELETE` | `/api/comentarios/{id}/` | Eliminar comentario |
| `POST` | `/api/comentarios/{id}/like/` | Me gusta |

#### <img src="https://api.iconify.design/mdi:account.svg?color=%23EC4899" width="20" height="20" align="absmiddle" /> Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/usuarios/perfil/` | Mi perfil |
| `PUT` | `/api/usuarios/perfil/` | Actualizar perfil |
| `GET` | `/api/usuarios/recomendaciones/` | Recomendados |
| `GET` | `/api/usuarios/notificaciones/` | Notificaciones |

</td>
</tr>
</table>

<details>
<summary><b><img src="https://api.iconify.design/mdi:book-open-variant.svg?color=%233B82F6" width="20" height="20" align="absmiddle" /> Ejemplo de búsqueda avanzada</b></summary>

```bash
# Buscar juegos por título, género y plataforma
curl -X GET "http://localhost/api/juegos/buscar/?q=zelda&genero=RPG&plataforma=Switch&limit=10" \
  -H "Authorization: Bearer tu_token"

# Respuesta:
{
  "count": 15,
  "next": "http://localhost/api/juegos/buscar/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1234,
      "nombre": "The Legend of Zelda: Breath of the Wild",
      "portada": "https://...",
      "rating": 97,
      "generos": ["Action", "Adventure", "RPG"],
      "plataformas": ["Switch"],
      "fecha_lanzamiento": "2017-03-03"
    }
  ]
}
```

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:book-open-variant.svg?color=%2310B981" width="20" height="20" align="absmiddle" /> Ejemplo de registro de sesión de juego</b></summary>

```bash
# Registrar sesión de juego
curl -X POST http://localhost/api/actividad/ \
  -H "Authorization: Bearer tu_token" \
  -H "Content-Type: application/json" \
  -d '{
    "juego_id": 1234,
    "duracion_minutos": 120,
    "fecha": "2025-02-21",
    "notas": "Completada la primera mazmorra"
  }'

# Respuesta:
{
  "id": 567,
  "juego": {
    "id": 1234,
    "nombre": "The Legend of Zelda: Breath of the Wild"
  },
  "duracion_minutos": 120,
  "fecha": "2025-02-21T14:30:00Z",
  "notas": "Completada la primera mazmorra"
}
```

</details>

---

<a name="scripts-disponibles"></a>
## <img src="https://api.iconify.design/mdi:console-line.svg?color=%2364748B" width="20" height="20" align="absmiddle" /> Scripts Disponibles

### <img src="https://api.iconify.design/mdi:npm.svg?color=%23CB3837" width="20" height="20" align="absmiddle" /> Frontend (NPM)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | <img src="https://api.iconify.design/mdi:play.svg?color=%2310B981" width="16" height="16" align="absmiddle" /> Servidor de desarrollo con hot reload en `localhost:5173` |
| `npm run build` | <img src="https://api.iconify.design/mdi:package-variant.svg?color=%23F59E0B" width="16" height="16" align="absmiddle" /> Compilación optimizada para producción |
| `npm run lint` | <img src="https://api.iconify.design/mdi:check-circle.svg?color=%2310B981" width="16" height="16" align="absmiddle" /> Análisis estático con ESLint |
| `npm run preview` | <img src="https://api.iconify.design/mdi:eye.svg?color=%233B82F6" width="16" height="16" align="absmiddle" /> Preview del build de producción |
| `npm run test` | <img src="https://api.iconify.design/mdi:test-tube.svg?color=%23EF4444" width="16" height="16" align="absmiddle" /> Ejecutar tests unitarios |

### <img src="https://api.iconify.design/mdi:language-python.svg?color=%233776AB" width="20" height="20" align="absmiddle" /> Backend (Django)

| Comando | Descripción |
|---------|-------------|
| `python manage.py migrate` | <img src="https://api.iconify.design/mdi:database.svg?color=%234479A1" width="16" height="16" align="absmiddle" /> Aplicar migraciones a la BD |
| `python manage.py makemigrations` | <img src="https://api.iconify.design/mdi:file-plus.svg?color=%2310B981" width="16" height="16" align="absmiddle" /> Crear nuevas migraciones |
| `python manage.py createsuperuser` | <img src="https://api.iconify.design/mdi:account-plus.svg?color=%238B5CF6" width="16" height="16" align="absmiddle" /> Crear usuario administrador |
| `python manage.py runserver` | <img src="https://api.iconify.design/mdi:play.svg?color=%2310B981" width="16" height="16" align="absmiddle" /> Servidor desarrollo en `localhost:8000` |
| `python manage.py test` | <img src="https://api.iconify.design/mdi:test-tube.svg?color=%23EF4444" width="16" height="16" align="absmiddle" /> Ejecutar suite de tests |
| `python manage.py collectstatic` | <img src="https://api.iconify.design/mdi:folder.svg?color=%23EAB308" width="16" height="16" align="absmiddle" /> Recopilar archivos estáticos |
| `python manage.py sync_igdb` | <img src="https://api.iconify.design/mdi:refresh.svg?color=%233B82F6" width="16" height="16" align="absmiddle" /> Sincronizar con IGDB |
| `python manage.py actualizar_precios` | <img src="https://api.iconify.design/mdi:currency-usd.svg?color=%2310B981" width="16" height="16" align="absmiddle" /> Actualizar precios de juegos |

### <img src="https://api.iconify.design/mdi:docker.svg?color=%232496ED" width="20" height="20" align="absmiddle" /> Docker

| Comando | Descripción |
|---------|-------------|
| `docker-compose up -d` | <img src="https://api.iconify.design/mdi:play.svg?color=%2310B981" width="16" height="16" align="absmiddle" /> Levantar todos los servicios en background |
| `docker-compose down` | <img src="https://api.iconify.design/mdi:stop.svg?color=%23EF4444" width="16" height="16" align="absmiddle" /> Detener todos los servicios |
| `docker-compose logs -f [servicio]` | <img src="https://api.iconify.design/mdi:file-document.svg?color=%2364748B" width="16" height="16" align="absmiddle" /> Ver logs en tiempo real |
| `docker-compose ps` | <img src="https://api.iconify.design/mdi:format-list-bulleted.svg?color=%233B82F6" width="16" height="16" align="absmiddle" /> Ver estado de contenedores |
| `docker-compose restart [servicio]` | <img src="https://api.iconify.design/mdi:restart.svg?color=%23F59E0B" width="16" height="16" align="absmiddle" /> Reiniciar servicio específico |
| `docker-compose exec backend bash` | <img src="https://api.iconify.design/mdi:console-line.svg?color=%2364748B" width="16" height="16" align="absmiddle" /> Acceder a shell del backend |

> **<img src="https://api.iconify.design/mdi:lightbulb.svg?color=%23F59E0B" width="20" height="20" align="absmiddle" /> Tip**: En producción con Docker, Gunicorn arranca automáticamente con `gunicorn gestor_videojuegos.wsgi:application --bind 0.0.0.0:8000`

---

<a name="estructura-del-proyecto"></a>
## <img src="https://api.iconify.design/mdi:file-tree.svg?color=%23EAB308" width="20" height="20" align="absmiddle" /> Estructura del Proyecto

```text
GameS/
├── backend/                # Aplicación en Django Rest Framework
│   ├── actividad/          # Lógica para registro de actividades y estadísticas
│   ├── apiPrecios/         # Core Scraper y parser de APIs comerciales (Aks)
│   ├── comentarios/        # Gestión del sistema social de reseñas
│   ├── gestor_videojuegos/ # Entrada principal, urls core y Settings.
│   ├── juegos/             # Gestión de la caché Redis e integracion con IGDB.
│   ├── notificaciones/     # Envío de alertas on-the-fly al front.
│   ├── usuarios/           # Custom User Auth, perfiles en JWT y recomendaciones.
│   ├── manage.py           # CLI de desarrollo nativo Django
│   └── requirements.txt    # Manifiesto de PIP Python
├── frontend/               # SPA construida con React + Vite
│   ├── public/             # Estáticos base, íconos y Favicon de identidad
│   ├── src/                # Vistas, context, utilidades, librerías y componentes.
│   ├── package.json        # Deps de NPM (+ Tailwind, Radix)
│   └── vite.config.js      # Rulesets de bundler
├── nginx/                  # Reglas del proxy Nginx para el módulo GameS
├── cloudflare/             # Certificados TLS preconfigurados mTLS/Origin
├── docker-compose.yml      # Declarativa Infra con BD, Backend, Frontend y Caché
└── README.md               # Esta extensa hoja de Vida del proyecto
```

---

<a name="pruebas"></a>
## <img src="https://api.iconify.design/mdi:test-tube.svg?color=%23EF4444" width="20" height="20" align="absmiddle" /> Pruebas

Lanza la consola interactiva test del framework de Python directamente con:
```bash
cd backend
python manage.py test
```

Verificación del Frontend (Análisis estático modularizado):
```bash
cd frontend
npm run lint
```

---

<a name="despliegue"></a>
## <img src="https://api.iconify.design/mdi:cloud-upload.svg?color=%233B82F6" width="20" height="20" align="absmiddle" /> Despliegue

La plataforma usa `docker-compose` atada fuertemente a mecanismos del orquestador exterior:
- Consta de etiquetas de **Sablier** (`sablier.enable=true` / `sablier.strategy=dynamic`) en el servicio del backend, dispuestas para paralogizar auto-suspensión de los bins Docker bajo falta de tráfico web, optimizando al máximo un despliegue VPS o Host de baja capacidad. 
- Contempla el enrutamiento directo de sus volúmenes hacia la recolección estática (`media_data`), y la incrustación de certificados firmados por Cloudflare.

```bash
docker-compose --env-file .env up --build -d
```

### <img src="https://api.iconify.design/mdi:speedometer.svg?color=%2310B981" width="20" height="20" align="absmiddle" /> Optimizaciones de Producción

El proyecto incluye varias optimizaciones para entornos de producción:

- **Auto-suspensión con Sablier**: Los contenedores se suspenden automáticamente cuando no hay tráfico, reduciendo el consumo de recursos
- **Caché Redis**: Base de datos de juegos completamente cacheada para respuestas instantáneas
- **Compresión Nginx**: Assets comprimidos con gzip/brotli para tiempos de carga menores
- **Certificados TLS**: Integración lista con Cloudflare Origin Certificates
- **Gunicorn Workers**: Configuración optimizada de workers basada en CPU cores disponibles

---

<a name="solucion-de-problemas"></a>
## <img src="https://api.iconify.design/mdi:bug.svg?color=%23EF4444" width="20" height="20" align="absmiddle" /> Solución de Problemas

<details>
<summary><b><img src="https://api.iconify.design/mdi:alert-circle.svg?color=%23EF4444" width="20" height="20" align="absmiddle" /> Error: "Connection refused" al acceder a la aplicación</b></summary>

**Problema**: No se puede conectar a la aplicación después del despliegue.

**Solución**:
```bash
# 1. Verificar que todos los contenedores están ejecutándose
docker-compose ps

# 2. Verificar logs de los servicios
docker-compose logs backend
docker-compose logs nginx

# 3. Verificar conectividad de red entre contenedores
docker-compose exec backend ping db
docker-compose exec backend ping redis
```

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:alert.svg?color=%23EAB308" width="20" height="20" align="absmiddle" /> Redis no se conecta o falla al iniciar</b></summary>

**Problema**: El backend no puede conectarse a Redis.

**Solución**:
```bash
# Limpiar volúmenes de Redis y reiniciar
docker-compose down
docker volume rm games_redis_data
docker-compose up -d redis

# Verificar estado de Redis
docker-compose exec redis redis-cli ping
```

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:alert-circle.svg?color=%23F97316" width="20" height="20" align="absmiddle" /> MySQL: "Access denied for user"</b></summary>

**Problema**: Error de autenticación con MySQL.

**Solución**:
1. Verificar que las variables de entorno en `.env` son correctas
2. Asegurarse de que `MYSQL_USER` y `MYSQL_PASSWORD` coinciden con `DB_USER` y `DB_PASSWORD`
3. Recrear los contenedores:
```bash
docker-compose down -v
docker-compose up -d
```

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:information.svg?color=%2310B981" width="20" height="20" align="absmiddle" /> La sincronización de IGDB es muy lenta</b></summary>

**Problema**: La primera carga de datos de IGDB tarda demasiado.

**Solución**:
- Es normal en la primera ejecución (puede tardar 10-30 minutos)
- Puedes monitorear el progreso en los logs:
```bash
docker-compose logs -f backend | grep -i igdb
```
- Para cargas incrementales posteriores, el proceso es mucho más rápido gracias a Redis

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:help-circle.svg?color=%2364748B" width="20" height="20" align="absmiddle" /> Frontend no se actualiza después de cambios</b></summary>

**Problema**: Los cambios en el código del frontend no se reflejan.

**Solución**:
```bash
# Limpiar caché de Vite y node_modules
cd frontend
rm -rf node_modules/.vite
npm run build

# Reconstruir contenedor de frontend
docker-compose up -d --build frontend
```

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:information.svg?color=%233B82F6" width="20" height="20" align="absmiddle" /> Problemas con CORS en el frontend</b></summary>

**Problema**: Errores de CORS al hacer peticiones a la API.

**Solución**:
1. Verificar que `CSRF_TRUSTED_ORIGINS` en `.env` incluye tu dominio:
```env
CSRF_TRUSTED_ORIGINS=http://localhost,http://127.0.0.1,https://tu-dominio.com
```
2. Reiniciar el backend:
```bash
docker-compose restart backend
```

</details>

---

<a name="faq"></a>
## <img src="https://api.iconify.design/mdi:frequently-asked-questions.svg?color=%236366F1" width="20" height="20" align="absmiddle" /> FAQ

<details>
<summary><b><img src="https://api.iconify.design/mdi:help-circle.svg?color=%236366F1" width="20" height="20" align="absmiddle" /> ¿Necesito pagar por las APIs de IGDB o AllKeyShop?</b></summary>

**IGDB**: La API es gratuita pero requiere registro en Twitch Developers. El proyecto incluye credenciales de ejemplo, pero para uso en producción debes obtener las tuyas propias.

**AllKeyShop**: El proyecto usa web scraping público. No se requiere API key. **Nota**: El uso de web scraping podría suponer un consumo de tráfico no deseado en su página web, por lo que **no se debería implementar en entornos de producción abiertos**.

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:help-circle.svg?color=%236366F1" width="20" height="20" align="absmiddle" /> ¿Puedo usar otra base de datos en lugar de MySQL?</b></summary>

Sí, Django soporta PostgreSQL, SQLite y otros motores. Necesitarás:
1. Modificar la configuración de `DATABASES` en [backend/gestor_videojuegos/settings.py](backend/gestor_videojuegos/settings.py)
2. Actualizar las dependencias en [backend/requirements.txt](backend/requirements.txt)
3. Modificar [docker-compose.yml](docker-compose.yml)

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:help-circle.svg?color=%236366F1" width="20" height="20" align="absmiddle" /> ¿Con qué frecuencia se actualizan los precios?</b></summary>

Por defecto, el sistema actualiza los precios cada 6 horas mediante tareas programadas. Puedes configurar la frecuencia modificando los comandos cron en el backend o ejecutar manualmente:

```bash
docker-compose exec backend python manage.py actualizar_precios
```

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:help-circle.svg?color=%236366F1" width="20" height="20" align="absmiddle" /> ¿Cómo agrego más plataformas o géneros?</b></summary>

Las plataformas y géneros se sincronizan automáticamente desde IGDB. Para forzar una resincronización:

```bash
docker-compose exec backend python manage.py sync_igdb --full
```

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:help-circle.svg?color=%236366F1" width="20" height="20" align="absmiddle" /> ¿El sistema soporta múltiples usuarios?</b></summary>

Sí, GameS soporta múltiples usuarios con autenticación JWT. Cada usuario tiene:
- Biblioteca personal independiente
- Estadísticas propias
- Recomendaciones personalizadas basadas en su colección
- Sistema de notificaciones individual

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:help-circle.svg?color=%236366F1" width="20" height="20" align="absmiddle" /> ¿Puedo exportar mis datos?</b></summary>

Actualmente el sistema no incluye exportación directa, pero puedes acceder a tus datos mediante:
- La API REST con tu token de autenticación
- Acceso directo a la base de datos MySQL
- Panel de administración de Django en `/admin`

</details>

<details>
<summary><b><img src="https://api.iconify.design/mdi:help-circle.svg?color=%236366F1" width="20" height="20" align="absmiddle" /> ¿Qué recursos necesito para ejecutar GameS?</b></summary>

**Requerimientos mínimos**:
- 2 CPU cores
- 4GB RAM
- 20GB almacenamiento (incluyendo caché de Redis)
- Docker 20.x+

**Recomendado para producción**:
- 4 CPU cores
- 8GB RAM
- 50GB SSD
- Cloudflare como CDN/proxy

</details>

---

<a name="licencia-y-derechos"></a>
## <img src="https://api.iconify.design/mdi:certificate.svg?color=%23EAB308" width="20" height="20" align="absmiddle" /> Licencia y Derechos

© Copyright - Todos los derechos del código fuente y logotipos de GameS pertenecen y están adjudicados exclusivamente a su autor principal.

**Este es un proyecto privativo y la copia, reproducción, venta o uso no autorizado en terceros servicios externos se encuentra prohibido según la jurisdicción actual.** No se aceptan Pull Requests ni participaciones externas.

### <img src="https://api.iconify.design/mdi:information.svg?color=%233B82F6" width="20" height="20" align="absmiddle" /> Política de Uso

- ✅ Uso personal y educativo
- ✅ Estudio del código fuente
- ✅ Reportar issues y bugs
- ❌ Uso comercial sin autorización
- ❌ Redistribución o venta
- ❌ Fork público del proyecto

---

<div align="center">

### <img src="https://api.iconify.design/mdi:star.svg?color=%23EAB308" width="20" height="20" align="absmiddle" /> Agradecimientos

Este proyecto utiliza y agradece a:

- [IGDB](https://www.igdb.com/) por su completa base de datos de videojuegos
- [Radix UI](https://www.radix-ui.com/) por sus componentes accesibles
- [Tailwind CSS](https://tailwindcss.com/) por el framework CSS
- [Iconify](https://iconify.design/) por los iconos utilizados en esta documentación

---

**Hecho por Sebas <img src="https://api.iconify.design/mdi:heart.svg?color=%23EF4444" width="20" height="20" align="absmiddle" />**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/alvarosac99)

<sub>v1 | Última actualización: Febrero 2026</sub>

</div>
