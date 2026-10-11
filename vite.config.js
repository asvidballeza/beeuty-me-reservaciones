import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' permite publicar la carpeta dist en cualquier subdominio de cPanel
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    include: ['tests/**/*.test.js'],
    coverage: { include: ['src/lib/disponibilidad.js', 'src/lib/validaciones.js'], reporter: ['text', 'html'] },
  },
});
