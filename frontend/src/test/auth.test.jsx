import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { renderWithProviders } from './helpers/renderWithProviders';
import Login from '../pages/Login';

// ── AuthContext ──────────────────────────────────────────────────────────────

describe('AuthContext – estado inicial', () => {
  it('empieza no autenticado cuando session devuelve authenticated:false', async () => {
    // El handler por defecto ya devuelve authenticated:false
    const { container } = renderWithProviders(<Login />);
    // Si estuviera autenticado, redirige y no renderiza el form
    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  it('redirige a /bienvenida si session devuelve authenticated:true', async () => {
    server.use(
      http.get('*/usuarios/session/', () =>
        HttpResponse.json({
          authenticated: true,
          id: 1,
          username: 'admin',
          email: 'a@a.com',
          rol: 'ADMIN',
          nombre: 'Admin',
        })
      )
    );

    renderWithProviders(<Login />, { route: '/login' });

    // El form no debe aparecer (redirige)
    await waitFor(() => {
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
    });
  });
});

// ── Login page ───────────────────────────────────────────────────────────────

// Helpers para no depender del idioma del placeholder
const getUsernameInput = () => screen.getByRole('textbox');
const getPasswordInput = () => document.querySelector('input[type="password"]');
const getSubmitBtn = () => screen.getByRole('button', { name: /login|entrar|iniciar/i });

describe('Login – render', () => {
  it('muestra campos de usuario y contraseña', async () => {
    renderWithProviders(<Login />);
    await waitFor(() => {
      expect(getUsernameInput()).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
    });
  });

  it('muestra enlace a registro', async () => {
    renderWithProviders(<Login />);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /register|regístrate/i })).toBeInTheDocument();
    });
  });
});

describe('Login – submit exitoso', () => {
  it('no muestra error con credenciales correctas', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: '/login' });

    await waitFor(() => getUsernameInput());

    await user.type(getUsernameInput(), 'admin');
    await user.type(getPasswordInput(), 'pass');
    await user.click(getSubmitBtn());

    await waitFor(() => {
      expect(screen.queryByText(/credenciales incorrectas/i)).not.toBeInTheDocument();
    });
  });
});

describe('Login – submit fallido', () => {
  it('muestra mensaje de error con credenciales incorrectas', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await waitFor(() => getUsernameInput());

    await user.type(getUsernameInput(), 'wrong');
    await user.type(getPasswordInput(), 'wrongpass');
    await user.click(getSubmitBtn());

    await waitFor(() => {
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
    });
  });

  it('muestra el error devuelto por el servidor', async () => {
    server.use(
      http.post('*/usuarios/login/', () =>
        HttpResponse.json({ error: 'Cuenta bloqueada' }, { status: 403 })
      )
    );

    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await waitFor(() => getUsernameInput());

    await user.type(getUsernameInput(), 'x');
    await user.type(getPasswordInput(), 'x');
    await user.click(getSubmitBtn());

    await waitFor(() => {
      expect(screen.getByText(/cuenta bloqueada/i)).toBeInTheDocument();
    });
  });
});

describe('Login – API caída', () => {
  it('no rompe el componente si la API no responde', async () => {
    server.use(
      http.post('*/usuarios/login/', () => HttpResponse.error())
    );

    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await waitFor(() => getUsernameInput());

    await user.type(getUsernameInput(), 'admin');
    await user.type(getPasswordInput(), 'pass');
    await user.click(getSubmitBtn());

    // El input sigue ahí → no crashea
    await waitFor(() => {
      expect(getUsernameInput()).toBeInTheDocument();
    });
  });
});
