# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Currency utilities module with comprehensive currency symbol and formatting support
- Real-time currency conversion display in AmountScreen with EUR conversion preview
- Exchange rate caching system with 1-hour TTL (memory + localStorage persistence)
- Back navigation button in ConfirmScreen for improved UX
- Dynamic currency symbol display based on account currency throughout UI

### Changed
- AmountScreen now shows currency code alongside amount with responsive input sizing
- ConfirmScreen displays proper currency symbols instead of hardcoded UAH symbol
- AccountsScreen imports formatCurrency from new currencies utility module
- Firefly service base URL configuration now uses VITE_BASE_URL environment variable
- Exchange rate service implements intelligent caching to reduce API calls

### Fixed
- Currency display consistency across all screens using centralized utility functions
- Exchange rate API calls now properly cached to improve performance
- Base URL detection logic simplified to use environment variable with proxy fallback

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
