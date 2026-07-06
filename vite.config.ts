import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
});
