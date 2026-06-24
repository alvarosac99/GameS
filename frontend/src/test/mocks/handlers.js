import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('*/usuarios/session/', () =>
    HttpResponse.json({ authenticated: false })
  ),

  http.post('*/usuarios/login/', async ({ request }) => {
    const body = await request.json();
    if (body.username === 'admin' && body.password === 'pass') {
      return HttpResponse.json({
        token: 'fake-token-123',
        usuario: { id: 1, username: 'admin', email: 'admin@test.com', rol: 'ADMIN' },
      });
    }
    return HttpResponse.json({ error: 'Credenciales incorrectas' }, { status: 400 });
  }),

  http.post('*/usuarios/logout/', () => HttpResponse.json({ ok: true })),

  http.get('*/usuarios/me/', () =>
    HttpResponse.json({ filtro_adulto: false, foto: null, rol: 'USER' })
  ),

  http.get('*/juegos/stats_bienvenida/', () =>
    HttpResponse.json({
      totalJuegos: 120000,
      totalUsuarios: 42,
      totalBibliotecas: 300,
      juegosPopulares: [],
      juegosRandom: [],
    })
  ),

  http.get('*/juegos/recomendados/', () =>
    HttpResponse.json({ recomendaciones: [] })
  ),

  http.get('*/juegos/buscar/', ({ request }) => {
    const q = new URL(request.url).searchParams.get('q') ?? '';
    if (!q) return HttpResponse.json([]);
    return HttpResponse.json([
      { id: 1, name: 'The Witcher 3', cover: null },
      { id: 2, name: 'Witcher Enhanced', cover: null },
    ]);
  }),
];
