# Configuration Summary

## Development Environment (Vite Dev Server)

**File:** `vite.config.ts`

### Allowed Hosts
- `budgetbot-tg-mini-app.kayukov2010.workers.dev` - Cloudflare Workers domain
- `dev.neon-chuckwalla.ts.net` - Tailscale backend domain
- `oleksandrs-macbook-air.neon-chuckwalla.ts.net` - Local Tailscale domain
- `localhost` - Local development
- `.ts.net` - All Tailscale domains (wildcard)

### Proxy Configuration
All `/api/*` requests are proxied to:
```
https://budgetbot-tg-mini-app.kayukov2010.workers.dev
```

This means:
- `/api/v1/about` → `https://budgetbot-tg-mini-app.kayukov2010.workers.dev/api/v1/about`
- `/api/sync/health` → `https://budgetbot-tg-mini-app.kayukov2010.workers.dev/api/sync/health`

## Production Environment (Cloudflare Pages)

**File:** `functions/_middleware.ts`

### Required Environment Variable
Set in Cloudflare Pages Dashboard → Settings → Environment variables:

```
BACKEND_URL=https://budgetbot-tg-mini-app.kayukov2010.workers.dev
```

### How It Works
1. User accesses: `https://budgetbot-tg-mini-app.pages.dev`
2. Frontend makes request to: `/api/v1/about`
3. Cloudflare Functions middleware intercepts the request
4. Middleware proxies to: `${BACKEND_URL}/api/v1/about`
5. Response is returned with CORS headers added

## Backend API

**URL:** `https://budgetbot-tg-mini-app.kayukov2010.workers.dev`

This is your Cloudflare Workers deployment that:
- Handles Firefly III API requests (`/api/v1/*`)
- Handles Sync API requests (`/api/sync/*`)
- Runs your backend logic

## Alternative Backend (Tailscale)

**URL:** `https://dev.neon-chuckwalla.ts.net`

For development/testing, you can use your Tailscale backend by:
1. Updating `BACKEND_URL` in Cloudflare Pages to: `https://dev.neon-chuckwalla.ts.net`
2. Or running locally with Vite dev server (already configured)

## Testing

### Local Development
```bash
npm run dev
# App runs at http://localhost:3000
# API requests proxied to https://budgetbot-tg-mini-app.kayukov2010.workers.dev
```

### Test APIs
```bash
npm run test:api
# Opens http://localhost:3000/test.html
```

### Production
Visit: `https://budgetbot-tg-mini-app.pages.dev/api/debug`

Should return:
```json
{
  "success": true,
  "environment": {
    "BACKEND_URL": "https://budgetbot-tg-mini-app.kayukov2010.workers.dev"
  }
}
```

## Troubleshooting

### Getting 404 errors?
- Check: Is `BACKEND_URL` set in Cloudflare Pages?
- Visit: `/api/debug` to verify configuration
- See: `CLOUDFLARE_ENV_SETUP.md` for detailed setup

### Getting CORS errors?
- Development: Restart Vite dev server
- Production: Middleware should handle CORS automatically
- Check: Browser DevTools → Network tab for actual error

### Vite dev server rejects host?
- Make sure you're accessing from an allowed host
- Check: `vite.config.ts` → `allowedHosts`
- Add your domain if missing
