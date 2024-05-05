// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src'),
      '@icon': resolve(__dirname, 'public/icon'),
      '@static': resolve(__dirname, 'public/static'),
    },
  },
});
