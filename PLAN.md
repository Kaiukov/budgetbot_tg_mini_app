# Mini App Sync API Integration Plan

## Overview
Implement comprehensive API integration for the Telegram Mini App to fetch real data from Sync Service and create transactions via Firefly III API directly.

## Implementation Steps

### 1. Environment Configuration
**Files**: `.env.local`, `vite.config.ts`
- Add `VITE_SYNC_API_URL=https://dev.neon-chuckwalla.ts.net/api/sync`
- Add `VITE_SYNC_API_KEY=sk_sync_2f952db378162b9942f3d85929c79d2fb5795b73246b75439983187ce922a99b`
- Add `VITE_FIREFLY_API_URL=https://dev.neon-chuckwalla.ts.net/api/v1`
- Add `VITE_FIREFLY_API_TOKEN` (needs to be provided)
- Ensure Vite exposes all VITE_* variables

### 2. TypeScript Types
**New file**: `src/types/api.ts`
- Define interfaces for all API responses based on API.md:
  - `Account` (id, name, currency_code, current_balance, balance_in_USD, balance_in_EUR, owner)
  - `Category` (category_id, name, notes, active)
  - `Budget` (budget_id, budget_name, currency_code, monthly_amount, spent, budget_remain)
  - `Transaction` (firefly_transaction_id, type, date, amount, description, etc.)
  - API response wrappers (success, message, timestamp, data arrays, total)

### 3. Core API Client
**New file**: `src/services/apiClient.ts`
- Create base HTTP client with:
  - Configurable base URLs (Sync API vs Firefly API)
  - Multi-auth support (Sync token, Firefly token, Telegram initData)
  - Error handling with typed responses
  - Request/response interceptors for logging
  - Retry logic for failed requests (3 retries with exponential backoff)

### 4. Sync API Service Layer
**New file**: `src/services/syncApi.ts`
- Implement GET endpoints using Sync API (read-only cache):
  - `getAccounts(currency_code?: string)` → GET /api/sync/get_accounts
  - `getCategories(active?: boolean)` → GET /api/sync/get_categories
  - `getBudgets(active?: boolean)` → GET /api/sync/get_budget
  - `getTransactions(filters)` → GET /api/sync/get_transactions
- All functions return typed responses with error handling

### 5. Firefly API Service Layer
**New file**: `src/services/fireflyApi.ts`
- Implement transaction creation (write operations):
  - `createTransaction(payload)` → POST to Firefly III API `/api/v1/transactions`
  - Build payload matching Firefly III transaction format (from budgetbot pattern)
  - Support for withdrawals, deposits, transfers
  - Include `external_id` generation (format: `tg-expense-{username}-{unix_time}`)
  - Validation of response structure

### 6. React Hooks for Data Fetching
**New files**: 
- `src/hooks/useAccounts.ts` - Fetch and cache accounts with React Query pattern
- `src/hooks/useCategories.ts` - Fetch and cache categories
- `src/hooks/useBudgets.ts` - Fetch and cache budgets (optional for v1)
- Include loading states, error states, refetch capabilities

### 7. Update Main App Component
**File**: `src/BudgetMiniApp.tsx`
- Replace hardcoded data with hooks:
  - `const { accounts, loading, error } = useAccounts()`
  - `const { categories, loading, error } = useCategories()`
- Add loading screens for data fetching
- Add error handling UI (toast/banner for errors)
- Update AccountsScreen to display real account data
- Update CategoryScreen to display real category data
- Transform API data format to UI format (map colors, icons)

### 8. Transaction Submission Flow
**File**: `src/BudgetMiniApp.tsx` (ConfirmScreen component)
- On "Yes" button click:
  1. Gather Telegram user data (username, user_id from useTelegramUser)
  2. Build Firefly transaction payload:
     - `type: "withdrawal"`
     - `transactions[0].amount: expenseData.amount`
     - `transactions[0].source_name: expenseData.account`
     - `transactions[0].destination_name: "(Optional destination)"`
     - `transactions[0].category_name: expenseData.category`
     - `transactions[0].description: expenseData.comment`
     - `transactions[0].date: new Date().toISOString().split('T')[0]`
     - `apply_rules: true`
  3. Call `createTransaction()` from fireflyApi
  4. Handle response:
     - Success: Show success toast, clear form, return to home
     - Error: Show error message, allow retry
  5. Optional: Trigger sync service refresh after successful creation

### 9. Loading & Error UI Components
**New file**: `src/components/LoadingSpinner.tsx`
- Reusable loading spinner component matching dark theme

**New file**: `src/components/ErrorBanner.tsx`
- Error display component with retry button

**Update**: `src/BudgetMiniApp.tsx`
- Add global error state for API failures
- Add loading overlay during transaction submission
- Update success toast to include transaction ID (if returned)

### 10. Configuration & Constants
**New file**: `src/config/api.ts`
- Export API base URLs from environment variables
- Export API tokens from environment
- Export retry configuration, timeout values
- Validation of required environment variables on app load

## Technical Decisions

### Authentication Strategy
- **Sync API calls**: Use `VITE_SYNC_API_KEY` in `Authorization: Bearer` header
- **Firefly API calls**: Use `VITE_FIREFLY_API_TOKEN` in `Authorization: Bearer` header  
- **Telegram validation**: Optional enhancement - send initData to `/api/sync/tgUser` for validation

### Error Handling
- Network errors: Show retry UI with exponential backoff
- 401/403 errors: Show "Authentication failed" message
- 404 errors: Show "Resource not found"
- 500 errors: Show "Server error, please try again later"
- All errors logged to console with context

### Data Flow
```
User Action → React Hook → API Service → HTTP Client → External API
     ↓            ↓              ↓              ↓            ↓
   UI Update ← State Update ← Response ← JSON Parse ← HTTP Response
```

### Performance Optimizations
- Cache API responses in React state (prevent redundant calls)
- Show cached data immediately while fetching fresh data in background
- Debounce search/filter operations (future enhancement)

## Files to Create (10 new files)
1. `src/types/api.ts` - TypeScript interfaces
2. `src/config/api.ts` - Configuration constants
3. `src/services/apiClient.ts` - Base HTTP client
4. `src/services/syncApi.ts` - Sync API service
5. `src/services/fireflyApi.ts` - Firefly API service
6. `src/hooks/useAccounts.ts` - Accounts data hook
7. `src/hooks/useCategories.ts` - Categories data hook
8. `src/hooks/useBudgets.ts` - Budgets data hook
9. `src/components/LoadingSpinner.tsx` - Loading UI
10. `src/components/ErrorBanner.tsx` - Error UI

## Files to Modify (3 existing files)
1. `src/BudgetMiniApp.tsx` - Replace mock data, add API integration
2. `.env.local` - Add API URLs and tokens
3. `vite.config.ts` - Ensure env vars exposed (if needed)

## Testing Strategy
1. Test data fetching with real Sync API endpoints
2. Test transaction creation with Firefly III API
3. Test error scenarios (network failure, invalid auth)
4. Test loading states and UI responsiveness
5. Verify external_id generation and transaction verification

## Estimated Implementation Time
- **Phase 1** (Types, Config, API Client): ~30 min
- **Phase 2** (Service Layer): ~45 min  
- **Phase 3** (React Hooks): ~30 min
- **Phase 4** (UI Integration): ~60 min
- **Phase 5** (Testing & Polish): ~30 min
- **Total**: ~3 hours

## Dependencies
- No new npm packages required (using native fetch)
- Uses existing React, TypeScript, Tailwind setup
- Leverages existing Telegram service and hooks pattern