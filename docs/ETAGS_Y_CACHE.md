# Sistema de ETags y Caché

## Resumen

Este proyecto implementa un sistema completo de ETags para optimizar el rendimiento y reducir el uso de ancho de banda. Los ETags permiten que el navegador y Cloudflare validen si el contenido ha cambiado antes de descargarlo nuevamente.

## Cómo Funciona

### Backend (Django)

1. **Middleware AutoETag** (`etag_middleware.py`):
   - Intercepta todas las respuestas GET de la API
   - Genera un hash MD5 del contenido de la respuesta
   - Añade el header `ETag` con el hash
   - Compara el `If-None-Match` del cliente con el ETag actual
   - Si coinciden, devuelve `304 Not Modified` (sin contenido)
   - Si no coinciden, devuelve `200 OK` con el contenido completo

2. **Headers de Caché**:
   ```
   ETag: "abc123def456..."
   Cache-Control: public, max-age=0, must-revalidate
   Vary: Accept-Encoding, Authorization
   ```

   - `public`: Permite que Cloudflare y navegadores cacheen
   - `max-age=0`: Fuerza revalidación en cada petición
   - `must-revalidate`: Debe validar con el servidor si está expirado
   - `Vary`: Asegura que usuarios diferentes no compartan caché

### Frontend (React)

1. **apiFetch mejorado** (`lib/api.js`):
   - Mantiene una caché en memoria de ETags y respuestas
   - En cada petición GET, envía el header `If-None-Match` si existe un ETag previo
   - Si recibe `304 Not Modified`, devuelve la respuesta cacheada localmente
   - Si recibe `200 OK`, actualiza la caché con el nuevo ETag y datos
   - Invalida la caché automáticamente cuando se hacen cambios (POST/PUT/DELETE)

### Cloudflare

Cloudflare actúa como una capa intermedia de caché:

1. **Primera petición de un usuario**:
   ```
   Cliente → Cloudflare → Backend
   Backend devuelve: 200 OK + ETag + Contenido
   Cloudflare cachea la respuesta
   Cliente recibe: 200 OK + ETag + Contenido
   ```

2. **Segunda petición del mismo usuario**:
   ```
   Cliente envía: If-None-Match: "abc123"
   Cloudflare → Backend
   Backend devuelve: 304 Not Modified
   Cliente recibe: 304 Not Modified
   Cliente usa caché local
   ```

3. **Cuando cambian los datos en el backend**:
   ```
   Cliente envía: If-None-Match: "abc123"
   Cloudflare → Backend
   Backend genera nuevo ETag: "xyz789"
   Backend devuelve: 200 OK + ETag: "xyz789" + Contenido nuevo
   Cloudflare actualiza su caché
   Cliente actualiza su caché local
   ```

## Flujo Completo

### Escenario 1: Primera carga
```
1. Usuario abre la app
2. Frontend hace GET /api/juegos/populares/
3. Backend genera ETag basado en los datos actuales
4. Backend devuelve 200 OK con ETag y datos
5. Cloudflare cachea la respuesta
6. Frontend guarda ETag y datos en memoria
```

### Escenario 2: Recarga sin cambios
```
1. Usuario recarga la página
2. Frontend hace GET /api/juegos/populares/ con If-None-Match: "abc123"
3. Cloudflare reenvía la petición al backend
4. Backend compara ETags: coinciden
5. Backend devuelve 304 Not Modified
6. Cloudflare devuelve 304 al cliente
7. Frontend usa los datos cacheados localmente
```

### Escenario 3: Cambios en el backend
```
1. Se añade un nuevo juego a la base de datos
2. Usuario recarga la página
3. Frontend hace GET /api/juegos/populares/ con If-None-Match: "abc123"
4. Backend genera nuevo ETag: "xyz789" (datos cambiaron)
5. Backend devuelve 200 OK con nuevo ETag y datos actualizados
6. Cloudflare actualiza su caché
7. Frontend actualiza su caché local
8. Usuario ve los datos nuevos
```

### Escenario 4: Usuario modifica datos
```
1. Usuario edita sus favoritos
2. Frontend hace POST /api/usuarios/favoritos/
3. Backend procesa el cambio
4. Frontend invalida automáticamente la caché de /usuarios/
5. Próxima petición GET a /usuarios/perfil/ obtendrá datos frescos
```

## Configuración de Cloudflare

Para que el sistema funcione óptimamente, asegúrate de tener estas configuraciones en Cloudflare:

### 1. Reglas de Caché (Cache Rules)

Crea una regla para tu API:

