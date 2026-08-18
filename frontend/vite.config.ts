import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  envDir: rootDir,
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(rootDir, './src') },
  },
  server: {
    port: 5173,
    // The client calls a relative "/api" path; Vite forwards it to Express in
    // development, so no CORS round-trip or hard-coded host is needed.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
