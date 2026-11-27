import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  // Served at root paths (/login, /dashboard, ...) on the TechXpress domain;
  // apps/site owns /. Distinct assetsDir prevents collisions in dist/.
  base: '/',
  build: {
    assetsDir: 'app-assets',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      // Dev convenience — bypasses CORS during `npm run dev`. Production
      // build hits VITE_API_URL directly.
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
