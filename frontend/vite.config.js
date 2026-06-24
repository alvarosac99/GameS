import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: ["zenithseed", ".tail8b8d20.ts.net", ".zenithseed.dev"],
    proxy: {
      '/usuarios':       { target: 'http://localhost:8000', changeOrigin: true, secure: false, rewrite: p => `/api${p}` },
      '/juegos':         { target: 'http://localhost:8000', changeOrigin: true, secure: false, rewrite: p => `/api${p}` },
      '/precios':        { target: 'http://localhost:8000', changeOrigin: true, secure: false, rewrite: p => `/api${p}` },
      '/media':          { target: 'https://localhost:443', changeOrigin: true, secure: false, headers: { host: 'api.games.zenithseed.dev' } },
      '/notificaciones': { target: 'http://localhost:8000', changeOrigin: true, secure: false, rewrite: p => `/api${p}` },
      '/comentarios':    { target: 'http://localhost:8000', changeOrigin: true, secure: false, rewrite: p => `/api${p}` },
      '/diario':         { target: 'http://localhost:8000', changeOrigin: true, secure: false, rewrite: p => `/api${p}` },
      '/sesiones':       { target: 'http://localhost:8000', changeOrigin: true, secure: false, rewrite: p => `/api${p}` },
      '/reportes':       { target: 'http://localhost:8000', changeOrigin: true, secure: false, rewrite: p => `/api${p}` },
      '/actividad':      { target: 'http://localhost:8000', changeOrigin: true, secure: false, rewrite: p => `/api${p}` },
      '/planificaciones':{ target: 'http://localhost:8000', changeOrigin: true, secure: false, rewrite: p => `/api${p}` },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
