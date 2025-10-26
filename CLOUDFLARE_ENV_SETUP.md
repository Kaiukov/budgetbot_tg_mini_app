# Cloudflare Pages Environment Setup

## Problem: Getting 404 errors on API endpoints

If you're seeing errors like:
```
Sync API: DISCONNECTED - Sync API request failed: 404
Firefly API: DISCONNECTED - API request failed: 404
```

This means the Cloudflare Pages Functions middleware cannot proxy requests because the **BACKEND_URL environment variable is not set**.

## Solution: Configure Environment Variables in Cloudflare Pages

### Step 1: Access Cloudflare Pages Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click on your **budgetbot-tg-mini-app** project
4. Go to **Settings** → **Environment variables**

### Step 2: Add Required Environment Variables

Add the following environment variables:

| Variable Name | Value | Required | Description |
|--------------|-------|----------|-------------|
| `BACKEND_URL` | `https://dev.neon-chuckwalla.ts.net` | **YES** | The backend API URL that the middleware will proxy to |
| `FIREFLY_TOKEN` | `your_firefly_api_token` | Optional | Firefly III API token (for server-side auth) |
| `SYNC_API_KEY` | `your_sync_api_key` | Optional | Sync API key (for server-side auth) |

#### Important Notes:

- **BACKEND_URL** is REQUIRED - without it, the proxy middleware cannot work
- The backend URL should be your Cloudflare Workers URL or your Tailscale URL
- **Do NOT** add `VITE_` prefix to these variables (they are server-side only)
- After adding variables, you may need to redeploy

### Step 3: Set Backend URL

Set the backend URL to your API server:

```
BACKEND_URL=https://dev.neon-chuckwalla.ts.net
```

**Note**: This should point to your actual backend API server (e.g., Tailscale Funnel, Cloudflare Workers, or any other backend).

### Step 4: Deploy or Trigger Redeploy

1. **Option A**: Make a new commit and push (automatic deploy)
2. **Option B**: In Cloudflare Pages → Deployments → **Retry deployment**

### Step 5: Verify Configuration

After deploying, visit this URL to check if environment variables are configured:

```
https://budgetbot-tg-mini-app.pages.dev/api/debug
```

You should see:
```json
{
  "success": true,
  "message": "Cloudflare Pages Functions are working",
  "environment": {
    "BACKEND_URL": "https://dev.neon-chuckwalla.ts.net",
    "FIREFLY_TOKEN": "✓ Configured",
    "SYNC_API_KEY": "✓ Configured"
  }
}
```

If you see `"BACKEND_URL": "NOT SET"`, the variable isn't configured correctly.

## Troubleshooting

### Still getting 404 errors?

1. **Check the debug endpoint**: Visit `/api/debug` to see if Functions are working
2. **Check environment variables**: Make sure BACKEND_URL is set in Cloudflare dashboard
3. **Verify backend is accessible**: Test the backend URL directly in your browser
4. **Check deployment logs**: Look for errors in Cloudflare Pages deployment logs

### Getting CORS errors?

The middleware should automatically add CORS headers. If you're still seeing CORS errors:
1. Check that the middleware is running (`/api/debug` returns 200)
2. Verify the backend server is responding
3. Check browser DevTools Network tab for the actual error

### Getting 500 or 502 errors?

This usually means:
1. Backend URL is unreachable
2. Backend server is down
3. Network connectivity issues

Check Cloudflare Pages Functions logs for detailed error messages.

## Architecture Overview

### How the Proxy Works

```
User Browser → Cloudflare Pages Frontend
              ↓ (makes request to /api/*)
              Cloudflare Pages Functions Middleware
              ↓ (proxies to BACKEND_URL)
              Your Backend Server (Cloudflare Workers or Tailscale)
              ↓ (returns response)
              Middleware adds CORS headers
              ↓
              User Browser receives response
```

### Why This Approach?

1. **Solves CORS issues**: All requests appear to come from the same origin
2. **Corporate network bypass**: Traffic goes through Cloudflare's edge network
3. **Security**: API tokens can be set server-side (optional)
4. **Flexibility**: Easy to switch backends by changing one environment variable

## Client-Side vs Server-Side Variables

### Client-Side (VITE_ prefix) - Set in .env file
These are embedded in the frontend bundle:
- `VITE_FIREFLY_TOKEN` - Used by browser to authenticate
- `VITE_SYNC_API_KEY` - Used by browser to authenticate
- `VITE_TELEGRAM_BOT_TOKEN` - Telegram bot configuration

### Server-Side (no VITE_ prefix) - Set in Cloudflare Pages dashboard
These are only available in Cloudflare Functions:
- `BACKEND_URL` - Where to proxy API requests
- `FIREFLY_TOKEN` - Optional server-side token
- `SYNC_API_KEY` - Optional server-side token

## Next Steps

1. ✅ Set BACKEND_URL in Cloudflare Pages environment variables
2. ✅ Redeploy your application
3. ✅ Visit `/api/debug` to verify configuration
4. ✅ Test your app - API calls should now work
5. ✅ If still having issues, check the troubleshooting section above
