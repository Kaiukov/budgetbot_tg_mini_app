# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
