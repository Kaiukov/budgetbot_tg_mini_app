# Components (`src/components`)

This directory contains all React components for the Budget Mini App, organized by functional purpose: screens, reusable UI elements, and utilities.

## Component Organization

### Screen Components

Screen components represent full-page views in the application. Each screen is dispatched from the state machine and receives transaction data and event handlers via props.

#### Home Screen
- **[HomeScreen.tsx](HomeScreen.tsx)**: Main home/dashboard screen displaying user balance, quick action tiles (Withdrawal, Deposit, Transfer, Transactions), and account information. Serves as the primary navigation hub for all transaction flows.

#### Withdrawal Flow Screens
- **[AccountsScreen.tsx](AccountsScreen.tsx)**: Displays list of user accounts filtered by transaction type. Used in withdrawal, deposit, and transfer flows. Supports optional `excludeAccountId` prop for transfer destination filtering. Handles account selection with currency and user_name context.
- **[AmountScreen.tsx](AmountScreen.tsx)**: Unified amount input screen for all transaction types. Features real-time currency conversion for non-EUR amounts, FX preview overlay, and dynamic text alignment. Handles both simple (withdrawal/deposit) and complex (transfer) amount flows.
- **[CategoryScreen.tsx](CategoryScreen.tsx)**: Category selection screen with optional type-based filtering (withdrawal, deposit, or all). Displays available categories with icons and metadata. Supports category selection with optional budget context.
- **[DestinationSourceNamesScreen.tsx](DestinationSourceNamesScreen.tsx)**: Unified screen for entering destination/source notes and names across withdrawal, deposit, and transfer flows. Features auto-complete suggestions based on transaction history, input persistence, and error validation.
- **[ConfirmScreen.tsx](ConfirmScreen.tsx)**: Generic confirmation screen for all transaction types (withdrawal, deposit, transfer). Displays transaction summary with amounts, currencies, fees (transfer), date picker, and notes/comment field. Handles form validation and submission with auto-clearing error displays.
- **[TransferFeeScreen.tsx](TransferFeeScreen.tsx)**: Transfer-specific fee input screen. Dual inputs for exit and entry side fees with real-time calculation and optional skip functionality. Includes fee normalization and select-all input behavior.

#### Transactions Management Screens
- **[TransactionsListScreen.tsx](TransactionsListScreen.tsx)**: Paginated transaction history view displaying all user transactions with type indicators, amounts, dates, and category icons. Supports navigation to transaction detail and edit screens.
- **[TransactionDetailScreen.tsx](TransactionDetailScreen.tsx)**: Read-only transaction details view showing full transaction information including source, destination, amounts, categories, and metadata. Provides navigation to edit or delete options.
- **[TransactionEditScreen.tsx](TransactionEditScreen.tsx)**: Form screen for editing existing transactions. Allows modification of amount, category, notes, and date. Includes validation and error handling with submission feedback.

#### Debug & Utility Screens
- **[DebugScreen.tsx](DebugScreen.tsx)**: Development-only screen displaying application state, service health status, and debug information. Shows Sync API and Firefly API health checks with real-time status updates.

### Reusable UI Components

#### Data Display
- **[TransactionCard.tsx](TransactionCard.tsx)**: Compact transaction display component showing type, amount, currency, date, and category icon. Used in transaction lists and summaries. Supports click navigation to detail view.

#### UI Elements
- **[BrowserBackButton.tsx](BrowserBackButton.tsx)**: Browser-only back button fallback (displays when Telegram is not available). Allows navigation back in browser development mode using click or ESC key.
- **[NumberPad.tsx](NumberPad.tsx)**: Numeric input helper component (minimal implementation, primarily used in AmountScreen for number input handling).
- **[ErrorBoundary.tsx](ErrorBoundary.tsx)**: Error boundary component for catching React rendering errors. Displays error UI and prevents app crash.

#### Icons
- **[icons/CurrencyIcons.tsx](icons/CurrencyIcons.tsx)**: SVG icon components for currency symbols (EUR, USD, GBP, etc.) and transaction types (income, withdrawal, transfer). Used throughout app for visual currency/type identification.

## Component Patterns & Conventions

### Screen Component Props Pattern

All screen components follow this pattern:

```typescript
interface ScreenProps {
  // Transaction data from machine context
  transaction: TransactionForm | TransferForm;

  // Event dispatchers from machine
  onNavigate: (event: BudgetMachineEvent) => void;
  onUpdateField: (field: string, value: any) => void;
  onSubmit: (event: BudgetMachineEvent) => void;

  // Optional metadata
  isLoading?: boolean;
  error?: string;
}
```

### State Management

Screens do NOT manage their own state. All state is managed by the XState machine (`budgetMachine.ts`). Screens are pure presentation components that:
1. Display data from machine context
2. Dispatch events to the machine
3. Respond to machine-driven state changes

### Navigation & Back Button

- All screens use conditional Telegram back button (only when `telegramService.isAvailable()`)
- Browser mode displays `BrowserBackButton` for development
- Back navigation is handled by machine guards and state transitions

### Validation & Error Handling

- Form validation happens in machine guards BEFORE state transitions
- Invalid submissions trigger `onError` handlers in the machine
- Error messages auto-clear after 3-5 seconds (controlled by ConfirmScreen component)
- Each screen should display validation errors inline

### Currency & Amount Handling

