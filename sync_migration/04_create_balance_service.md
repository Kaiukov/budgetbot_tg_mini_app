# Step 4: Create Balance Service

**Objective**: Extract balance and exchange rate operations into dedicated service.

**Create file**: `src/services/sync/balance.ts`

## Code to Extract from sync.ts

Imports:
```typescript
import type {
  CurrentBalanceResponse,
  AccountsUsageResponse
} from './types';
import { SyncServiceCache } from './cache';
```

Extract methods (lines 307-756):
```typescript
// fetchCurrentBalance (lines 309-339)
public async fetchCurrentBalance(): Promise<number> { ... }

// getExchangeRate (lines 662-756)
public async getExchangeRate(from: string, to: string, amount: number = 1.0): Promise<number | null> { ... }
```

## File Structure

```typescript
// src/services/sync/balance.ts
import type {
  CurrentBalanceResponse,
  AccountsUsageResponse
} from './types';
import { SyncServiceCache } from './cache';

export class SyncServiceBalance extends SyncServiceCache {
  /**
   * Get current balance from the API with 5-minute caching
   */
  public async fetchCurrentBalance(): Promise<number> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      const cacheKey = 'current_balance';
      const cachedData = this.getBalanceCache().get(cacheKey);

      if (cachedData) {
        console.log('💾 Using cached balance');
        return cachedData.get_current_balance[0]?.balance_in_USD || 0;
      }

      console.log('🔄 Fetching fresh balance');
      const data = await this.makeRequest<CurrentBalanceResponse>(
        '/api/sync/get_current_balance',
        { method: 'GET' }
      );

      this.getBalanceCache().set(cacheKey, data);
      return data.get_current_balance[0]?.balance_in_USD || 0;
    } catch (error) {
      console.error('Failed to fetch current balance:', error);
      throw error;
    }
  }

  /**
   * Get exchange rate for currency conversion
   */
  public async getExchangeRate(from: string, to: string, amount: number = 1.0): Promise<number | null> {
    // Full implementation from lines 662-756
  }
}
```

## Validation

```bash
npx tsc --noEmit
npm run lint src/services/sync/balance.ts
```

## Checklist

- [ ] File created at `src/services/sync/balance.ts`
- [ ] Extends `SyncServiceCache` correctly
- [ ] Both public methods included: `fetchCurrentBalance()`, `getExchangeRate()`
- [ ] Cache getter calls updated to use protected method
- [ ] No TypeScript errors
- [ ] Next: Step 5 - Create accounts service

## Dependencies

- ✅ Step 3 completed (cache.ts exists)

## Rollback

```bash
git checkout src/services/sync/balance.ts
```
