import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  server: { host: true, open: true },
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        platform: resolve(import.meta.dirname, 'project/kwam-developer-platform/index.html'),
        simon: resolve(import.meta.dirname, 'project/simon-says-assassin/index.html'),
        debate: resolve(import.meta.dirname, 'project/debate-app/index.html'),
        mshu: resolve(import.meta.dirname, 'project/mshu/index.html'),
      },
    },
  },
});