```
Si la URL coincide con: api.zenithseed.dev/*
Entonces:
  - Nivel de caché: Standard
  - Respetar headers existentes: Activado
  - Cachear por estado: 200, 304
  - Edge Cache TTL: Respetar headers del origen
```

### 2. Configuración de Caché (Caching)

En la configuración general de caché:

- **Nivel de caché**: Standard
- **Browser Cache TTL**: Respetar headers existentes
- **Siempre en línea**: Desactivado (para APIs)

### 3. Headers importantes

Cloudflare respetará estos headers del backend:

- `Cache-Control`: Controla cuánto tiempo cachea Cloudflare
- `ETag`: Identificador único del contenido
- `Vary`: Indica qué headers afectan la caché

### 4. Purgar caché manualmente (si es necesario)

Si necesitas forzar la actualización de la caché de Cloudflare:

1. Ve a Cloudflare Dashboard
2. Caching → Configuration
3. Purge Cache → Custom Purge
4. Introduce las URLs específicas o purga todo

## Ventajas del Sistema

1. **Reducción de ancho de banda**: 
   - Las respuestas 304 no incluyen el cuerpo, solo headers (~200 bytes vs varios KB)
   
2. **Mejor rendimiento**:
   - Cloudflare puede servir contenido cacheado sin consultar el backend
   - El frontend puede usar datos locales sin esperar la red
   
3. **Datos siempre actualizados**:
   - Cada petición valida si los datos cambiaron
   - Si cambiaron, se descargan automáticamente
   
4. **Escalabilidad**:
   - Reduce la carga en el servidor backend
   - Cloudflare maneja la mayoría de las peticiones

## Monitoreo

Para verificar que el sistema funciona correctamente:

### En el navegador (DevTools)

1. Abre las DevTools (F12)
2. Ve a la pestaña Network
3. Recarga la página
4. Busca peticiones a la API
5. Verifica:
   - Primera carga: Status 200, tamaño completo
   - Recarga: Status 304, tamaño pequeño (~200 bytes)
   - Headers: Debe aparecer `ETag` y `If-None-Match`

### En Cloudflare Analytics

1. Ve a Analytics → Cache
2. Verifica:
   - Cache Hit Ratio (debe aumentar con el tiempo)
   - Saved Bandwidth (debe mostrar ahorro significativo)

## Invalidación de Caché

El sistema invalida automáticamente la caché en estos casos:

1. **Cambios del usuario**:
   - POST, PUT, DELETE, PATCH invalidan la caché relacionada
   - Ejemplo: POST a `/usuarios/favoritos/` invalida `/usuarios/*`

2. **Cambios en el backend**:
   - El ETag cambia automáticamente cuando los datos cambian
   - La próxima petición recibirá los datos nuevos

3. **Manual** (si es necesario):
   ```javascript
   import { clearCache, clearCacheForEndpoint } from '@/lib/api';
   
   // Limpiar toda la caché
   clearCache();
   
   // Limpiar un endpoint específico
   clearCacheForEndpoint('/api/juegos/populares/');
   ```

## Solución de Problemas

### Problema: Los datos no se actualizan

**Causa**: La caché local del navegador está sirviendo datos antiguos

**Solución**:
1. Verifica que el backend esté generando ETags diferentes para datos diferentes
2. Limpia la caché del navegador (Ctrl+Shift+R)
3. Verifica que `apiFetch` esté enviando `If-None-Match`

### Problema: Demasiadas peticiones 200 (pocas 304)

**Causa**: Los ETags no se están generando consistentemente

**Solución**:
1. Verifica que el middleware `AutoETagMiddleware` esté activo
2. Verifica que las respuestas incluyan el header `ETag`
3. Verifica que el frontend esté guardando y enviando ETags

### Problema: Usuarios ven datos de otros usuarios

**Causa**: Cloudflare está cacheando sin considerar la autenticación

**Solución**:
1. Verifica que el header `Vary: Authorization` esté presente
2. Configura Cloudflare para respetar el header `Vary`
3. Considera usar diferentes URLs para datos privados vs públicos

## Mejoras Futuras

1. **Persistencia de caché**:
   - Guardar ETags en localStorage para sobrevivir recargas
   - Implementar Service Workers para caché offline

2. **Caché más inteligente**:
   - TTL diferente por tipo de contenido
   - Invalidación selectiva más granular

3. **Compresión**:
   - Activar compresión Brotli/Gzip en Cloudflare
   - Reducir aún más el tamaño de las respuestas

4. **Métricas**:
   - Añadir logging de cache hits/misses
   - Dashboard de rendimiento de caché
