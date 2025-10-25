# Budget Mini App

A Telegram Mini App for managing personal finances integrated with Firefly III.

## Features

- ✅ Real Telegram user profile integration
- ✅ User name and photo from Telegram
- ✅ Expense tracking with categories
- ✅ Multi-account support
- ✅ Dark mode UI optimized for Telegram
- ✅ Responsive mobile-first design

## Prerequisites

- Node.js 18+
- Telegram Bot (created via @BotFather)
- Firefly III instance
- Sync service running

## Setup

### 1. Create Telegram Bot

```bash
# Message @BotFather on Telegram
/newbot

# Set bot name and username
# Copy the bot token
```

### 2. Configure Environment

```bash
cp .env.example .env.local

# Edit .env.local with your bot token
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Access at: http://localhost:3000

### 5. Configure Mini App in Telegram

1. Message @BotFather
2. Use `/setmenubutton` command
3. Select your bot
4. Enter button name: "Budget Manager"
5. Enter Web App URL: `http://localhost:3000` (development) or your production URL

## Telegram WebApp Integration

This app uses the official Telegram WebApp API to:

- Get user profile data (name, photo)
- Match Telegram's color scheme
- Use Telegram's haptic feedback
- Integrate with bot's main button
- Handle back button navigation

### Available User Data

```typescript
user.id           // Telegram user ID
user.first_name   // First name
user.last_name    // Last name (optional)
user.username     // Username (optional)
user.photo_url    // Profile photo URL (optional)
```

## Project Structure

```
mini_app/
├── src/
│   ├── hooks/
│   │   └── useTelegramUser.ts    # Telegram user data hook
│   ├── services/
│   │   └── telegram.ts           # Telegram WebApp service
│   ├── types/
│   │   └── telegram.d.ts         # TypeScript definitions
│   ├── BudgetMiniApp.tsx         # Main component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Tailwind styles
├── index.html                     # HTML with Telegram SDK
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Building for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Docker Deployment

```bash
# Build and run with Docker Compose
docker compose up -d mini-app
```

App will be available at: http://your-server:3000

## Testing

### Browser Testing

Visit http://localhost:3000 directly to test UI without Telegram integration.

### Telegram Testing

1. Open your bot in Telegram
2. Click the menu button
3. Select "Budget Manager"
4. Mini App opens with your real Telegram profile

## API Integration

The app connects to:

- **Sync Service** (`http://sync-service:8001`) - Cached data and sync operations
- **Firefly III** (`http://firefly-app:8080`) - Financial data backend

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_TELEGRAM_BOT_TOKEN` | Your Telegram bot token | `123456:ABC-DEF...` |
| `VITE_TELEGRAM_BOT_USERNAME` | Your bot username | `mybudgetbot` |
| `VITE_API_BASE_URL` | Sync service URL | `http://sync-service:8001` |
| `VITE_FIREFLY_BASE_URL` | Firefly III URL | `http://firefly-app:8080` |

## Troubleshooting

### User data not showing

- Check browser console for Telegram WebApp availability
- Ensure you're opening the app from Telegram (not direct browser)
- Verify bot token is correct

### API connection fails

- Check that sync-service is running
- Verify Docker network connectivity
- Check environment variables

## Deployment

- **Production**: https://budgetbot-tg-mini-app.kayukov2010.workers.dev/
- **Development**: Local proxy to backend services

### Development Proxy Configuration

In development, Vite proxies API requests to avoid CORS issues:

```typescript
// vite.config.ts
proxy: {
  // Firefly III API - proxy to Tailscale backend
  '/api/v1': {
    target: 'https://dev.neon-chuckwalla.ts.net',
    changeOrigin: true,
    secure: true,
    ws: true
  },
  // Sync API - proxy to Cloudflare Workers
  '/api/sync': {
    target: 'https://budgetbot-tg-mini-app.kayukov2010.workers.dev',
    changeOrigin: true,
    secure: true,
    ws: true
  }
}
```

## License

MIT