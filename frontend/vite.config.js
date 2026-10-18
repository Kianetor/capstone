import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In sviluppo le chiamate /api vengono inoltrate al backend: niente indirizzi del server nel codice
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        // Per il backend le richieste del proxy sono "stesso sito": togliamo Origin, altrimenti aprendo l'app
        // da un altro indirizzo (es. dal telefono con l'IP del Mac) il controllo CORS risponderebbe 403
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
    },
  },
})
