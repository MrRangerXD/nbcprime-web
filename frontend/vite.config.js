import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false },
  server: {
    proxy: {
      '/api': {
        target: 'https://nbcprime-web.vercel.app',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
});
