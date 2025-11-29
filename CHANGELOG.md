# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Remote logging pipeline: client logs/errors and startup events are forwarded to configurable `VITE_LOG_ENDPOINT` (defaults to `/log`) with Telegram `initData` attached.
- **XState FSM Implementation**: Complete state machine for expense flow
  - Created `src/machines/expenseFlowMachine.ts` with 9 states (home → accounts → amount → categories → comment → confirmation → submitting → success/error)
  - Type-safe event system with full TypeScript support
  - Context-based data accumulation matching "legal dossier" workflow
  - Guards for validation at each step (isAccountValid, isAmountValid, etc.)
  - Conditional back-button logic (account change clears amount, category change clears comment)
  - Pre-loading effects for caches (accounts, categories, destinations)
  - FSM invoke for blocking operations (transaction submission)
- **XState Dependencies**: Added `xstate@^4.38.0` and `@xstate/react@^3.2.0`
- **Updated Hook**: Refactored `useExpenseFlow` to use `useMachine()`
  - Direct access to FSM state and send function
  - Selectors for accounts, categories, destinations
  - Validation helpers (canProceedFromX)
  - Pre-loading effects for API calls
- **`useExpenseFlow` Hook**: Consolidated expense flow state management hook
  - Wraps all Zustand expense state into a single, memoized hook
  - Provides unified interface for expense transaction data and handlers
  - Reduces BudgetMiniApp component complexity by 14 Zustand selectors
- **Expense Flow - Accounts Page** ✅ IMPLEMENTED
  - Complete multi-step transaction flow architecture (Home → Accounts → Amount → Categories → Destination → Confirmation)
  - Accounts page fully functional with account selection, loading, error handling
  - Smart account sorting: most-used accounts first, unused accounts at bottom
  - Back button logic with state preservation and cache management
  - Pre-loading of categories on Accounts page for optimized UX
  - Account deduplication: removes duplicates from API, keeps highest usage_count
  - Full Telegram Mini App integration (back button, dark theme, haptic feedback)
- **Expense Flow Documentation** ✅ ADDED
  - Comprehensive guide in `telegram-mini-apps-skill/references/expense-flow.md`
  - Complete flow overview with state shapes and API calls
  - Back button logic matrix for all steps
  - Reference implementation for future steps

### Changed
- **State Management Refactoring**: Extracted expense flow state from BudgetMiniApp.tsx into dedicated hook
  - Created `src/hooks/useExpenseFlow.ts` for centralized expense flow logic
  - Consolidated 14 individual Zustand selectors into single hook call
  - Removed inline `expenseFlowApi` wrapper pattern from component
  - Improved code organization and maintainability
- **BudgetMiniApp Entry Point**: Wired expense flow navigation
  - Step-based conditional rendering (home vs expense-accounts)
  - Automatic account and category pre-loading on Accounts page
  - userName passed correctly to API calls (fixes `/get_accounts_usage?user_name=Kaiukov`)
  - HomeScreen Expense button triggers `startExpenseFlow()`
- **Type System**: Enhanced ExpenseFlowErrors type
  - Fields can now be `Record<string, string | undefined>` for proper error clearing
- Account usage now reads from the new `/api/v1/get_account_usage` endpoint with legacy fallback, normalizing singular/plural payloads and new fields (`global_usage`, `user_has_used`).
- Accounts screen shows the per-user usage status with an "Unused" pill, and the subtitle now only contains your usage + balance (removed the "All users X" community metric).
- Category usage requests now forward the transaction type (`withdrawal`/`deposit`) to `/api/v1/get_categories_usage`, caching results per user + type and respecting new response fields.
- Category screen mirrors accounts UI with an "Unused" badge and clearer "Not used yet" text when a user hasn't touched a category.
- Destination suggestions now call `/api/v1/get_destination_name_usage` with `user_name` + `category_id` from `get_categories_usage`, normalize `total_sync`, and surface unused placeholders consistently.
- **Category ID Synchronization**: Enhanced category selection logic to handle dual ID fields (`category_id` and `category_id1`)
  - Added `useEffect` hook to keep `selectedCategoryId` in sync with `transactionData.category`
  - Category selection now checks both `category_id` and `category_id1` fields with fallback logic
  - Ensures proper destination filtering when categories have multiple ID representations
