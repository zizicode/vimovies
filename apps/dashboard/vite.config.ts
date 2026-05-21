import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Inyecta el @use en cada archivo scss del proyecto de forma automatica
        additionalData: `@use "@/styles/variables.scss" as *;`,
      }
    }
  },
  resolve: {
    alias: {
      // Configura el alias '@' para apuntar a la carpeta 'src'
      '@': path.resolve(__dirname, './src'),
      // Workspace packages
      '@vimovies/utils': path.resolve(__dirname, '../../packages/utils/src/index.ts'),
      '@vimovies/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@vimovies/repositories': path.resolve(__dirname, '../../packages/repositories/src/index.ts'),
      '@vimovies/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
})
