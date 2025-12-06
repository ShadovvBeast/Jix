import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './client',
  build: {
    outDir: '../dist',
  },
  server: {
    port: 9144,
    allowedHosts: ['jix.sb0.tech'],
    proxy: {
      '/api': {
        target: 'http://localhost:9188',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:9188',
        ws: true,
      },
    },
  },
});