- Non-EUR amounts require FX conversion (using `syncService.getExchangeRate()`)
- Client-side conversion stored in context as `amount_eur` for API payload
- FX preview shown on AmountScreen before submission
- Currency symbol and code displayed via `CurrencyIcons`

### Transaction Type Handling

All flows support multiple transaction types with unified components:

| Type | Flow | Notes |
|------|------|-------|
| **Withdrawal** | Accounts → Amount → Category → Destination → Confirm → Submit | Default type, uses withdrawal category filter |
| **Deposit** | Accounts → Amount → Category → Destination → Confirm → Submit | Uses "deposit" field naming, different category filter |
| **Transfer** | Source Accounts → Dest Accounts → Amount → Fees → Destination → Confirm → Submit | Dual account selection, fee calculations, currency conversion |

### Component Hierarchy

```
BudgetMiniApp (Router)
├── HomeScreen
├── WithdrawalFlow
│   ├── AccountsScreen (withdrawal type)
│   ├── AmountScreen (withdrawal mode)
│   ├── CategoryScreen (withdrawal filter)
│   ├── DestinationSourceNamesScreen
│   ├── ConfirmScreen (withdrawal type)
│   └── Submit
├── DepositFlow
│   ├── AccountsScreen (deposit type)
│   ├── AmountScreen (deposit mode)
│   ├── CategoryScreen (deposit filter)
│   ├── DestinationSourceNamesScreen
│   ├── ConfirmScreen (deposit type)
│   └── Submit
├── TransferFlow
│   ├── AccountsScreen (source - excludeAccountId=null)
│   ├── AccountsScreen (destination - excludeAccountId=sourceId)
│   ├── AmountScreen (transfer mode)
│   ├── TransferFeeScreen
│   ├── DestinationSourceNamesScreen
│   ├── ConfirmScreen (transfer type)
│   └── Submit
├── TransactionsListScreen
├── TransactionDetailScreen
├── TransactionEditScreen
└── DebugScreen
```

## Shared Dependencies

### Machine Integration
All screens are driven by `budgetMachine.ts` and receive:
- Current transaction context (account, amount, category, etc.)
- Event dispatchers for state machine transitions
- Loading/error states from machine context

### Service Integration
- `syncService`: For category fetching, exchange rates, account data
- `fireflyService`: For transaction operations (create, edit, delete)
- `telegramService`: For Telegram UI controls and user data

### Theme & Styling
- All screens use Tailwind CSS from `src/theme/dark/`
- Responsive design with mobile-first approach
- Safe area padding handled by theme layouts

### Type Definitions
- `TransactionForm`: Standard withdrawal/deposit form type
- `TransferForm`: Transfer-specific form type
- `BudgetMachineEvent`: Discriminated union of all machine events
- See `src/types/transaction.ts` for complete definitions

## Key Implementation Details

### AmountScreen v0.2.0+
- **Unified for all flows**: Single component handles withdrawal, deposit, and transfer amounts
- **FX Conversion**: Real-time exchange rate lookup for non-EUR accounts with preview overlay
- **Dynamic Text Alignment**: Centered placeholder, right-aligned input with currency
- **Overflow Handling**: Scrollable input for large numbers

### ConfirmScreen v0.2.0+
- **Generic for all types**: Single component with conditional rendering by transaction type
- **Field Handling**:
  - Withdrawal: notes + date
  - Deposit: comment + date
  - Transfer: comment + date + fee breakdown
- **Validation**: Auto-clearing error displays, form guards before submission
- **Notes Sync**: Keeps notes synced with fee edits (fixed in v0.2.0)

### DestinationSourceNamesScreen v0.2.0+
- **Unified screen**: Replaces old DestinationNameScreen
- **Context-aware**: Different labels based on transaction type (destination, source, comment)
- **Auto-complete**: Suggestions from transaction history filtering
- **Input Persistence**: Fixed in v0.2.0 with standardized UPDATE_NOTES payload

### AccountsScreen
- **Filtering**: Supports `excludeAccountId` prop for transfer destination filtering
- **Context metadata**: Displays account currency, balance, and user_name
- **Selection handling**: Preserves amount on same-account re-select, clears on account switch

## Testing Strategy

### Component Testing
- Each screen should be tested with machine context mocked
- Test form input handling and validation
- Test error state displays and auto-clearing
- Test navigation events are dispatched correctly

### Integration Testing
- E2E tests in `tests/e2e/withdrawal-flow.spec.ts` cover full flow navigation
- Test all three transaction types (withdrawal, deposit, transfer)
- Verify back button behavior across screens
- Test FX conversion and fee calculations

### Manual Testing Checklist
For each flow:
- [ ] Navigate through all screens without errors
- [ ] Form validation works (empty fields, invalid amounts)
- [ ] Back button returns to previous state with data preserved
- [ ] Numbers and currency display correctly
- [ ] Error messages clear automatically
- [ ] Submit succeeds and returns to home
- [ ] Transaction appears in transaction list immediately after

## Related Documentation

For detailed information on state management and machine events, see:
- **[src/machines/CLAUDE.md](../machines/CLAUDE.md)** - State machine architecture
- **[src/CLAUDE.md](../CLAUDE.md)** - Overall source structure and withdrawal flow

For styling and theme system:
- **[src/theme/CLAUDE.md](../theme/CLAUDE.md)** - Theme configuration and colors

For type definitions:
- **[src/types/CLAUDE.md](../types/CLAUDE.md)** - Type system and interfaces
