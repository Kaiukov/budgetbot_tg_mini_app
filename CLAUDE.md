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
- **State Management:** XState `^5.24.0` with `@xstate/react ^6.0.0`
- **Linting:** `npm run lint`
- **Type-Checking:** `npx tsc --noEmit`

This document provides a high-level overview of the "Budget Mini App" project, a Telegram Mini App for personal finance management.

## XState Architecture

The application uses **XState v5** for centralized state management with hierarchical finite state machines and actor-based side effects orchestration.

### State Machine Structure
**File:** `src/machines/budgetMachine.ts`

**States:**
- **`loading`** - Initial state where Telegram user is initialized via `telegramInitActor`
- **`ready`** - Main application state with 3 parallel auto-invoking actors:
  - `fetchAccounts` → Loads user accounts (30s timeout)
  - `fetchCategories` → Loads transaction categories (30s timeout)
  - `fetchTransactions` → Loads transaction history (30s timeout)

**Substates (within `ready`):**
- **`home`** - Default screen with navigation options
- **`expenseFlow`** - Hierarchical flow: accounts → amount → category → comment → confirm
- **`incomeFlow`** - Similar to expense flow
- **`transferFlow`** - Transfer-specific flow: sourceAccounts → destAccounts → amount → fees → confirm
- **`transactions`** - Transaction list screen
- **`debug`** - Debug screen for service health monitoring

### Actor System
**File:** `src/machines/actors.ts`

**Core Actors (auto-invoked):**
1. **`telegramInitActor`** - Initializes user from Telegram SDK with 5s timeout fallback to browser mode
2. **`accountsFetchActor`** - Fetches accounts from Sync API (30s timeout)
3. **`categoriesFetchActor`** - Fetches categories from Sync API (30s timeout)
4. **`transactionsFetchActor`** - Fetches transactions from Firefly API (30s timeout)

**CRUD Actors (on-demand):**
- `transactionCreateActor` - Create expense/income/transfer
- `transactionEditActor` - Edit transaction
- `transactionDeleteActor` - Delete transaction
- `transactionDetailFetchActor` - Fetch single transaction details

**Health Check Actors:**
- `syncServiceHealthActor` - Monitor Sync API health
- `fireflyServiceHealthActor` - Monitor Firefly API health

### Context & State Persistence
**File:** `src/context/BudgetMachineContext.tsx`

**Features:**
- **React Context Provider** - `BudgetMachineProvider` wraps entire app at `src/main.tsx`
- **localStorage Persistence** - Selective serialization excludes sensitive form data (amounts, comments)
- **State Logging** - Development mode only, logs all state transitions with previous/current state
- **Error Boundaries** - Actor failures trigger `onError` handlers with graceful fallback UI

**Context Structure:**
```typescript
BudgetMachineContext {
  user: BudgetUser;
  transaction: TransactionForm;      // Expense/income entry state
  transfer: TransferForm;             // Transfer entry state
  data: {
    accounts: AccountUsage[];
    categories: CategoryUsage[];
    transactions: DisplayTransaction[];
  };
  ui: {
    accounts: ResourceLoadingState;
    categories: ResourceLoadingState;
    transactions: ResourceLoadingState;
    services: ServiceHealthStatus;    // API health monitoring
  };
  selectedTransaction: SelectedTransactionState;
}
```

### Event System
**File:** `src/machines/types.ts`

Events are typed using discriminated unions for type safety:
- **Navigation** - `NAVIGATE_EXPENSE_ACCOUNTS`, `NAVIGATE_BACK`, `NAVIGATE_HOME`
- **Forms** - `UPDATE_ACCOUNT`, `UPDATE_AMOUNT`, `UPDATE_COMMENT`, `SUBMIT_TRANSACTION`
- **Transfers** - `SET_TRANSFER_SOURCE`, `SET_TRANSFER_DEST`, `UPDATE_TRANSFER_FEE`
- **Data** - `FETCH_ACCOUNTS`, `FETCH_TRANSACTIONS`, `FETCH_ERROR`
- **Services** - `SET_SERVICE_STATUS` (for health monitoring)

### Key Features

**Automatic Data Fetching:**
- When app enters `ready` state, 3 actors immediately invoke
- All data fetch actors timeout after 30 seconds to prevent UI freeze
- Success/error handlers update UI state automatically

**State Persistence:**
- Machine state synced to localStorage on every state transition
- On page reload, previous state is restored automatically
- Sensitive form data (amounts, comments) excluded from persistence
- Development mode logs all transitions to browser console

**Error Recovery:**
- Each fetch actor has timeout protection
- `onError` handlers gracefully update UI with error messages
- App remains functional even if individual data fetches fail
- Service health status tracked for debugging

**Form Validation:**
- State machine guards validate transitions before state changes
- Invalid data prevents progression to next screen
- Clear type definitions prevent type-related bugs

### Barrel Export
**File:** `src/machines/index.ts`

Central export point for all machine assets:
```typescript
export { budgetMachine } from './budgetMachine';
export type { BudgetUser, TransactionForm, ... } from './types';
export { actions, guards, logActions } from './actions';
export {
  telegramInitActor,
  accountsFetchActor,
  categoriesFetchActor,
  transactionsFetchActor,
  // ... all 10 actors
} from './actors';
```

Enables clean imports throughout components:
```typescript
import { budgetMachine, useBudgetMachine } from '../machines';
```

### Integration Points

**Components:**
- `src/BudgetMiniApp.tsx` - Uses `useBudgetMachineContext()` hook for state/actions
- All screens receive machine state and dispatcher via context

**Hooks:**
- `src/hooks/useBudgetMachine.ts` - Creates actor and wires all actions/guards
- `useBudgetMachineContext()` - Access machine state in any component

**Development:**
- **Debug Screen** - Shows real-time machine state, service health
- **Console Logging** - State transitions logged in dev mode
- **localStorage** - Persist state for debugging across page reloads

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

- **[API.md](API.md)**: Detailed documentation for the backend Sync Service API, outlining all available endpoints. Always check if new updats exist: https://raw.githubusercontent.com/Kaiukov/firefly/refs/heads/main/sync/API.md
- **[Dockerfile](Dockerfile)**: Defines the steps to build a production-ready Docker image for the application using Nginx.
- **[nginx.conf](nginx.conf)**: Nginx configuration for serving the static frontend files and proxying API requests to the backend services in a production environment.
- **[wrangler.toml](wrangler.toml)**: Configuration for deploying the application to Cloudflare Pages.

## Documentation & Project Management

- **[CHANGELOG.md](CHANGELOG.md)**: A log of all notable changes to the project, organized by version.
- **[.gitignore](.gitignore)**: Specifies which files and directories to exclude from version control.
- **[.env.example](.env.example)**: An example file detailing the environment variables required to run the application.
- **[.claude/](.claude/)**: Contains local settings for the Claude AI assistant.
