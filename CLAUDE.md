# Budget Mini App - Project Overview

A Telegram Mini App for managing personal finances, integrated with Firefly III and a custom backend sync service.

**Production URL:** https://budgetbot-tg-mini-app.kayukov2010.workers.dev/

## Key Features
- ✅ Real-time Telegram user profile integration
- ✅ Expense, income, and transfer tracking
- ✅ Multi-account and multi-currency support
- ✅ Dark mode UI optimized for Telegram

## Tech Stack & Code Quality
- **Framework:** React `^18.3.1`
- **Language:** TypeScript `^5.7.2`
- **Build Tool:** Vite `^5.4.11`
- **Linting:** `npm run lint`
- **Type-Checking:** `npx tsc --noEmit`

This document provides a high-level overview of the "Budget Mini App" project, a Telegram Mini App for personal finance management.

## Testing & Development

### Prerequisites
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration:
# - VITE_SYNC_API_KEY: Backend Sync API key
# - Other API credentials as needed
```

### Development Server
```bash
# Start local development server (runs on http://localhost:5173)
npm run dev

# The app will:
✅ Hot-reload on file changes
✅ Proxy API requests to backend (see vite.config.ts)
✅ Serve with Telegram Mini App SDK
```

### Code Quality Checks

**Type Safety** (TypeScript compilation)
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Fix TypeScript errors
npx tsc --noEmit --pretty false  # verbose output
```

**Linting** (ESLint + code style)
```bash
# Check code style and quality
npm run lint

# Auto-fix fixable issues
npm run lint -- --fix

# Check specific directory
npx eslint src/services/sync/ --ext ts,tsx
```

### Build Testing

**Production Build**
```bash
# Build the project
npm run build

# Output will be in dist/ directory
# Preview production build locally:
npm run preview

# The build includes:
✅ Minified and optimized code
✅ Tree-shaken imports
✅ Optimized bundle size
```

**Before Deploying**
```bash
# Always run these before deployment:
npm run lint          # Check code quality
npx tsc --noEmit     # Verify types
npm run build        # Build for production
npm run preview      # Test production build
```

### Manual Testing in Telegram

**1. Using Web Preview**
```bash
npm run dev
# Open browser to http://localhost:5173
# Browser DevTools will show most functionality
```

**2. Using Telegram Bot Web App**
```
1. Add test bot to Telegram
2. Use web_app parameter in command
3. Mini App opens in Telegram client
4. Can test mobile UI and full integration
```

**3. Key Testing Scenarios**
- [ ] Login with Telegram user
- [ ] View account list and balances
- [ ] Create new transaction (expense/income/transfer)
- [ ] Switch between categories
- [ ] Currency conversion works correctly
- [ ] Dark mode toggles properly
- [ ] API errors handled gracefully
- [ ] Cache works (check Network tab)

### API Testing



**Browser DevTools Network Tab**
```
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action (load accounts, etc.)
4. View request/response
5. Check headers (X-Anonymous-Key, Authorization)
6. Monitor cache hits (console logs)
```

### Debugging

**Console Logging**
- Sync API: 🔄 🔧  💾 ✅ ❌
- Telegram: 👤 📸 📱
- Transactions: 💰 📝
- Errors: 💥

**Browser DevTools**
```bash
# Open DevTools
F12 or Cmd+Option+I (Mac)

# Check:
✅ Console for errors/logs
✅ Network tab for API calls
✅ Application tab for localStorage (caches)
✅ Sources tab for debugging (set breakpoints)
```

**VS Code Debugging**
```json
// Add to .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| **Module not found error** | Run `npm install` and check import paths |
| **API key not configured** | Set VITE_SYNC_API_KEY in .env |
| **Types errors in IDE** | Run `npx tsc --noEmit` to see all errors |
| **Changes not showing** | Check browser cache, hard refresh (Cmd+Shift+R) |
| **Proxy not working** | Check vite.config.ts proxy settings |
| **Build fails** | Run `npm run lint` to find issues first |

### Continuous Integration

**Pre-commit Checks** (before pushing)
```bash
# Run all quality checks
npm run lint        # Linting
npx tsc --noEmit   # Type checking
npm run build       # Build test
```

**Quick Validation Script**
```bash
#!/bin/bash
echo "Running type check..."
npx tsc --noEmit || exit 1
echo "Running linter..."
npm run lint || exit 1
echo "Building..."
npm run build || exit 1
echo "✅ All checks passed!"
```

## Core Components

- **[src/](src/)**: The heart of the application, containing all the React components, hooks, services, and utilities. See the detailed breakdown in `src/CLAUDE.md`. (Check code with `npm run lint` and `npx tsc --noEmit`).
- **[public/](public/)**: Contains static assets that are served directly, such as the `vite.svg` favicon.
- **[functions/](functions/)**: Houses Cloudflare Pages functions. Currently, it includes a pass-through middleware, as API requests are proxied or made directly to the backend.

## Frontend Build & Configuration

- **[index.html](index.html)**: The main entry point for the web application, which loads the React app and the Telegram WebApp SDK.
- **[vite.config.ts](vite.config.ts)**: Configuration for the Vite build tool, including development server settings and API proxy rules.
- **[package.json](package.json)**: Defines project metadata, npm scripts (like `dev`, `build`), and dependencies.
- **[tailwind.config.js](tailwind.config.js)** & **[postcss.config.js](postcss.config.js)**: Configuration files for the Tailwind CSS framework.
- **[tsconfig.json](tsconfig.json)**: The main TypeScript configuration for the project.

## Backend & Deployment

- **[Dockerfile](Dockerfile)**: Defines the steps to build a production-ready Docker image for the application using Nginx.
- **[nginx.conf](nginx.conf)**: Nginx configuration for serving the static frontend files and proxying API requests to the backend services in a production environment.
- **[wrangler.toml](wrangler.toml)**: Configuration for deploying the application to Cloudflare Pages.

## Documentation & Project Management

- **[CHANGELOG.md](CHANGELOG.md)**: A log of all notable changes to the project, organized by version.
- **[.gitignore](.gitignore)**: Specifies which files and directories to exclude from version control.
- **[.env.example](.env.example)**: An example file detailing the environment variables required to run the application.
- **[.claude/](.claude/)**: Contains local settings for the Claude AI assistant.
