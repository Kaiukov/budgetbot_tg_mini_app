# Step 6: Create Categories Service

**Objective**: Extract category-related operations into dedicated service module.

**Create file**: `src/services/sync/categories.ts`

## Code to Extract from sync.ts

Imports:
```typescript
import type {
  CategoriesUsageResponse,
  CategoryUsage
} from './types';
import { SyncServiceAccounts } from './accounts';
```

Extract method (lines 453-574):
```typescript
/**
 * Get categories usage for a specific user or all categories
 * Returns all existing categories with smart sorting
 */
public async getCategoriesUsage(userName?: string): Promise<CategoriesUsageResponse> {
  // Full implementation including filtering and sorting logic
}
```

## File Structure

```typescript
// src/services/sync/categories.ts
import type {
  CategoriesUsageResponse,
  CategoryUsage
} from './types';
import { SyncServiceAccounts } from './accounts';

export class SyncServiceCategories extends SyncServiceAccounts {
  /**
   * Get categories usage for a specific user or all categories
   * Returns all existing categories with smart sorting:
   * - Top: Categories user has used (usage_count > 0), sorted high to low
   * - Bottom: Categories user hasn't used (usage_count = 0)
   *
   * Uses 1-minute cache to reduce API calls
   *
   * @param userName - Optional username to sort categories by usage
   */
  public async getCategoriesUsage(userName?: string): Promise<CategoriesUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      // Full implementation from sync.ts lines 453-574
      // Including category filtering, unused placeholder creation, and sorting
    } catch (error) {
      console.error('Failed to get categories usage:', error);
      throw error;
    }
  }
}
```

## Validation

```bash
npx tsc --noEmit
npm run lint src/services/sync/categories.ts
```

## Checklist

- [ ] File created at `src/services/sync/categories.ts`
- [ ] Extends `SyncServiceAccounts` correctly
- [ ] `getCategoriesUsage()` method with full logic
- [ ] Category cache usage preserved
- [ ] Smart sorting including unused categories
- [ ] No TypeScript errors
- [ ] Next: Step 7 - Create destinations service

## Dependencies

- ✅ Step 5 completed (accounts.ts exists)

## Rollback

```bash
git checkout src/services/sync/categories.ts
```
