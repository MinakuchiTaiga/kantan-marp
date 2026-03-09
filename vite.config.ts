import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: 'react-dom/test-utils',
        replacement: 'preact/test-utils',
      },
      {
        find: 'react-dom',
        replacement: 'preact/compat',
      },
      {
        find: 'react/jsx-runtime',
        replacement: 'preact/jsx-runtime',
      },
      {
        find: 'react/jsx-dev-runtime',
        replacement: 'preact/jsx-runtime',
      },
      {
        find: 'react',
        replacement: 'preact/compat',
      },
    ],
  },
  build: {
    target: 'esnext',
    modulePreload: {
      polyfill: false,
    },
    cssMinify: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/vitest.setup.ts',
  },
});
