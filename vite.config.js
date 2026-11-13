import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Extra pages: the presentation decks at /present and /changepay (not linked from the app)
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        present: resolve(import.meta.dirname, 'present.html'),
        changepay: resolve(import.meta.dirname, 'changepay.html')
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
