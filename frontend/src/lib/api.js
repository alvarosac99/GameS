const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
export const API_BASE_URL = rawBaseUrl.replace(/\/+$|\s+$/g, "");

let hasLoggedMissingBase = false;

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

export function apiFetch(endpoint = "", options = {}) {
  const method = (options.method || "GET").toUpperCase();

  const headers = new Headers(options.headers || {});

  if (isUnsafeMethod(method)) {
    const csrf = getCookie("csrftoken");
    if (csrf && !headers.has("X-CSRFToken")) {
      headers.set("X-CSRFToken", csrf);
    }
  }

  return fetch(getApiUrl(endpoint), {
    ...options,
    method,
    headers,
    credentials: "include",
    mode: options.mode || "cors",
  });
}
