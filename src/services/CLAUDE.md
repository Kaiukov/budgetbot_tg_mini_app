# Services

API integration layer with modular facades. All services follow single-responsibility principle with clean re-export boundaries.

## Sync Service Architecture (v0.2.3)

**`sync.ts`** - Facade pattern facade re-exporting domain modules for clean API surface.

**`sync/` directory** - Domain-specific modules:
- **`index.ts`** - Barrel exports for all sync operations
- **`gateway.ts`** - HTTP request abstraction with Tier 2 authentication
- **`auth.ts`** - Tier 2 auth helpers and header construction
- **`cache.ts`** - Centralized cache management (accounts 5min, categories 1min, FX rates 1h)
- **`exchangeRate.ts`** - Real FX conversion service with caching
- **`syncAccounts.ts`** - Account balance and usage operations
- **`syncCategories.ts`** - Category fetching and filtering
- **`syncDestinationSourceNames.ts`** - Auto-complete suggestions
- **`addTransactions.ts`** - Transaction CRUD: create, update, delete
- **`getTransactions.ts`** - Transaction fetching and filtering

**Benefits:** Clear separation, improved testability, reduced cognitive load, backward compatible.

## Other Services

**[firefly/](firefly/)**: Firefly III API integration. See `firefly/CLAUDE.md` for details.

**[telegram.ts](telegram.ts)**: Telegram Mini App SDK wrapper for buttons, events, themes, haptic feedback.
