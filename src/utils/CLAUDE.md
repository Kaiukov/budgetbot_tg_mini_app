### CLAUDE.md

accounts.ts - Icon + color helpers for accounts.
    - getAccountIcon "Picks Lucide icon based on currency or name"
    - getAccountColor "Returns accent color per currency/name"

cache.ts - Generic cache with memory + localStorage.
    - Cache "TTL-based cache class with set/get/clear"
    - transactionCache "Shared cache for DisplayTransaction[]"
    - TRANSACTION_CACHE_KEYS "Key constants for cache buckets"
    - clearTransactionCache "Clears transaction caches"

categories.ts - Category emoji/icon helpers.
    - extractEmoji "Pulls emoji from category name"
    - getCategoryNameWithoutEmoji "Strips emoji prefix"
    - getCategoryIcon "Maps name keywords to Lucide icon"
    - getCategoryColor "Assigns color by keyword"
    - suggestedComments "Preset comments list"

currencies.ts - Currency metadata and formatting.
    - CURRENCIES "Record of code → symbol/name"
    - getCurrencySymbol "Returns symbol or defaults"
    - getCurrencyName "Returns human-readable name"
    - formatCurrency "Formats amount with code and locale"
    - isValidCurrency "Validity guard for currency codes"

currency.ts - Currency normalization utilities.
    - normalizeCurrency "Uppercases codes with fallbacks"
    - needsConversion "Detects non-EUR currencies"

fakeInitData.ts - Browser-mode Telegram data helpers.
    - isBrowserMode "Detects browser debug mode"
    - generateFakeInitData "Produces signed-ish initData string"
    - generateFakeInitDataUnsafe "Returns parsed mock initData"
    - getInitData/getInitDataUnsafe "Retrieves stored fake payloads"

fetchUserData.ts - User profile fetcher via Sync API.
    - fetchUserData "Returns name/bio/avatar using initData auth"

fetchUserPhoto.ts - Legacy user photo fetcher.
    - fetchUserData "Fetches basic user info by id"

formatCurrency.ts - Intl-based currency formatter.
    - formatCurrency "Formats amount with code"
    - formatCurrencyWithSymbol "Formats amount with currency symbol"

serviceStatus.ts - Service connectivity state helpers.
    - getInitialServiceStatuses "Initial status objects for sync/firefly"

transactionHelpers.ts - Display formatting for transactions.
    - formatTransactionAmount "Formats main amount with currency"
    - getTransactionIcon "Chooses icon per transaction type"
    - getTransactionLabel "Primary label builder"
    - getTransactionSecondaryLabel "Secondary label builder"
    - formatTransactionDate/formatTransactionTime "Date/time formatters"
    - getDisplayAmount "Derives display amount handling transfers"
    - shouldShowForeignAmount "Determines if FX amount should show"
    - formatForeignAmountComparison "Creates secondary FX string"
    - getTransactionStatus "Returns reconciled/unreconciled label"
    - formatTransactionForDisplay "Normalizes transaction for UI list"

transferNotes.ts - Transfer-specific note builder.
    - buildTransferNotesFromContext "Creates descriptive transfer note text"
