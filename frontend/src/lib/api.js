const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
export const API_BASE_URL = rawBaseUrl.replace(/\/+$|\s+$/g, "");

let hasLoggedMissingBase = false;

// Cache en memoria para ETags y respuestas
const etagCache = new Map();
const responseCache = new Map();

function normalizeEndpoint(endpoint = "") {
  if (typeof endpoint !== "string") return String(endpoint);
  return endpoint.replace(/^\/+/, "");
}

function fallbackUrl(endpoint = "") {
  const value = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (!hasLoggedMissingBase) {
    console.warn(
      "VITE_API_BASE_URL is not set; the app will hit relative API routes. Configure VITE_API_BASE_URL for each environment."
    );
    hasLoggedMissingBase = true;
  }
  return value;
}

export function getApiUrl(endpoint = "") {
  const cleanedEndpoint = normalizeEndpoint(endpoint);
  if (API_BASE_URL) {
    return cleanedEndpoint ? `${API_BASE_URL}/${cleanedEndpoint}` : API_BASE_URL;
  }
  return fallbackUrl(endpoint);
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function isUnsafeMethod(method = "GET") {
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase());
}

/**
 * Genera una clave única para cachear basada en la URL y método
 */
function getCacheKey(url, method = "GET") {
  return `${method}:${url}`;
}

/**
 * Función principal para hacer peticiones a la API con soporte completo de ETags
 */
export async function apiFetch(endpoint = "", options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const url = getApiUrl(endpoint);
  const cacheKey = getCacheKey(url, method);

  const headers = new Headers(options.headers || {});

  // Añadir CSRF token para métodos no seguros
  if (isUnsafeMethod(method)) {
    const csrf = getCookie("csrftoken");
    if (csrf && !headers.has("X-CSRFToken")) {
      headers.set("X-CSRFToken", csrf);
    }
  }

  // Para peticiones GET, añadir el ETag si existe en caché
  if (method === "GET" && etagCache.has(cacheKey)) {
    const cachedEtag = etagCache.get(cacheKey);
    headers.set("If-None-Match", cachedEtag);
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: "include",
    mode: options.mode || "cors",
  });

  // Si es GET, manejar ETags
  if (method === "GET") {
    const etag = response.headers.get("ETag");

    // Si recibimos 304 Not Modified, devolver la respuesta cacheada
    if (response.status === 304) {
      if (responseCache.has(cacheKey)) {
        const cachedResponse = responseCache.get(cacheKey);
        // Crear una nueva Response con los datos cacheados
        return new Response(JSON.stringify(cachedResponse), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "ETag": etag || etagCache.get(cacheKey),
          },
        });
      }
    }

    // Si recibimos 200 con ETag, cachear la respuesta
    if (response.ok && etag) {
      // Clonar la respuesta para poder leerla dos veces
      const clonedResponse = response.clone();

      try {
        const data = await clonedResponse.json();

        // Guardar ETag y datos en caché
        etagCache.set(cacheKey, etag);
        responseCache.set(cacheKey, data);
      } catch (error) {
        // Si no es JSON, no cachear
        console.warn("No se pudo cachear la respuesta (no es JSON):", error);
      }
    }
  }

  // Para métodos que modifican datos (POST, PUT, DELETE, PATCH),
  // invalidar la caché relacionada
  if (isUnsafeMethod(method)) {
    invalidateRelatedCache(endpoint);
  }

  return response;
}

/**
 * Invalida la caché relacionada con un endpoint
 * Por ejemplo, si se hace POST a /usuarios/favoritos/, 
 * invalidar todas las cachés de /usuarios/
 */
function invalidateRelatedCache(endpoint) {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const baseEndpoint = normalizedEndpoint.split('/')[0];

  // Eliminar todas las entradas de caché que empiecen con el mismo base endpoint
  for (const [key] of etagCache.entries()) {
    if (key.includes(baseEndpoint)) {
      etagCache.delete(key);
      responseCache.delete(key);
    }
  }
}

/**
 * Limpia toda la caché de ETags y respuestas
 */
export function clearCache() {
  etagCache.clear();
  responseCache.clear();
}

/**
 * Limpia la caché de un endpoint específico
 */
export function clearCacheForEndpoint(endpoint) {
  const url = getApiUrl(endpoint);
  const cacheKey = getCacheKey(url, "GET");
  etagCache.delete(cacheKey);
  responseCache.delete(cacheKey);
}
