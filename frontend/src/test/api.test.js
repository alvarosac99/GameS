import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { getApiUrl, apiFetch, clearCache } from '../lib/api';

// VITE_API_BASE_URL es una constante de módulo evaluada en import-time.
// En el entorno de test no está definida → API_BASE_URL = "" → URLs relativas.
beforeEach(() => {
  clearCache();
});

describe('getApiUrl – sin VITE_API_BASE_URL (fallback relativo)', () => {
  it('devuelve ruta relativa con slash inicial', () => {
    expect(getApiUrl('juegos/buscar/')).toBe('/juegos/buscar/');
  });

  it('mantiene slash inicial si el endpoint ya lo tiene', () => {
    expect(getApiUrl('/juegos/buscar/')).toBe('/juegos/buscar/');
  });

  it('devuelve "/" cuando endpoint vacío', () => {
    expect(getApiUrl('')).toBe('/');
  });
});

describe('apiFetch – GET básico', () => {
  it('hace fetch y devuelve datos', async () => {
    const res = await apiFetch('usuarios/session/');
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.authenticated).toBe(false);
  });

  it('incluye credentials: include', async () => {
    let capturedReq;
    server.use(
      http.get('*/usuarios/session/', ({ request }) => {
        capturedReq = request;
        return HttpResponse.json({ authenticated: false });
      })
    );
    await apiFetch('usuarios/session/');
    expect(capturedReq.credentials).toBe('include');
  });
});

describe('apiFetch – CSRF en métodos unsafe', () => {
  it('añade X-CSRFToken en POST cuando cookie existe', async () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrftoken=test-csrf-token',
    });

    let capturedHeaders;
    server.use(
      http.post('*/usuarios/logout/', ({ request }) => {
        capturedHeaders = Object.fromEntries(request.headers.entries());
        return HttpResponse.json({ ok: true });
      })
    );

    await apiFetch('usuarios/logout/', { method: 'POST' });
    expect(capturedHeaders['x-csrftoken']).toBe('test-csrf-token');
  });

  it('NO añade X-CSRFToken en GET', async () => {
    let capturedHeaders;
    server.use(
      http.get('*/usuarios/session/', ({ request }) => {
        capturedHeaders = Object.fromEntries(request.headers.entries());
        return HttpResponse.json({ authenticated: false });
      })
    );
    await apiFetch('usuarios/session/');
    expect(capturedHeaders['x-csrftoken']).toBeUndefined();
  });
});

describe('apiFetch – caché ETag', () => {
  it('cachea respuesta con ETag y envía If-None-Match en segunda petición', async () => {
    const requests = [];
    server.use(
      http.get('*/juegos/stats_bienvenida/', ({ request }) => {
        requests.push(Object.fromEntries(request.headers.entries()));
        if (requests.length === 1) {
          return new HttpResponse(JSON.stringify({ totalJuegos: 100 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ETag: '"abc123"' },
          });
        }
        return new HttpResponse(null, { status: 304 });
      })
    );

    await apiFetch('juegos/stats_bienvenida/');
    await apiFetch('juegos/stats_bienvenida/');

    expect(requests[1]['if-none-match']).toBe('"abc123"');
  });

  it('devuelve datos cacheados en 304', async () => {
    server.use(
      http.get('*/juegos/stats_bienvenida/', ({ request }) => {
        const ifNoneMatch = request.headers.get('if-none-match');
        if (ifNoneMatch) {
          return new HttpResponse(null, { status: 304 });
        }
        return new HttpResponse(JSON.stringify({ totalJuegos: 99 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ETag: '"etag1"' },
        });
      })
    );

    await apiFetch('juegos/stats_bienvenida/');
    const res2 = await apiFetch('juegos/stats_bienvenida/');
    const data = await res2.json();

    expect(res2.status).toBe(200);
    expect(data.totalJuegos).toBe(99);
  });

  it('clearCache borra ETags → siguiente GET no envía If-None-Match', async () => {
    const requests = [];
    server.use(
      http.get('*/juegos/stats_bienvenida/', ({ request }) => {
        requests.push(Object.fromEntries(request.headers.entries()));
        return new HttpResponse(JSON.stringify({ totalJuegos: 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ETag: '"etag2"' },
        });
      })
    );

    await apiFetch('juegos/stats_bienvenida/');
    clearCache();
    await apiFetch('juegos/stats_bienvenida/');

    expect(requests[1]['if-none-match']).toBeUndefined();
  });
});

describe('apiFetch – invalidación de caché en POST/DELETE', () => {
  it('POST a /juegos/xxx/ invalida caché de juegos/', async () => {
    server.use(
      http.get('*/juegos/stats_bienvenida/', () =>
        new HttpResponse(JSON.stringify({ totalJuegos: 5 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ETag: '"etag3"' },
        })
      ),
      http.post('*/juegos/favoritos/', () => HttpResponse.json({ ok: true }))
    );

    const requests = [];
    server.use(
      http.get('*/juegos/stats_bienvenida/', ({ request }) => {
        requests.push(Object.fromEntries(request.headers.entries()));
        return new HttpResponse(JSON.stringify({ totalJuegos: 5 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ETag: '"etag3"' },
        });
      })
    );

    await apiFetch('juegos/stats_bienvenida/');
    await apiFetch('juegos/favoritos/', { method: 'POST', body: JSON.stringify({}) });
    await apiFetch('juegos/stats_bienvenida/');

    expect(requests[1]?.['if-none-match']).toBeUndefined();
  });
});

describe('apiFetch – errores de red', () => {
  it('propaga NetworkError cuando fetch falla', async () => {
    server.use(
      http.get('*/juegos/buscar/', () => HttpResponse.error())
    );
    await expect(apiFetch('juegos/buscar/')).rejects.toThrow();
  });

  it('devuelve respuesta 4xx sin lanzar excepción', async () => {
    server.use(
      http.get('*/juegos/buscar/', () =>
        HttpResponse.json({ detail: 'No encontrado' }, { status: 404 })
      )
    );
    const res = await apiFetch('juegos/buscar/');
    expect(res.status).toBe(404);
    expect(res.ok).toBe(false);
  });
});
