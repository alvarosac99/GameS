import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { server } from './mocks/server';
import { renderWithProviders } from './helpers/renderWithProviders';
import GameCard from '../components/GameCard';
import BuscadorGlobal from '../components/BuscadorGlobal';

// ── GameCard ─────────────────────────────────────────────────────────────────

describe('GameCard – sin juego', () => {
  it('renderiza tarjeta vacía', () => {
    render(<GameCard juego={null} />);
    expect(screen.getByText(/vacío/i)).toBeInTheDocument();
  });
});

describe('GameCard – con juego sin portada', () => {
  const juego = { id: 1, name: 'Half-Life 3', cover: null };

  it('muestra texto "Sin portada"', () => {
    render(<GameCard juego={juego} />);
    expect(screen.getByText(/sin portada/i)).toBeInTheDocument();
  });

  it('llama onClick al hacer click', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<GameCard juego={juego} onClick={handler} />);
    await user.click(screen.getByText(/sin portada/i).closest('div[class*=rounded]'));
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('GameCard – con juego y portada', () => {
  const juego = {
    id: 2,
    name: 'The Witcher 3',
    cover: { url: '//images.igdb.com/igdb/image/upload/t_thumb/abc.jpg' },
  };

  it('renderiza imagen con src correcto', () => {
    render(<GameCard juego={juego} />);
    const img = screen.getByAltText('The Witcher 3');
    expect(img.src).toContain('t_cover_big');
    expect(img.src).toContain('https:');
  });
});

describe('GameCard – valoración', () => {
  const juego = { id: 3, name: 'Doom', cover: null };

  it('no muestra estrellas sin valoración', () => {
    const { container } = render(<GameCard juego={juego} />);
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });

  it('muestra 5 estrellas cuando hay valoración', () => {
    const { container } = render(<GameCard juego={juego} valoracion={4} />);
    expect(container.querySelectorAll('svg')).toHaveLength(5);
  });
});

describe('GameCard – tiempo', () => {
  const juego = { id: 4, name: 'Cyberpunk', cover: null };

  it('no muestra badge de tiempo si tiempo=0', () => {
    render(<GameCard juego={juego} tiempo={0} />);
    expect(screen.queryByText(/h$/)).not.toBeInTheDocument();
  });

  it('muestra horas correctamente con tiempo > 0', () => {
    render(<GameCard juego={juego} tiempo={7200} />);
    expect(screen.getByText('2.0h')).toBeInTheDocument();
  });
});

// ── BuscadorGlobal ───────────────────────────────────────────────────────────

describe('BuscadorGlobal – render', () => {
  it('muestra input y botón buscar', () => {
    renderWithProviders(<BuscadorGlobal />);
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('placeholder inicial es de juegos', async () => {
    renderWithProviders(<BuscadorGlobal />);
    await waitFor(() => {
      const input = screen.getByRole('textbox');
      expect(input.placeholder).toBeTruthy();
    });
  });
});

describe('BuscadorGlobal – búsqueda de juegos', () => {
  beforeEach(() => {
    server.use(
      http.get('*/juegos/populares/', ({ request }) => {
        const q = new URL(request.url).searchParams.get('q') ?? '';
        if (!q) return HttpResponse.json({ juegos: [] });
        return HttpResponse.json({
          juegos: [
            { id: 1, name: 'The Witcher 3', cover: null },
            { id: 2, name: 'Witcher Enhanced', cover: null },
          ],
        });
      })
    );
  });

  it('no busca con menos de 2 chars', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BuscadorGlobal />);
    await user.type(screen.getByRole('textbox'), 'w');
    await waitFor(() => {
      expect(screen.queryByText('The Witcher 3')).not.toBeInTheDocument();
    });
  });

  it('muestra sugerencias tras escribir 2+ chars', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BuscadorGlobal />);
    await user.type(screen.getByRole('textbox'), 'wi');
    await waitFor(() => {
      expect(screen.getByText('The Witcher 3')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('muestra "No se han encontrado resultados" cuando la API devuelve vacío', async () => {
    server.use(
      http.get('*/juegos/populares/', () => HttpResponse.json({ juegos: [] }))
    );
    const user = userEvent.setup();
    renderWithProviders(<BuscadorGlobal />);
    await user.type(screen.getByRole('textbox'), 'xyzabc');
    await waitFor(() => {
      expect(screen.getByText(/no se han encontrado/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

describe('BuscadorGlobal – cambio de modo', () => {
  it('cambia a modo personas al pulsar el botón de modo', async () => {
    server.use(
      http.get('*/usuarios/buscar/', () =>
        HttpResponse.json({ resultados: [{ username: 'sebas', nombre: 'Sebas', foto: null }] })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<BuscadorGlobal />);

    const modeBtn = screen.getByTitle(/buscar en personas/i);
    await user.click(modeBtn);

    const input = screen.getByRole('textbox');
    await user.type(input, 'se');

    await waitFor(() => {
      expect(screen.getByText('@sebas')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

describe('BuscadorGlobal – API caída', () => {
  it('no rompe el componente si la API falla', async () => {
    server.use(
      http.get('*/juegos/populares/', () => HttpResponse.error())
    );
    const user = userEvent.setup();
    renderWithProviders(<BuscadorGlobal />);
    await user.type(screen.getByRole('textbox'), 'wi');
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});
