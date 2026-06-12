/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Firebase Hosting serves from build/ (see firebase.json).
    outDir: 'build',
  },
  server: {
    port: 3000,
  },
  define: {
    'import.meta.env.VITE_VERSION': JSON.stringify(process.env.npm_package_version),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    env: {
      TZ: 'America/New_York',
    },
  },
});
