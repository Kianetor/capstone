import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In sviluppo le chiamate /api vengono inoltrate al backend: niente indirizzi del server nel codice
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
