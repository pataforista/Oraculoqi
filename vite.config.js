import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-webgl': ['ogl'],
          'vendor-capture': ['html2canvas'],
          'vendor-react': ['react', 'react-dom']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
