# Cloudflare Pages Deployment Guide

This guide explains how to deploy the BudgetBot Mini App to Cloudflare Pages and solve corporate network restrictions.

## Overview

The app uses **Cloudflare Pages Functions** to proxy API requests, solving:
- ✅ Corporate firewall restrictions
- ✅ CORS (Cross-Origin Resource Sharing) issues
- ✅ Network proxy requirements
- ✅ Private network access (Tailscale, VPN, etc.)

## Architecture

```
Browser Client
    ↓
[Cloudflare Pages] (your-app.pages.dev)
    ↓
[Pages Function Proxy] (functions/_middleware.ts)
    ↓
[Backend APIs] (Tailscale/VPN/Private Network)
```

All `/api/*` requests are intercepted by the Cloudflare Pages Function and proxied to your backend, bypassing browser CORS restrictions.

## Setup Instructions

### 1. Deploy to Cloudflare Pages

#### Option A: Connect Git Repository
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create application** → **Pages**
3. Connect your GitHub/GitLab repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (or leave empty)

#### Option B: Direct Upload
```bash
# Build the project
npm run build

# Install Wrangler CLI
npm install -g wrangler

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=budgetbot-tg-mini-app
```

### 2. Configure Environment Variables

In **Cloudflare Dashboard** → **Workers & Pages** → **Your Project** → **Settings** → **Environment Variables**:

#### Required Variables (Production)

| Variable | Description | Example |
|----------|-------------|---------|
| `BACKEND_URL` | Backend API base URL | `https://dev.neon-chuckwalla.ts.net` |
| `VITE_TELEGRAM_BOT_TOKEN` | Telegram Bot Token | `123456:ABC-DEF...` |
| `VITE_TELEGRAM_BOT_USERNAME` | Telegram Bot Username | `@YourBotName` |
| `VITE_FIREFLY_TOKEN` | Firefly III API Token | `eyJ0eXAiOiJKV1...` |
| `VITE_SYNC_API_KEY` | Sync API Key | `your_sync_api_key` |

#### Important Notes

- **`BACKEND_URL`**: This is the URL of your backend server that the Cloudflare Pages Function will proxy to
  - For Tailscale networks: Use your Tailscale domain (e.g., `https://dev.neon-chuckwalla.ts.net`)
  - For public APIs: Use the public URL
  - **Critical**: Cloudflare Pages Functions run on Cloudflare's edge network and may not be able to directly access private Tailscale networks. See solutions below.

- **`VITE_*` variables**: These are build-time variables that get embedded in the client-side code
  - They are accessible in the browser
  - Do NOT put sensitive secrets here that you don't want exposed

### 3. Handling Private Networks (Tailscale)

If your backend is on a private network (like Tailscale), you have several options:

#### Option A: Cloudflare Tunnel (Recommended)
1. Install `cloudflared` on your backend server
2. Create a tunnel: `cloudflared tunnel create budgetbot-backend`
3. Configure tunnel to route to your backend
4. Set `BACKEND_URL` to the Cloudflare Tunnel URL

See: [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

#### Option B: Public Reverse Proxy
1. Set up a public-facing reverse proxy (nginx, Caddy, etc.)
2. Configure it to proxy to your Tailscale backend
3. Secure with authentication and rate limiting
4. Set `BACKEND_URL` to your public proxy URL

#### Option C: Tailscale Funnel (Experimental)
1. Use Tailscale Funnel to expose your service publicly
2. Run: `tailscale funnel 8001`
3. Set `BACKEND_URL` to the funnel URL

See: [Tailscale Funnel Documentation](https://tailscale.com/kb/1223/tailscale-funnel/)

#### Option D: Deploy with Docker/Nginx (Alternative)
If Cloudflare Pages doesn't work with your private network, use the Docker deployment:
```bash
docker build -t budgetbot-tg-mini-app .
docker run -p 3000:3000 -d budgetbot-tg-mini-app
```

### 4. Verify Deployment

After deployment, test your app:

1. Open your Cloudflare Pages URL
2. Navigate to the **Debug** screen (button on home page)
3. Check service status:
   - ✅ **Telegram Bot**: Should be CONNECTED
   - ✅ **Sync API**: Should be CONNECTED
   - ✅ **Firefly API**: Should be CONNECTED

If services show DISCONNECTED:
1. Check Cloudflare Pages Functions logs
2. Verify `BACKEND_URL` is correct and accessible from Cloudflare's network
3. Ensure API tokens are valid

### 5. View Logs

To debug issues:

```bash
# View Pages Functions logs
wrangler pages deployment tail

# View specific deployment logs
wrangler pages deployment tail --project-name=budgetbot-tg-mini-app
```

Or in Cloudflare Dashboard:
**Workers & Pages** → **Your Project** → **Deployments** → **View details** → **Functions**

## How It Works

### Development (Local)
```typescript
// vite.config.ts proxies /api/* to Workers URL
proxy: {
  '/api/v1': { target: 'https://budgetbot-tg-mini-app.kayukov2010.workers.dev' },
  '/api/sync': { target: 'https://budgetbot-tg-mini-app.kayukov2010.workers.dev' }
}
```

### Production (Cloudflare Pages)
```typescript
// functions/_middleware.ts intercepts /api/* and proxies to BACKEND_URL
export const onRequest = async (context) => {
  if (url.pathname.startsWith('/api/')) {
    // Proxy to env.BACKEND_URL
    const targetUrl = `${env.BACKEND_URL}${url.pathname}`;
    return fetch(targetUrl, { ... });
  }
  return context.next();
};
```

### Service Layer
```typescript
// src/services/firefly.ts & sync.ts use relative URLs
constructor() {
  this.baseUrl = ''; // Empty string uses current origin
  // Browser requests go to: https://your-app.pages.dev/api/v1/...
  // Middleware proxies to: https://dev.neon-chuckwalla.ts.net/api/v1/...
}
```

## Troubleshooting

### Issue: "Backend URL not configured"
**Solution**: Set `BACKEND_URL` environment variable in Cloudflare Pages settings

### Issue: "Load failed" for Sync/Firefly APIs
**Solutions**:
1. Verify `BACKEND_URL` is accessible from Cloudflare's network
2. Check API tokens are correct
3. Review Cloudflare Pages Functions logs
4. Ensure backend has no IP restrictions blocking Cloudflare

### Issue: CORS errors still appearing
**Solutions**:
1. Verify `/api/*` requests are going through the proxy (check Network tab in DevTools)
2. Ensure `functions/_middleware.ts` is deployed (check deployment logs)
3. Clear browser cache and hard reload

### Issue: Cannot access Tailscale network from Cloudflare
**Solution**: Use one of the private network solutions above (Cloudflare Tunnel recommended)

## Security Considerations

1. **API Tokens**: Set both in environment variables:
   - `VITE_*`: Client-side (visible in browser)
   - Server-side tokens can be added to `functions/_middleware.ts` for enhanced security

2. **Rate Limiting**: Consider adding rate limiting to your backend or Cloudflare Workers

3. **Authentication**: Ensure your backend validates API tokens properly

4. **HTTPS**: All communication should use HTTPS (enforced by Cloudflare)

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Tailscale Documentation](https://tailscale.com/kb/)
