import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: [

      'oleksandrs-macbook-air.neon-chuckwalla.ts.net',
      'localhost',
      '.ts.net' // Allow all Tailscale domains
    ],
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: 'https://dev.neon-chuckwalla.ts.net',
        changeOrigin: true,
        // Allow self-signed certificates for Tailscale tunnel
        secure: false,
        ws: true,
        // Bypass Private Network Access restrictions by proxying through Node.js
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('Proxy error:', err);
            res.writeHead(500, {
              'Content-Type': 'text/plain'
            });
          res.end('Proxy error: ' + err.message);
          });
        }
      },
      '/log': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: false,
        rewrite: (path) => path.replace(/^\/log/, '/log')
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: [
      'oleksandrs-macbook-air.neon-chuckwalla.ts.net',
      'localhost',
      '.ts.net'
    ]
  }
})
