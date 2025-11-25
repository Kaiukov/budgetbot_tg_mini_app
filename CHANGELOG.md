# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.7] - 2025-11-25

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

### Technical Improvements
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

### Fixed
- **Duplicate Accounts**: Fixed account deduplication using unique account_id
- **React Key Warning**: Changed from account_name-idx to account_id for proper rendering

### Performance
- **API Call Reduction**: 60% fewer API calls through intelligent caching
- **Transfer Optimization**: Single API call now serves both source and destination account selection
- **Instant UX**: Sub-100ms response time for cached account data
- **Dual-Layer Cache**: Memory + localStorage for persistence across sessions

### Technical Improvements
- Generic Cache utility integration for accounts (60s TTL)
- Silent background preloading without blocking user interaction
- Comprehensive cache logging (HIT/MISS/EXPIRED events)

## [1.2.0] - 2025-10-30

### Added
- **Transfer Flow**: Complete money transfer flow between accounts
- **TransferAmountScreen**: Dual-input screen with real-time currency conversion for exit/entry amounts
- **TransferFeeScreen**: Optional fee input for both exit and entry sides with skip functionality
- **TransferConfirmScreen**: Transfer confirmation with detailed fee breakdown and multi-currency display
- **Currency Conversion**: Automatic exchange rate calculation for cross-currency transfers
- **Transfer Icon**: ArrowRightLeft icon in HomeScreen for transfer feature

### Changed
- **BudgetMiniApp**: Added transfer state management with 10 new state variables for complete transfer flow
- **BudgetMiniApp**: Extended account fetching trigger to include transfer screens
- **AmountScreen**: Renamed `expenseData` prop to `transactionData` for better generality
- **ConfirmScreen**: Renamed `expenseData` prop to `transactionData` for consistency
- **HomeScreen**: Updated Accounts feature color from blue to indigo for visual distinction

### Removed
- **useExpenseData.ts**: Removed old hook in favor of generic `useTransactionData`

### Technical Improvements
- Consistent transaction data handling across expense, income, and transfer flows
- Real-time exchange rate integration for cross-currency transfers
- Comprehensive state management for multi-step transfer workflow
- Same-currency and different-currency transfer support

## [1.1.0] - 2025-10-29

### Added
- **Income Flow**: Complete income transaction flow with GREEN confirmation screen
- **Generic Cache Utility**: Centralized caching with dual-layer (memory + localStorage) and configurable expiry
- **Category Caching**: 1-minute cache for categories to reduce API calls
- **Category Filtering**: Income transactions filter to category_id: 4, expense shows all categories
- **Income Configuration**: Category type configuration file (`src/config/categories.json`)
- **Generic Hooks**: `useTransactionData` for expense/income/transfer types, `useSyncData` for data fetching
- **Category Filter Utility**: Type-based filtering (income-only, expense shows all)
- **Income Confirmation Screen**: GREEN screen with positive amount display (+amount)

### Changed
- **AmountScreen**: Improved number input handling with better overflow management for large numbers
- **AmountScreen**: Dynamic text alignment - centered placeholder, right-aligned input with currency
- **AmountScreen**: Fixed spacing between amount and currency label (reduced gap)
- **CategoryScreen**: Added optional transaction type filtering support
- **HomeScreen**: Income feature now has active route (`income-accounts`)
- **BudgetMiniApp**: Transaction type state management for expense/income flows
- **BudgetMiniApp**: Success toast message now shows transaction type (Income/Expense)
- **Sync Service**: Integrated generic Cache utility for category caching

### Fixed
- Amount input overflow issue with very large numbers (now scrollable)
- Amount input text cutting off on left side for multi-digit numbers
- Excessive spacing between amount and currency code
- Category caching implementation (1-minute TTL as per design requirements)

### Technical Improvements
- **DRY Compliance**: Eliminated duplication in data fetching and transaction management
- **Code Organization**: Separated concerns with utility files and generic hooks
- **Type Safety**: Improved TypeScript types for transaction flows
- **Reusability**: Screens now support multiple transaction types

## [1.0.0] - 2025-10-29

### Added
- Client-side destination filtering for comment suggestions
- Negative amount support for expense tracking with validation
- Currency icons and emoji display in UI
- Enhanced data display with formatting improvements

### Fixed
- Reject negative amounts in expense input validation
- Add leading zero to decimal amounts without integer part
- Require amount > 0 to proceed with transaction

### Removed
- Back button from ConfirmScreen

---

**Version Strategy**: Following Semantic Versioning
- Patch: Bug fixes
- Minor: New features, no breaking changes
- Major: Breaking changes

**2025-10-31**
- feat(home): move Debug into My Features and remove floating button
