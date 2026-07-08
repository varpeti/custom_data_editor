import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/custom_data_editor/dist/',
  server: {
    port: 5173,
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
});