- Expense/Income flows restructured with distinct state per flow, cached accounts/categories, and Telegram back-button routes aligned to the new screens.
- Confirmation screens are placeholders only (no Firefly submit) to focus on flow wiring; state snapshotting preserves account/amount/category/comment when navigating back and forth.
- Income comment suggestions now use `/get_source_name_usage?user_name=Kaiukov&category_id=<id>` and show only source names.

### Fixed
- **Category Selection Flow**: Fixed issue where destination suggestions were filtered by wrong category ID
  - Category selection now properly derives ID from either `category_id` or `category_id1` field
  - Unused categories now correctly include `category_id1` mapping for comprehensive filtering
  - Type definitions updated to make `category_id1` optional and `created_at`/`updated_at` nullable
- **API Query Parameters**: Fixed missing `user_name` parameter in account fetch
  - Accounts now properly filtered by user via `/get_accounts_usage?user_name=Kaiukov`
  - useEffect timing ensures userName is set in state before API call
  - Resolves duplicate accounts issue through deduplication logic
- **Accounts Page Optimization**: Pre-load categories on Accounts page
  - Categories now fetched concurrently with accounts for faster Amount step load
  - Reduces loading time when advancing from Accounts to Amount page

## [1.2.7] - 2025-11-25

### Added
- **Transaction CRUD Operations**: Complete transaction management via Sync API
  - `deleteTransaction()` - Delete transactions with Tier 2 authentication
  - `updateTransaction()` - Update transactions with full payload support
  - `fetchTransactions()` - Paginated transaction retrieval with display mapping
  - `fetchTransactionById()` - Single transaction lookup with data transformation
- **Transaction Mapping Utility**: `mapTransactionToDisplay()` helper in transaction-utils
  - Converts API `TransactionRead` format to frontend `DisplayTransaction` format
  - Handles income, expense, and transfer type detection
  - Supports foreign currency amounts and multi-currency transactions
  - Extracts journal IDs, usernames, and transaction metadata

### Changed
- **Complete Firefly API Migration**: Removed entire legacy Firefly service layer (~1,600 lines)
  - Deleted `src/services/firefly/` directory and all modules
  - All transaction operations now route through Sync API (`/api/v1/transactions`)
  - UI components migrated: HomeScreen, TransactionList, TransactionDetail, TransactionEdit
  - Cache utilities updated to use `syncService.fetchTransactions()`
- **Sync Service Expansion**: Enhanced type definitions and response structures
  - Added `ServiceTransactionsResponse` and `ServiceSingleTransactionResponse` types
  - Added `TransactionsResponse`, `TransactionRead`, and `TransactionMeta` types
  - Added `TransactionLink` for pagination navigation
  - Enhanced `TelegramUserData` with complete user profile structure
- **Transaction Endpoints Updated**: All API calls now use `/api/v1/*` standard paths
  - Transaction creation: `/api/sync/transactions` → `/api/v1/transactions`
  - Transaction operations now consistently use Sync API v1 namespace
- **Code Formatting**: Standardized indentation and whitespace across modified components
  - BudgetMiniApp.tsx: Consistent 2-space indentation for service status objects
  - Improved code readability and maintainability

### Fixed
- **Account Usage 403 Error**: Resolved authentication and CORS issues preventing account data retrieval
  - Fixed environment detection to properly use Vite proxy in development (localhost/Tailscale)
  - Production mode now uses `VITE_BASE_URL` from environment configuration
  - Development mode always uses empty baseUrl to force Vite proxy routing
  - Added hostname to debug logging for better troubleshooting
- **Authentication Tier Issue**: GET requests now properly authenticate as Tier 2 users
  - `X-Telegram-Init-Data` header now sent for ALL requests (GET and POST)
  - Previously only POST requests included Telegram authentication
  - Fixes "Read-only access - write operations require Telegram authorization" error
  - Enables proper authenticated user context for all Sync API calls
- **Telegram User Profile Endpoint**: Corrected API endpoint and request structure
  - Updated endpoint: `/api/sync/tgUser` → `/api/v1/tgUser`
  - Fixed request body structure to include `{ initData }` field
  - Avatar URL now properly synced from backend response
  - Hook now uses `syncService.getTelegramUser()` instead of legacy utility

