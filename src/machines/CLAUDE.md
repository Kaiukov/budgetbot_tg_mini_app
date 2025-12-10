# State Machines (`machines/`)

XState v5 state machine definitions and actors for centralized application state management.

## Files

- **[budgetMachine.ts](budgetMachine.ts)**: Main hierarchical state machine with nested flows (loading → ready → withdrawal/deposit/transfer/transactions/debug)
- **[actors.ts](actors.ts)**: 11 async actors for data fetching, CRUD operations, and health checks
- **[types.ts](types.ts)**: TypeScript definitions for machine context, events, and state shapes
- **[actions.ts](actions.ts)**: State update actions and side effects
- **[index.ts](index.ts)**: Barrel exports

## Actor Timeout Configuration

All actors use centralized config from `src/config/actorTimeouts.ts`:

```typescript
TELEGRAM_INIT: 5000      // 5s - Telegram SDK init
DATA_FETCH: 30000        // 30s - Bulk data loading
CRUD_OPERATION: 15000    // 15s - Transaction mutations
HEALTH_CHECK: 10000      // 10s - API health pings
ORCHESTRATOR: 30000      // 30s - Parallel loading
```

## Actor Categories

**Initialization** (5s): `telegramInitActor`

**Data Fetch** (30s): `accountsFetchActor`, `categoriesFetchActor`, `depositSourceNameFetchActor`, `transactionsFetchActor`

**CRUD** (15s): `transactionDetailFetchActor`, `transactionCreateActor`, `transactionEditActor`, `transactionDeleteActor`

**Health** (10s): `syncServiceHealthActor`, `fireflyServiceHealthActor`

**Orchestration** (30s): `dataLoadingOrchestratorActor`

## State Machine Structure

```
budgetMachine
├── loading (telegramInitActor invoked)
└── ready (dataLoadingOrchestratorActor invoked)
    ├── home
    ├── withdrawalFlow (accounts → amount → category → notes → confirm)
    ├── incomeFlow (accounts → amount → category → comment → confirm)
    ├── transferFlow (sourceAccounts → destAccounts → amount → fees → comment → confirm)
    ├── transactions (list → detail)
    └── debug
```

## Context Structure

```typescript
{
  user: BudgetUser;
  transaction: TransactionForm;  // withdrawal/income state
  transfer: TransferForm;         // transfer state
  data: {
    accounts: AccountUsage[];
    categories: CategoryUsage[];
    transactions: DisplayTransaction[];
  };
  ui: {
    accounts: ResourceLoadingState;
    categories: ResourceLoadingState;
    transactions: ResourceLoadingState;
    services: ServiceHealthStatus;
  };
  selectedTransaction: SelectedTransactionState;
}
```

## Usage

```typescript
import { budgetMachine, useBudgetMachine } from './machines';

// In BudgetMachineContext.tsx
const actor = createActor(budgetMachine, { ... });

// In components
const { context, send } = useBudgetMachineContext();
```

## Key Features

- **Timeout Protection**: All actors have configurable timeout with graceful error handling
- **State Persistence**: Context synced to localStorage (excluding sensitive form data)
- **Auto-Invocation**: Data fetch actors auto-invoke on `ready` state entry
- **Type Safety**: Full TypeScript coverage with discriminated unions for events
- **Error Recovery**: `onError` handlers for all async operations
