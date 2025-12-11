# Budget Mini App - Project Overview

A Telegram Mini App for personal finance management with XState v5 state machines, real-time currency conversion, and Firefly III integration.

**Production:** https://budgetbot-tg-mini-app.kayukov2010.workers.dev/
**Local Dev:** `npm run dev` → http://localhost:3000

## Quick Facts
- **Language:** TypeScript 5
- **Framework:** React 18 + Vite 5
- **State:** XState v5 (11 actors with timeout protection)
- **APIs:** Sync Service + Firefly III
- **Deploy:** Cloudflare Pages
- **Quality:** `npm run lint` + `npx tsc --noEmit`

**Complete reference:** See `~/.claude/skills/telegram-mini-apps-skill/examples/budget-app-overview.md`

## Latest Changes (v0.2.1)

**Dec 11, 2025** - Centralized Actor Timeout Configuration + DRY Documentation Refactoring

- ✅ **Centralized Timeouts:** All 11 actors now use semantic constants from `src/config/actorTimeouts.ts` (single source of truth)
- ✅ **Type-Safe Configuration:** Magic numbers replaced with semantic constants: `TELEGRAM_INIT`, `DATA_FETCH`, `CRUD_OPERATION`, `HEALTH_CHECK`
- ✅ **DRY Documentation:** Documentation refactored across 3 levels (root, skill, internal) to eliminate duplication while maintaining accessibility
- ✅ **Improved Error Handling:** Foundation set for timeout-based retry logic and better error recovery

See [CHANGELOG.md](CHANGELOG.md) for full version history.

## Architecture

### Directory Structure
```
src/
├── components/       # Screen components (withdrawal/deposit/transfer flows)
├── machines/         # XState v5 state machine + 11 actors
├── services/         # API clients (Sync, Firefly, Telegram)
├── context/          # React context for machine + provider
├── config/           # Centralized timeout constants
├── theme/            # Tailwind colors + dark mode
├── utils/            # Helpers (cache, currency, validation)
├── types/            # TypeScript interfaces
├── hooks/            # Custom React hooks
└── assets/           # SVG icons
```

### Key Files
- **`budgetMachine.ts`** - Nested state machine with transaction flows
- **`actors.ts`** - 11 async actors (data fetch, CRUD, health checks)
- **`actorTimeouts.ts`** - Centralized timeout config: TELEGRAM_INIT (5s), DATA_FETCH (30s), CRUD_OPERATION (15s), HEALTH_CHECK (10s)
- **`BudgetMachineContext.tsx`** - Context provider with localStorage persistence
- **`BudgetMiniApp.tsx`** - Router component

## Scripts
```bash
npm run dev          # Start Vite dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Check code quality
npm test             # Run tests
npm run test:ui      # Interactive test UI
wrangler deploy      # Deploy to Cloudflare Pages
```

## Configuration Files
- **`vite.config.ts`** - Dev server with `/api` proxy for local development
- **`wrangler.toml`** - Cloudflare Pages deployment config
- **`tailwind.config.js`** - Tailwind CSS for dark mode + responsive design
- **`tsconfig.json`** - TypeScript configuration
- **`.env.example`** - Required environment variables

## Additional Documentation
See detailed guides in `src/` subdirectories:
- **`src/CLAUDE.md`** - Source structure overview
- **`src/components/CLAUDE.md`** - Component architecture
- **`src/machines/CLAUDE.md`** - State machine details
- **`src/services/CLAUDE.md`** - API integration
- **`src/theme/CLAUDE.md`** - Theme system
- **`src/types/CLAUDE.md`** - Type definitions

## Skill Reference
Complete Telegram Mini Apps guidance in: `~/.claude/skills/telegram-mini-apps-skill/examples/budget-app-overview.md`
