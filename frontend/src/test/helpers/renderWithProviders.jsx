import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthProvider from '../../context/AuthContext';
import LangProvider from '../../context/LangContext';
import NotificacionesProvider from '../../context/NotificacionesContext';

export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LangProvider>
        <AuthProvider>
          <NotificacionesProvider>
            {ui}
          </NotificacionesProvider>
        </AuthProvider>
      </LangProvider>
    </MemoryRouter>
  );
}
