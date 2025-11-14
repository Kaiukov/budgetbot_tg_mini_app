# Step 2: Create Core Service

**Objective**: Extract base API logic and configuration into `SyncServiceCore` class.

**Create file**: `src/services/sync/core.ts`

## Code to Extract from sync.ts

Import types (add at top):
```typescript
import { Cache } from '../../utils/cache';
import type {
  CurrentBalanceResponse,
  TelegramUserData,
  ExchangeRateCache
} from './types';
```

Extract class definition (lines 93-304):
```typescript
// Constructor (lines 112-147)
constructor() { ... }

// Private methods:
private generateCacheKey(from: string, to: string): string { ... }
private getExchangeRateFromCache(from: string, to: string): number | null { ... }
private setExchangeRateCache(from: string, to: string, rate: number): void { ... }

// Protected method for subclasses:
protected async makeRequest<T>(endpoint: string, options?: { method?: string; body?: any }): Promise<T> { ... }

// Public accessor methods:
public getAnonKey(): string | null { ... }
public getBaseUrl(): string { ... }
public isConfigured(): boolean { ... }
public async checkConnection(): Promise<{ success: boolean; message: string }> { ... }
```

## File Structure

```typescript
// src/services/sync/core.ts
import { Cache } from '../../utils/cache';
import type { ExchangeRateCache } from './types';

export class SyncServiceCore {
  protected baseUrl: string;
  protected anonKey: string | null = null;
  protected exchangeRateCache: Map<string, ExchangeRateCache> = new Map();
  protected readonly CACHE_EXPIRY_MS = 3600000;
  protected readonly CACHE_KEY_PREFIX = 'exchange_rate_';

  constructor() { ... }

  // All methods as extracted above
}
```

## Validation

```bash
npx tsc --noEmit
npm run lint src/services/sync/core.ts
```

## Checklist

- [ ] File created at `src/services/sync/core.ts`
- [ ] All imports correct
- [ ] Constructor and all public/protected methods included
- [ ] Exchange rate cache logic preserved
- [ ] No TypeScript errors
- [ ] Next: Step 3 - Create cache service

## Dependencies

- ✅ Step 1 completed (types.ts exists)
- Cache utility must exist at `src/utils/cache.ts`

## Rollback

```bash
git checkout src/services/sync/core.ts
```
