# Step 7: Create Destinations Service

**Objective**: Extract destination-related operations into dedicated service module.

**Create file**: `src/services/sync/destinations.ts`

## Code to Extract from sync.ts

Imports:
```typescript
import type { DestinationNameUsageResponse } from './types';
import { SyncServiceCategories } from './categories';
```

Extract method (lines 583-613):
```typescript
/**
 * Get all destination name usage data (no filtering)
 * Returns complete destination list from all users and categories
 * Client-side filtering preferred to avoid encoding issues with Cyrillic/emoji
 *
 * @returns Full destination list for client-side filtering
 */
public async getDestinationNameUsage(): Promise<DestinationNameUsageResponse> {
  // Fetch all destinations without query parameters
}
```

## File Structure

```typescript
// src/services/sync/destinations.ts
import type { DestinationNameUsageResponse } from './types';
import { SyncServiceCategories } from './categories';

export class SyncServiceDestinations extends SyncServiceCategories {
  /**
   * Get all destination name usage data (no filtering)
   * Returns complete destination list from all users and categories
   * Client-side filtering is preferred over backend filtering to avoid encoding issues with Cyrillic/emoji
   *
   * @returns Full destination list for client-side filtering
   */
  public async getDestinationNameUsage(): Promise<DestinationNameUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      // Full implementation from sync.ts lines 583-613
      // Note: No filtering at backend level, returns all destinations
    } catch (error) {
      console.error('Failed to get destination names:', error);
      throw error;
    }
  }
}
```

## Validation

```bash
npx tsc --noEmit
npm run lint src/services/sync/destinations.ts
```

## Checklist

- [ ] File created at `src/services/sync/destinations.ts`
- [ ] Extends `SyncServiceCategories` correctly
- [ ] `getDestinationNameUsage()` method with no backend filtering
- [ ] Comment about Cyrillic/emoji encoding preserved
- [ ] No TypeScript errors
- [ ] Next: Step 8 - Create user service

## Dependencies

- ✅ Step 6 completed (categories.ts exists)

## Rollback

```bash
git checkout src/services/sync/destinations.ts
```
