# Source Code (`src`)

Core React + TypeScript application for Budget Mini App. State managed by XState v5 with 11 async actors.

## Root Files
- **[BudgetMiniApp.tsx](BudgetMiniApp.tsx)** - Router component dispatching screens from machine state
- **[main.tsx](main.tsx)** - App entry point, Telegram SDK init, context provider setup
- **[index.css](index.css)** - Global Tailwind CSS + base styles
- **[vite-env.d.ts](vite-env.d.ts)** - Vite environment variable types

## Directories
- **[components/](components/)** - Screen components + UI elements (see CLAUDE.md in directory)
- **[machines/](machines/)** - XState v5 state machine, 11 actors, types, actions
- **[services/](services/)** - API clients (Sync, Firefly, Telegram)
- **[context/](context/)** - React context provider with localStorage persistence
- **[config/](config/)** - Centralized timeout constants (`actorTimeouts.ts`)
- **[theme/](theme/)** - Tailwind dark mode colors + utilities
- **[types/](types/)** - TypeScript interfaces for all domain models
- **[utils/](utils/)** - Helpers (Cache, currency conversion, validation)
- **[hooks/](hooks/)** - Custom React hooks for state + data fetching
- **[assets/](assets/)** - SVG currency + transaction icons

## Unified Transaction Flows (v0.2.0+)

All flows use shared components:
- **Withdrawal**: Accounts → Amount → Category → Destination (notes) → Confirm (date + notes)
- **Deposit**: Accounts → Amount → Category → Source (name) → Confirm (date + comment)
- **Transfer**: Source → Dest → Amount → Fees → Destination → Confirm (date + comment + breakdown)

**Key Features:**
- Single `AmountScreen`, `ConfirmScreen`, `DestinationSourceNamesScreen` for all flows
- Real-time FX conversion for non-EUR with preview
- Validation: Amount > 0, FX required for non-EUR, notes required at confirmation
- Centralized timeouts: DATA_FETCH (30s), CRUD_OPERATION (15s), HEALTH_CHECK (10s)

## State Machine (`machines/`)

### Core Files
- **[budgetMachine.ts](machines/budgetMachine.ts)** - Nested state machine (ready → flows → screens)
- **[actors.ts](machines/actors.ts)** - 11 async actors with timeout protection
- **[types.ts](machines/types.ts)** - Discriminated union events, context types
- **[actions.ts](machines/actions.ts)** - State update handlers
- **[index.ts](machines/index.ts)** - Barrel export

### 11 Actors with Centralized Timeouts
**From `src/config/actorTimeouts.ts`:**
| Actor | Timeout | Purpose |
|-------|---------|---------|
| `telegramInitActor` | 5s | User init + Telegram SDK |
| `accountsFetchActor` | 30s | Load accounts |
| `categoriesFetchActor` | 30s | Load categories |
| `transactionsFetchActor` | 30s | Load transaction history |
| `transactionCreateActor` | 15s | Create transaction |
| `transactionEditActor` | 15s | Edit transaction |
| `transactionDeleteActor` | 15s | Delete transaction |
| `transactionDetailFetchActor` | 15s | Fetch single transaction |
| `syncServiceHealthActor` | 10s | Health check |
| `fireflyServiceHealthActor` | 10s | Health check |
