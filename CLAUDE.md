# Budget Mini App - Project Overview

A Telegram Mini App for personal finance management with XState v5 state machines, real-time currency conversion, and Firefly III integration.

**Production:** https://budgetbot-tg-mini-app.kayukov2010.workers.dev/
**Local Dev:** `npm run dev` → http://localhost:3000

**Git Branch:** `chore/fix-issue-34-api-signle-getaway` (15 commits ahead of dev)

## Quick Facts
- **Language:** TypeScript 5
- **Framework:** React 18 + Vite 5
- **State:** XState v5 (11 actors with timeout protection)
- **APIs:** Sync Service + Firefly III
- **Deploy:** Cloudflare Pages
- **Quality:** `npm run lint` + `npx tsc --noEmit`

**Complete reference:** See `~/.claude/skills/telegram-mini-apps-skill/examples/budget-app-overview.md`
**Testing guide:** See `~/.claude/skills/telegram-mini-apps-skill/examples/test-e2e.md`

## Latest Changes (v0.2.3)

**Dec 13, 2025** - Modular Service Architecture + Complete Test Consolidation

- ✅ **Service Refactoring:** Converted 800+ LOC monolithic `sync.ts` to clean facade with 8 domain modules
- ✅ **New Modules:** gateway, auth, cache, exchangeRate, syncAccounts, syncCategories, syncDestinationSourceNames, addTransactions, getTransactions
- ✅ **Transaction CRUD:** Added `updateTransaction()` and `deleteTransaction()` with Tier 2 auth
- ✅ **Exchange Rate Service:** Real FX conversion with 1h caching (memory + localStorage)
- ✅ **Test Consolidation:** Unified E2E tests into `tests/e2e/` (17 tests, 100% pass rate, ~10s)
- ✅ **API Response Fixes:** Fixed exchange rate parsing and P1 issue blocking USD flows

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
- **`errorHandling.ts`** - Centralized error factory (v0.2.2+): `createActorWithErrorHandling()`, `withTimeout()`, error classification
- **`actors.ts`** - 11 async actors using error factory (data fetch, CRUD, health checks)
- **`actorTimeouts.ts`** - Centralized timeout config: TELEGRAM_INIT (5s), DATA_FETCH (30s), CRUD_OPERATION (15s), HEALTH_CHECK (10s)
- **`BudgetMachineContext.tsx`** - Context provider with localStorage persistence
- **`BudgetMiniApp.tsx`** - Router component

## Scripts

### Development
```bash
npm run dev          # Start Vite dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Check code quality
```

### Testing (v0.2.3+)
```bash
npm run test tests/e2e/                          # Run all E2E tests (17 tests, ~10s)
npm run test tests/e2e/withdrawal-mock-flow      # Withdrawal flow only (8 tests)
npm run test tests/e2e/deposit-mock-flow         # Deposit flow only (7 tests)
npm run test tests/e2e/transfer-mock-flow        # Transfer flow only (2 tests)
npx playwright test tests/e2e/ --ui              # Interactive UI mode (watch tests)
npx playwright show-report                       # View HTML test report
```

### Deployment
```bash
wrangler deploy      # Deploy to Cloudflare Pages
```

## Configuration Files
- **`vite.config.ts`** - Dev server with `/api` proxy for local development
- **`wrangler.toml`** - Cloudflare Pages deployment config
- **`tailwind.config.js`** - Tailwind CSS for dark mode + responsive design
- **`tsconfig.json`** - TypeScript configuration
- **`.env.example`** - Required environment variables

## Additional Documentation

### Project Documentation
- **`src/CLAUDE.md`** - Source structure overview
- **`src/components/CLAUDE.md`** - Component architecture
- **`src/machines/CLAUDE.md`** - State machine details
- **`src/services/CLAUDE.md`** - API integration
- **`src/theme/CLAUDE.md`** - Theme system
- **`src/types/CLAUDE.md`** - Type definitions

### Test Documentation
- **`tests/e2e/`** - Playwright E2E test suite (17 tests, 100% passing)
- **`test-results/`** - Test reports and documentation

### Skill References
Complete guidance available in the telegram-mini-apps-skill:
- **`budget-app-overview.md`** - Complete architecture and implementation reference
- **`test-e2e.md`** - Comprehensive E2E testing guide with patterns and examples
