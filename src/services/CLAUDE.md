### CLAUDE.md

sync.ts - Facade re-export plus deprecated all-in-one wrapper.
    - syncService "Legacy instance delegating to account/category/destination services"

sync/index.ts - Consolidated exports for Sync + Firefly helpers.
    - addTransaction "Creates withdrawal/deposit/transfer payloads"
    - fetchTransactions "Returns paginated DisplayTransaction list"
    - getExchangeRate "Fetches cached FX rate and converts amount"
    - gateway "Single entry to all sync/firefly calls"

sync/gateway.ts - Thin orchestrator over domain modules.
    - getAccounts "Returns usage-sorted accounts via syncService"
    - getCategories "Loads categories with optional type filter"
    - getDestinationSuggestions "Autocomplete for destination names"
    - getSourceSuggestions "Autocomplete for source names"
    - fetchTransactions "Loads paginated transactions"
    - fetchTransactionById "Retrieves one transaction by id"
    - createTransaction "Delegates addTransaction with type switch"
    - updateTransaction "Updates an existing transaction"
    - deleteTransaction "Deletes a transaction by id"
    - getExchangeRate "Proxy to FX conversion helper"
    - getExchangeRateOnly "FX rate lookup without conversion"
    - checkHealth "Ping Sync API connectivity"
    - needsCurrencyConversion "Boolean helper for FX requirement"

sync/apiClient.ts - HTTP client with Tier-2 auth support.
    - request "Generic fetch wrapper with timeout + auth tier"
    - get "GET convenience wrapper"
    - post "POST JSON helper"
    - put "PUT JSON helper"
    - delete "DELETE helper"
    - isConfigured "Checks base URL and keys exist"

sync/auth.ts - Tier-2 authentication utilities.
    - getTier2Headers "Builds X-Anonymous-Key + X-Telegram-Init-Data headers"
    - isAuthenticated "Confirms required auth inputs are present"
    - getAuthConfig "Returns current key/initData pair"
    - isValidTier2Headers "Validates inbound header set"
    - logAuthState "Debug logger for auth configuration"

sync/cache.ts - Cache factory and FX cache utilities.
    - CacheManager.getExpiry "TTL resolver per cache bucket"
    - CacheManager.createCache "Creates typed cache with TTL + prefix"
    - CacheManager.logCacheConfig "Logs formatted cache durations"
    - exchangeRateCacheManager.get "Reads FX rate from memory/localStorage"
    - exchangeRateCacheManager.set "Stores FX rate with timestamp"
    - exchangeRateCacheManager.clear "Purges FX caches"

sync/exchangeRate.ts - Currency conversion helpers with caching.
    - getExchangeRate "Fetches FX rate and applies amount multiplier"
    - getExchangeRateOnly "Returns raw FX rate"
    - needsConversion "True when currencies differ"
    - clearCache "Clears exchange rate cache manager"

sync/addTransactions.ts - Firefly transaction mutations.
    - addTransaction "Creates withdrawal/deposit/transfer via API"
    - updateTransaction "Mutates an existing transaction"
    - deleteTransaction "Removes a transaction by id"

sync/getTransactions.ts - Firefly transaction fetchers.
    - fetchTransactions "Paginated fetch with filtering support"
    - fetchTransactionById "Fetches a single transaction with details"
    - createTransactionsFetchService "Factory that returns fetch helpers"

sync/syncAccounts.ts - Account usage + balance service with caching.
    - getCurrentBalance "Returns cached USD balance (fallback 0)"
    - getAccountsUsage "Returns usage-sorted accounts per user"
    - clearCaches "Clears account and balance caches"

sync/syncCategories.ts - Category usage service.
    - getCategoriesUsage "Fetches and sorts categories by usage count"
    - clearCache "Clears category cache store"

sync/syncDestinationSourceNames.ts - Destination/source autocomplete.
    - getDestinationNameUsage "Destination suggestions by user/category"
    - getSourceNameUsage "Source suggestions by user/category"
    - clearCache "Clears suggestion caches"

sync/utils.ts - Transaction formatting, IDs, and validation.
    - generateExternalId "Builds webhook-safe id from type + username"
    - removeNullValues "Strips null fields before API calls"
    - parseTransactionDate "Normalizes Date/string to ISO"
    - formatAmount "Normalizes numeric strings for API"
    - extractCategoryName "Pulls category label from composite string"
    - cleanCategoryName "Sanitizes category names"
    - extractBudgetName "Isolates budget name from category text"
    - buildWithdrawalDescription "Creates withdrawal note text"
    - buildDepositDescription "Creates deposit note text"
    - buildTransferDescription "Creates transfer note text"
    - buildTransactionNotes "Combines notes/comment fields"
    - validateAmount "Guards against NaN/negative amounts"
    - requiresConversion "Checks if FX conversion is needed"
    - logTransactionOperation "Debug logger with timings"

sync/types.ts - Shared Sync/Firefly type definitions.
    - TransactionType "Union of withdrawal|deposit|transfer"
    - UnifiedWebhookPayload "Normalized webhook payload contract"

telegram.ts - Telegram Mini App SDK wrapper.
    - telegramService "Initializes WebApp, exposes UI controls, haptics, links"
