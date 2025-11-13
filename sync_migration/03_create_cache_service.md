# Step 3: Create Cache Service

**Objective**: Extend `SyncServiceCore` with cache management for accounts, categories, and balances.

**Create file**: `src/services/sync/cache.ts`

## Code to Extract from sync.ts

Imports:
```typescript
import { Cache } from '../../utils/cache';
import type {
  AccountsUsageResponse,
  CategoriesUsageResponse,
  CurrentBalanceResponse
} from './types';
import { SyncServiceCore } from './core';
```

Extract class and properties (lines 93-147):
```typescript
// Cache instances initialization (lines 101-140):
private categoryCache: Cache<CategoriesUsageResponse>;
private readonly CATEGORY_CACHE_EXPIRY_MS = 60000;

private accountCache: Cache<AccountsUsageResponse>;
private readonly ACCOUNT_CACHE_EXPIRY_MS = 60000;

private balanceCache: Cache<CurrentBalanceResponse>;
private readonly BALANCE_CACHE_EXPIRY_MS = 300000;
```

## File Structure

```typescript
// src/services/sync/cache.ts
import { Cache } from '../../utils/cache';
import type {
  AccountsUsageResponse,
  CategoriesUsageResponse,
  CurrentBalanceResponse
} from './types';
import { SyncServiceCore } from './core';

export class SyncServiceCache extends SyncServiceCore {
  private categoryCache: Cache<CategoriesUsageResponse>;
  private readonly CATEGORY_CACHE_EXPIRY_MS = 60000;

  private accountCache: Cache<AccountsUsageResponse>;
  private readonly ACCOUNT_CACHE_EXPIRY_MS = 60000;

  private balanceCache: Cache<CurrentBalanceResponse>;
  private readonly BALANCE_CACHE_EXPIRY_MS = 300000;

  constructor() {
    super();
    this.categoryCache = new Cache<CategoriesUsageResponse>(
      this.CATEGORY_CACHE_EXPIRY_MS,
      'category_'
    );
    this.accountCache = new Cache<AccountsUsageResponse>(
      this.ACCOUNT_CACHE_EXPIRY_MS,
      'account_'
    );
    this.balanceCache = new Cache<CurrentBalanceResponse>(
      this.BALANCE_CACHE_EXPIRY_MS,
      'balance_'
    );
  }

  // Cache access methods for subclasses
  protected getAccountCache() { return this.accountCache; }
  protected getCategoryCache() { return this.categoryCache; }
  protected getBalanceCache() { return this.balanceCache; }
}
```

## Validation

```bash
npx tsc --noEmit
npm run lint src/services/sync/cache.ts
```

## Checklist

- [ ] File created at `src/services/sync/cache.ts`
- [ ] Extends `SyncServiceCore` correctly
- [ ] All cache instances initialized
- [ ] Protected getter methods added
- [ ] No TypeScript errors
- [ ] Next: Step 4 - Create balance service

## Dependencies

- ✅ Step 2 completed (core.ts exists)

## Rollback

```bash
git checkout src/services/sync/cache.ts
```
