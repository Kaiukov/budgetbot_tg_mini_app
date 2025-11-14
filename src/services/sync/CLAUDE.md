# sync
Client-side service stack for the custom Sync API that powers accounts, categories, currency conversion, destination suggestions, and Telegram user lookup. Classes build on each other (Core → Cache → Balance → Accounts → Categories → Destinations → User) so consumers can import the ready-to-use singleton from `index.ts`.

**[core.ts](core.ts)**: Base service that configures the API origin/anonymous key, provides exchange-rate caching (memory + `localStorage`), and exposes the `makeRequest` helper that injects Telegram `initData` for authenticated calls.
**[cache.ts](cache.ts)**: Extends the core service with short-lived caches for categories, accounts, and balances using `src/utils/cache`. Exposes getters so subclasses can reuse centralized storage.
**[balance.ts](balance.ts)**: Adds currency/balance operations. Fetches the aggregated USD balance with a 5‑minute cache and implements `getExchangeRate`, which calls `/api/sync/exchange_rate`, normalizes responses, and memoizes computed rates for an hour.
**[accounts.ts](accounts.ts)**: Implements account-usage retrieval with smart sorting. Pulls `/get_accounts_usage`, splits used vs. unused accounts, sorts by usage count, and memoizes per-user payloads for 60 seconds.
**[categories.ts](categories.ts)**: Adds category-usage helpers. When a `userName` is provided it performs client-side enrichment—ensuring every known category is returned, sorting by usage, and synthesizing zero-usage placeholders—before caching for a minute.
**[destinations.ts](destinations.ts)**: Fetches the complete destination-name usage list (no server-side filtering) so the UI can safely filter Cyrillic/emoji inputs locally.
**[user.ts](user.ts)**: Top-level service that fetches validated Telegram profile data via `/api/sync/tgUser` and overrides `checkConnection` to verify connectivity by loading accounts.
**[types.ts](types.ts)**: Centralized TypeScript interfaces for every Sync API response (accounts, categories, destinations, balances, Telegram users, exchange-rate cache).
**[index.ts](index.ts)**: Export hub that re-exports all types, the concrete `SyncServiceUser` class, and the singleton `syncService` instance used across the app.
