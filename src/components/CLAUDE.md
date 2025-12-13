### CLAUDE.md

HomeScreen.tsx - Dashboard hub with quick actions.
    - HomeScreen "Shows balances and navigates to withdrawal/deposit/transfer/transactions"

AccountsScreen.tsx - Account selector reused across flows.
    - AccountsScreen "Filters accounts, respects excludeAccountId for transfers"

AmountScreen.tsx - Unified amount entry with FX preview.
    - AmountScreen "Handles numeric input, currency display, and conversion preview"

CategoryScreen.tsx - Category picker with type filters.
    - CategoryScreen "Lists categories and returns selection with metadata"

DestinationSourceNamesScreen.tsx - Notes/name input with suggestions.
    - DestinationSourceNamesScreen "Captures destination/source/comment with autocomplete"

ConfirmScreen.tsx - Final review step for all flows.
    - ConfirmScreen "Shows summary, date picker, validation, and submit"

TransferFeeScreen.tsx - Transfer-specific fee entry.
    - TransferFeeScreen "Collects exit/entry fees with normalization and skip"

TransactionsListScreen.tsx - Paginated history view.
    - TransactionsListScreen "Displays transactions and navigates to detail"

TransactionDetailScreen.tsx - Read-only detail page.
    - TransactionDetailScreen "Shows full transaction info with actions"

TransactionEditScreen.tsx - Edit existing transaction.
    - TransactionEditScreen "Updates amount/category/notes/date with validation"

DebugScreen.tsx - Developer debug panel.
    - DebugScreen "Shows machine context and service health statuses"

TransactionCard.tsx - Compact transaction row/card.
    - TransactionCard "Displays type, amount, currency, date, and icon"

BrowserBackButton.tsx - Browser-only navigation helper.
    - BrowserBackButton "Renders back button and ESC listener outside Telegram"

NumberPad.tsx - Lightweight numeric keypad.
    - NumberPad "Provides digit buttons for amount entry"

ErrorBoundary.tsx - React error guard.
    - ErrorBoundary "Catches render errors and renders fallback UI"

icons/CurrencyIcons.tsx - SVG currency icon set.
    - CurrencyHryvnia/CurrencyDollar/CurrencyEuro "Reusable currency symbol components"
