import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",  // Permite acceso desde otras máquinas
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://10.42.0.1:8000', // Django backend sigue local
        changeOrigin: true,
        secure: false,
      }
    }
  }
});