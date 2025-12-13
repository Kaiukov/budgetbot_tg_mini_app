# State Machines (`machines/`)

XState v5 state machine definitions and actors for centralized application state management.

## Files

- **[budgetMachine.ts](budgetMachine.ts)**: Main hierarchical state machine with nested flows (loading → ready → withdrawal/deposit/transfer/transactions/debug)
- **[actors.ts](actors.ts)**: 11 async actors for data fetching, CRUD operations, and health checks
- **[types.ts](types.ts)**: TypeScript definitions for machine context, events, and state shapes
- **[actions.ts](actions.ts)**: State update actions and side effects (factory-generated + validation guards)
- **[helpers/actionFactory.ts](helpers/actionFactory.ts)** (v0.2.4+): Factory for generating standardized loading/success/error action triplets
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

## Action Factory (v0.2.4+)

Data loading actions use a factory pattern from `helpers/actionFactory.ts`:

### Features
- **Factory Function**: `createResourceActions()` generates standardized action triplets (loading, success, error)
- **Unified Event Handling**: Supports both orchestrator pattern (`event.output.accounts`) and manual events (`event.accounts`)
- **Type Safety**: Generic type support for resource-specific actions
- **Code Reduction**: Eliminates 62 LOC of duplicated action definitions
- **Extensibility**: Adding new resources requires 3 lines instead of 9

### Example Usage
```typescript
const accountActions = createResourceActions<AccountUsage[]>({
  resourceName: 'accounts'
});

export const actions = {
  setAccounts: accountActions.setData,
  setAccountsLoading: accountActions.setLoading,
  setAccountsError: accountActions.setError,
};
```

### Benefits
- **Single Source of Truth**: Base pattern defined once, reused for all resources
- **Consistent Patterns**: Matches v0.2.2 error handling factory design
- **Future-Proof**: Foundation for optional callbacks, validation, retry logic

## Error Handling (v0.2.2+)

All actors use a centralized error handling factory from `errorHandling.ts`:

### Features
- **Structured Error Types**: ErrorCategory enum for classification (TIMEOUT, NETWORK, VALIDATION, AUTH, NOT_FOUND, SERVER_ERROR, UNKNOWN)
- **Error Classification**: Automatic error type detection for better debugging
- **Timeout Wrapper**: Reusable withTimeout() utility for consistent timeout handling
- **Emoji Logging**: Consistent ❌ (error), ✅ (success), 🔄 (loading) logging with debug mode support
- **Graceful Fallbacks**: Optional fallback responses for critical actors (e.g., Telegram init → Guest user)

### Factory Usage
```typescript
export const exampleActor = createActorWithErrorHandling<OutputType, InputType>({
  name: 'exampleActor',
  timeout: ACTOR_TIMEOUTS.CATEGORY,
  operation: async (input) => {
    // Actor logic here
    return result;
  },
  fallback?: (error, input) => {
    // Optional fallback for error cases
  }
});
```

### Error Flow
1. **Execute**: Actor operation runs with timeout protection
2. **Classify**: Errors automatically categorized by type
3. **Log**: Structured error logged with ❌ emoji in debug mode
4. **Handle**: Error re-thrown to XState machine's onError handler
5. **Recover**: Machine updates context, UI displays error message with auto-clear

### Benefits
- **39% Code Reduction**: Eliminated 209 lines of duplicate timeout logic (559 → 340 LOC)
- **Single Source of Truth**: All error handling follows consistent pattern
- **Foundation for Retries**: Error categorization enables future retry logic
