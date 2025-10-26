import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: [
      'budgetbot-tg-mini-app.kayukov2010.workers.dev',
      'dev.neon-chuckwalla.ts.net',
      'oleksandrs-macbook-air.neon-chuckwalla.ts.net',
      'localhost',
      '.ts.net' // Allow all Tailscale domains
    ],
    watch: {
      usePolling: true
    },
    proxy: {
      // Proxy all /api/* requests to backend
      '/api': {
        target: 'https://dev.neon-chuckwalla.ts.net',
        changeOrigin: true,
        secure: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: [
      'budgetbot-tg-mini-app.kayukov2010.workers.dev',
      'dev.neon-chuckwalla.ts.net',
      'oleksandrs-macbook-air.neon-chuckwalla.ts.net',
      'localhost',
      '.ts.net'
    ]
  }
})
