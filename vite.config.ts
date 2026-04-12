import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appBasePath = process.env.VITE_APP_BASE_PATH || env.VITE_APP_BASE_PATH || '/';
  const syncAnonKey = env.SYNC_ANON_API_KEY || process.env.SYNC_ANON_API_KEY || '';

  const apiProxy = {
    target: 'https://dev-1.neon-chuckwalla.ts.net',
    changeOrigin: true,
    secure: true,
    ws: true,
    configure: (proxy: any) => {
      proxy.on('proxyReq', (proxyReq: any) => {
        if (syncAnonKey) {
          proxyReq.setHeader('X-Anonymous-Key', syncAnonKey);
        }
      });
    },
  };

  return {
    base: appBasePath,
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'functions',
            dest: ''
          }
        ]
      })
    ],
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      allowedHosts: [
        'oleksandrs-macbook-air.neon-chuckwalla.ts.net',
        'localhost',
        '.ts.net',
      ],
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': apiProxy,
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      allowedHosts: [
        'oleksandrs-macbook-air.neon-chuckwalla.ts.net',
        'localhost',
        '.ts.net',
      ],
    },
  };
});
