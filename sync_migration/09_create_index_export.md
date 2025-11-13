# Step 9: Create Index Export

**Objective**: Create the main entry point that exports the singleton SyncService instance and all types.

**Create file**: `src/services/sync/index.ts`

## Code Structure

```typescript
// src/services/sync/index.ts
import { SyncServiceUser } from './user';

// Export all types for external use
export * from './types';

// Create and export singleton instance
export const syncService = new SyncServiceUser();
export default syncService;
```

## Full Implementation

```typescript
import { SyncServiceUser } from './user';

// Re-export all types for consumers
export * from './types';

// Export class for type checking if needed
export { SyncServiceUser };

// Create singleton instance
export const syncService = new SyncServiceUser();

// Default export for convenience
export default syncService;
```

## Validation

```bash
npx tsc --noEmit
npm run lint src/services/sync/index.ts
```

## Checklist

- [ ] File created at `src/services/sync/index.ts`
- [ ] All types exported from `./types`
- [ ] SyncServiceUser imported
- [ ] Singleton `syncService` created and exported
- [ ] Default export added
- [ ] No TypeScript errors
- [ ] Next: Step 10 - Create backward compatibility

## Dependencies

- ✅ Step 8 completed (user.ts exists)
- ✅ Step 1 completed (types.ts exists)

## Rollback

```bash
git checkout src/services/sync/index.ts
```
