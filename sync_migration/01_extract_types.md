# Step 1: Extract Types

**Objective**: Extract all interface definitions into a dedicated `types.ts` file for better organization and reusability.

**Create file**: `src/services/sync/types.ts`

## Code to Extract

Move these interfaces from `src/services/sync.ts` (lines 8-91):

```typescript
// Account usage interfaces (lines 8-29)
export interface AccountUsage { ... }
export interface AccountsUsageResponse { ... }

// Category usage interfaces (lines 31-46)
export interface CategoryUsage { ... }
export interface CategoriesUsageResponse { ... }

// Destination interfaces (lines 48-65)
export interface DestinationSuggestion { ... }
export interface DestinationNameUsageResponse { ... }

// Balance interfaces (lines 67-75)
export interface CurrentBalanceResponse { ... }

// Telegram user interfaces (lines 77-86)
export interface TelegramUserData { ... }

// Cache interfaces (lines 88-91)
export interface ExchangeRateCache { ... }
```

## Validation

```bash
# Run from project root:
npx tsc --noEmit
```

Expected: No TypeScript errors

## Checklist

- [ ] File `src/services/sync/types.ts` created
- [ ] All 9 interfaces moved
- [ ] No `export` keyword issues
- [ ] TypeScript compiles without errors
- [ ] Next: Step 2 - Create core service

## Dependencies

- No dependencies - this is foundational

## Rollback

```bash
git checkout src/services/sync/types.ts
```
