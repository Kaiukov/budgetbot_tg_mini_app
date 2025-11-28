# Step 5: Create Accounts Service

**Objective**: Extract account-related operations into dedicated service module.

**Create file**: `src/services/sync/accounts.ts`

## Code to Extract from sync.ts

Imports:
```typescript
import type { AccountsUsageResponse } from './types';
import { SyncServiceBalance } from './balance';
```

Extract method (lines 349-441):
```typescript
/**
 * Get accounts usage for a specific user or all accounts
 * Returns all existing accounts with smart sorting
 */
public async getAccountsUsage(userName?: string): Promise<AccountsUsageResponse> {
  // Full implementation including sorting logic
}
```

## File Structure

```typescript
// src/services/sync/accounts.ts
import type { AccountsUsageResponse } from './types';
import { SyncServiceBalance } from './balance';

export class SyncServiceAccounts extends SyncServiceBalance {
  /**
   * Get accounts usage for a specific user or all accounts
   * Returns all existing accounts with smart sorting:
   * - Top: Accounts user has used (usage_count > 0), sorted high to low
   * - Bottom: Accounts user hasn't used (usage_count = 0)
   *
   * @param userName - Optional username to sort accounts by usage
   */
  public async getAccountsUsage(userName?: string): Promise<AccountsUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      // Full implementation from sync.ts lines 349-441
      // Including caching, sorting, and console logging
    } catch (error) {
      console.error('Failed to get accounts usage:', error);
      throw error;
    }
  }
}
```

## Validation

```bash
npx tsc --noEmit
npm run lint src/services/sync/accounts.ts
```

## Checklist

- [ ] File created at `src/services/sync/accounts.ts`
- [ ] Extends `SyncServiceBalance` correctly
- [ ] `getAccountsUsage()` method with full sorting logic
- [ ] Account cache usage preserved
- [ ] No TypeScript errors
- [ ] Next: Step 6 - Create categories service

## Dependencies

- ✅ Step 4 completed (balance.ts exists)

## Rollback

```bash
git checkout src/services/sync/accounts.ts
```
