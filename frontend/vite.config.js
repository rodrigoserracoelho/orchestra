import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In production the app is served under /orchestra/
// In dev (no VITE_BASE_PATH) it runs at /
const basePath = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  plugins: [react()],
  base: basePath,
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