### Removed
- **Firefly API Service Layer**: Complete removal of legacy Firefly III direct integration
  - `src/services/firefly/firefly.ts` (302 lines) - Base Firefly API client
  - `src/services/firefly/transactions.ts` (648 lines) - Transaction operations
  - `src/services/firefly/transactionsFetch.ts` (217 lines) - Transaction fetching
  - `src/services/firefly/types.ts` (135 lines) - Firefly type definitions
  - `src/services/firefly/utils.ts` (259 lines) - Firefly utilities
  - `src/services/firefly/index.ts` (39 lines) - Service exports
  - `src/services/firefly/CLAUDE.md` (9 lines) - Documentation
- **Firefly Service Connection Check**: Removed Firefly API health check from BudgetMiniApp
  - App now exclusively uses Sync API for all backend operations
  - Service status monitoring simplified to Telegram + Sync API only

### Technical Improvements
- **Architecture Consolidation**: Single source of truth for all backend operations (Sync API)
- **Type Safety**: Enhanced TypeScript types for transaction responses and pagination
- **Authentication Flow**: Consistent Tier 2 authentication across all API operations
- **Code Quality**: Reduced codebase by ~1,600 lines through legacy code removal
- **API Consistency**: All endpoints now follow `/api/v1/*` standard namespace
- `SyncServiceCore` environment detection properly handles all deployment scenarios
- CORS handling improved through consistent Vite proxy usage in development
- Authentication tier properly maintained (Tier 2) for Telegram Mini App users
- Debug logging enhanced with hostname information for environment diagnosis

## [1.2.6] - 2025-11-14

### Added
- **Sync Service Transactions**: Dedicated `SyncServiceTransactions` module with transaction utilities, verification helpers, and Claude skill references for Telegram mini app workflows.

### Changed
- **Transaction Flows**: Confirm screens now call `syncService.addTransaction` with unified Sync API types and helpers (budget extraction, transaction utils).
- **Sync Core**: Tier 2 POST requests now send `X-Telegram-Init-Data` header while keeping GET payloads clean; POST bodies exclude redundant `initData`.
- **Dev Proxy**: `vite.config.ts` dev proxy allows self-signed certs and surfaces proxy errors to bypass PNA restrictions.
- **Docs**: `CLAUDE.md` trimmed obsolete API instructions in favor of centralized Sync API references.

## [1.2.5] - 2025-11-13

### Fixed
- **Telegram User Profile**: Display full Telegram name and user bio on home page
- **Auth Headers**: Fixed `/api/sync/tgUser` endpoint to use Tier 2 authentication
  - Replace `Authorization: Bearer` with `X-Anonymous-Key` header
  - Add `X-Telegram-Init-Data` for Telegram signature validation
  - Proper multi-tier auth implementation for frontend clients

### Changed
- **Bio Display**: Removed hardcoded "Manage finances" fallback text
- **User Data**: Show actual Telegram bio instead of placeholder text
- **Authentication**: Implement Tier 2 (Authorized Telegram User) for profile endpoint

### Technical Improvements
- fetchUserData.ts now uses correct authentication tier headers
- useTelegramUser hook updated to remove default bio fallback
- HomeScreen bio display logic improved to show actual user data

## [1.2.4] - 2025-11-10

### Changed
- **Deployment Config**: Configure Vite base path for reverse proxy deployment at `/app/`

### Technical Improvements
- Vite config updated to support nginx reverse proxy routing
- App accessible via https://dev.neon-chuckwalla.ts.net/app/

## [1.2.3] - 2025-11-03

### Added
- **Balance Caching**: 5-minute cache for current balance API calls to reduce backend load
- **Proactive Cache Refresh**: Automatic transaction list refresh after deletion
- **API Documentation**: Comprehensive Sync API documentation update with balance endpoint
- **Project Documentation**: CLAUDE.md files across project structure for better navigation

### Changed
- **User Data Sync**: Removed unused avatar_url field from backend sync flow
- **HomeScreen Optimization**: Removed redundant account preloading logic

### Performance
- **API Call Reduction**: Balance data cached for 5 minutes
- **UX Improvement**: Transaction list auto-refreshes after deletions for consistency
- **Data Efficiency**: Streamlined user sync without unnecessary avatar field

### Technical Improvements
- Cache<CurrentBalanceResponse> implementation in sync.ts
- fetchCurrentBalance() method with intelligent caching
- refreshHomeTransactionCache() integration on transaction delete
- Comprehensive API.md with balance endpoint documentation

## [1.2.2] - 2025-11-02

