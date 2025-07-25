import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // integrações oficiais do Tailwind v4
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    historyApiFallback: true
  }
});
