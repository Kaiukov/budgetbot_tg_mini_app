# Quick Deployment Guide - Tailscale Funnel Setup

Since your backend is already accessible via **Tailscale Funnel** at `https://dev.neon-chuckwalla.ts.net`, deployment is straightforward!

## 🚀 Deploy in 3 Steps

### Step 1: Build the Project
```bash
npm run build
```

### Step 2: Deploy to Cloudflare Pages
```bash
npx wrangler pages deploy dist --project-name=budgetbot-tg-mini-app
```

Or connect your Git repository in Cloudflare Dashboard:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Workers & Pages** → **Create application** → **Pages**
3. Connect your GitHub repository
4. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`

### Step 3: Configure Environment Variables

In **Cloudflare Dashboard** → **Workers & Pages** → **Your Project** → **Settings** → **Environment Variables**:

```bash
BACKEND_URL=https://dev.neon-chuckwalla.ts.net
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_BOT_USERNAME=your_bot_username_here
VITE_FIREFLY_TOKEN=your_firefly_api_token_here
VITE_SYNC_API_KEY=your_sync_api_key_here
```

**That's it!** Your app will now work from anywhere, including corporate networks.

## ✅ Verify Deployment

1. Open your Cloudflare Pages URL (e.g., `https://budgetbot-tg-mini-app.pages.dev`)
2. Click the **Debug** button on the home screen
3. Check that all services show **CONNECTED**:
   - ✅ Telegram Bot: CONNECTED
   - ✅ Sync API: CONNECTED
   - ✅ Firefly API: CONNECTED

## 🔍 Troubleshooting

### Services show DISCONNECTED?

**Check 1**: Verify `BACKEND_URL` is set correctly
```bash
wrangler pages deployment tail --project-name=budgetbot-tg-mini-app
```
Look for "Backend URL not configured" errors.

**Check 2**: Verify backend is accessible
```bash
curl https://dev.neon-chuckwalla.ts.net/api/v1/about
```
Should return Firefly III version info.

**Check 3**: Verify Tailscale Funnel is running
On your backend server:
```bash
tailscale funnel status
```

**Check 4**: Verify API tokens are correct
- `VITE_FIREFLY_TOKEN` - Should be valid Firefly III token
- `VITE_SYNC_API_KEY` - Should be valid Sync API key

### Still having issues?

View detailed logs:
```bash
# Real-time logs
wrangler pages deployment tail --project-name=budgetbot-tg-mini-app

# Or in Cloudflare Dashboard
# Workers & Pages → Your Project → Deployments → View details → Functions
```

## 🎉 Next Steps

Once deployed and verified:
1. Update your Telegram bot's Web App URL to your Cloudflare Pages URL
2. Test the app from Telegram
3. Test from a corporate network to verify it bypasses restrictions

## 📖 More Information

- Full deployment guide: [CLOUDFLARE_PAGES.md](./CLOUDFLARE_PAGES.md)
- API documentation: [API.md](./API.md)
- Project README: [README.md](./README.md)