### Changed
- **UI Standardization**: Unified header design pattern across all 14 screens
- **Header Spacing**: Standardized to text-2xl font-bold with pt-8 pb-6 px-4
- **iOS Safe Area**: Fixed UI mixing on AccountsScreen (improved top padding from pt-2 to pt-8)
- **Theme Update**: Added universal header pattern to layouts.ts
- **Back Button Consistency**: Added conditional back buttons to TransactionDetail and TransactionEdit screens

### Fixed
- iOS status bar overlap issue on AccountsScreen
- Inconsistent title font sizes across screens (now all text-2xl/24px)
- Mixed spacing patterns in screen headers

### Removed
- Outdated documentation files (GEMINI.md, PLAN.md)

### Technical Details
- Total top spacing: ~107px on iPhone with notch, ~68px on iPhone SE
- Back buttons only visible in browser mode (!isAvailable)
- All headers now use flex items-center justify-between layout

## [1.2.1] - 2025-10-31

### Added
- **Smart Account Caching**: 60-second cache for account data to reduce API calls
- **Category Preloading**: Automatic category loading 5 seconds after app mount
- **Account Preloading**: Background account loading when on home screen

### Changed
- **Cache Integration**: Both accounts and categories now use the generic Cache<T> utility
- **Preload Strategy**: Lazy loading for categories and accounts to optimize initial load

### Performance
- **Reduced API Calls**: Cache prevents redundant fetches for frequently accessed data
- **Better UX**: Pre-warmed data ready when users navigate to selection screens

### Technical Improvements
- Unified caching strategy across multiple data types
- Configurable TTL for different cache instances

## [1.2.0] - 2025-10-29

### Added
- **Generic Caching Utility**: New `Cache<T>` class with dual-layer storage
  - Memory cache for fast access within session
  - localStorage for persistence across reloads
  - Configurable TTL (time-to-live) per cache instance
  - Generic type support for type-safe caching
- **Transaction Caching**: Dedicated transaction cache with 5-minute TTL
  - `transactionCache.get()` and `transactionCache.set()` methods
  - Automatic expiration and cleanup
  - Memory + localStorage dual-layer implementation

### Changed
- **HomeScreen Optimization**: Integrated transaction caching
  - Check cache before fetching from API
  - Set cache after successful API response
  - Reduced redundant API calls on screen revisit

### Performance
- **Faster Load Times**: Cached transactions load instantly from memory
- **Reduced Backend Load**: API calls only when cache expires
- **Persistent Data**: Transactions persist across page reloads via localStorage

### Technical Improvements
- Type-safe caching with TypeScript generics
- Automatic cache invalidation based on TTL
- Dual-layer storage for optimal performance

## [1.1.0] - 2025-10-28

### Added
- **Multi-Currency Support**: Complete currency handling across all transaction types
  - Foreign currency amount input for expense, income, and transfer flows
  - Exchange rate fetching from Sync API with 1-hour caching
  - Dual currency display (native + foreign) in UI
- **Currency Conversion Cache**: Efficient exchange rate management
  - Memory cache for session-wide rate reuse
  - localStorage persistence across page reloads
  - 1-hour TTL to balance freshness and API efficiency

### Changed
- **Transaction Confirm Screens**: Enhanced all confirm screens with currency data
  - ExpenseConfirmScreen: Foreign currency support added
  - IncomeConfirmScreen: Foreign currency support added
  - TransferConfirmScreen: Foreign currency support added
- **Transaction Submission**: Updated payload structure
  - Added `foreign_amount` and `foreign_currency_code` fields
  - Exchange rate included for backend verification

### Technical Improvements
- `getExchangeRate()` method in SyncService with dual-layer caching
- Normalized exchange rate responses (handles both direct rates and reciprocals)
- Smart cache key generation (`USD:EUR` format)
- Cache expiry logic with automatic cleanup

## [1.0.0] - 2025-10-25

### Added
- **Initial Release**: Budget Mini App for Telegram
- **Transaction Management**: Create and view expenses, income, and transfers
- **Account Selection**: Multi-account support with dynamic account loading
- **Category System**: Hierarchical category selection with emoji support
- **Telegram Integration**: Native Telegram UI components (Main Button, Back Button)
- **Dark Mode**: Telegram-native dark theme with gradient system
- **Service Architecture**: Dual API integration (Firefly III + Sync API)
