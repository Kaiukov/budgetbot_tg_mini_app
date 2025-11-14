# 🚀 Sync Service Refactoring - Complete Migration Guide

**Goal**: Refactor `src/services/sync.ts` (790 lines) into a modular, maintainable service architecture.

**Timeline**: ~45 minutes | **Complexity**: Medium | **Risk**: Low (backward compatible)

---

## 📊 Quick Overview

| Aspect | Before | After |
|--------|--------|-------|
| **Files** | 1 monolithic file | 10 focused modules |
| **Lines per file** | 790 | 80-130 (avg) |
| **Main sync.ts** | Full implementation | 15-line re-export |
| **Testability** | Hard | Easy (isolated modules) |
| **Maintainability** | Complex | Clear responsibilities |
| **Backward compat** | N/A | 100% maintained |

---

## 🎯 Architecture After Refactoring

```
src/services/
├── sync/                           # New modular structure
│   ├── types.ts                    # All interfaces (95 lines)
│   ├── core.ts                     # Base API logic (120 lines)
│   ├── cache.ts                    # Cache layer (60 lines)
│   ├── balance.ts                  # Balance & rates (100 lines)
│   ├── accounts.ts                 # Account operations (95 lines)
│   ├── categories.ts               # Category operations (125 lines)
│   ├── destinations.ts             # Destination ops (35 lines)
│   ├── user.ts                     # Telegram profile (35 lines)
│   └── index.ts                    # Main export (5 lines)
│
└── sync.ts                         # Re-export wrapper (15 lines)
```

### Inheritance Chain

```
SyncServiceCore (API base)
    ↓
SyncServiceCache (Cache management)
    ↓
SyncServiceBalance (Balance & rates)
    ↓
SyncServiceAccounts (Account queries)
    ↓
SyncServiceCategories (Category queries)
    ↓
SyncServiceDestinations (Destination queries)
    ↓
SyncServiceUser (Telegram profile)
    ↓
[Exported as singleton: syncService]
```

---

## 🎬 Getting Started

### 1. Preparation

```bash
# Ensure you're on the current branch
git status
# Expected: On branch fix/fix-flow-expense-income-transfer

# Create feature branch
git checkout -b refactor/sync-service

# Verify nothing is blocking
npm run lint
npx tsc --noEmit
```

### 2. Execute Steps 1-10

Follow the prompts in order:

1. **01_extract_types.md** - Extract interfaces
2. **02_create_core_service.md** - Create base service
3. **03_create_cache_service.md** - Cache management
4. **04_create_balance_service.md** - Balance operations
5. **05_create_accounts_service.md** - Account operations
6. **06_create_categories_service.md** - Category operations
7. **07_create_destinations_service.md** - Destination operations
8. **08_create_user_service.md** - Telegram user profile
9. **09_create_index_export.md** - Create main export
10. **10_create_backward_compatibility.md** - Update sync.ts

### 3. Validation (Steps 11-12)

11. **11_verify_imports.md** - Test compilation and imports
12. **12_lint_and_commit.md** - Lint and commit changes

---

## ✅ How to Use These Prompts

Each `.md` file is a **self-contained prompt** for Claude Code.

**Example workflow:**

```bash
# Step 1: Read the prompt
cat sync_migration/01_extract_types.md

# Step 2: Pass to Claude Code
# "Execute the task in 01_extract_types.md"

# Step 3: Verify results
npx tsc --noEmit
npm run lint src/services/sync/types.ts

# Step 4: Move to next step
# "Execute the task in 02_create_core_service.md"
```

---

## 🔐 Safety Features

### ✅ Zero Breaking Changes

All existing imports continue to work:

```typescript
// These all still work after refactoring:
import { syncService } from './services/sync';
import { AccountUsage } from './services/sync';
import { CategoriesUsageResponse } from './services/sync';
import syncService from './services/sync';
```

### ✅ Atomic Steps

Each step can be:
- Independently verified with `npx tsc --noEmit`
- Tested in isolation
- Rolled back if needed

### ✅ Backward Compatibility

The original `src/services/sync.ts` becomes a re-export wrapper:

```typescript
// src/services/sync.ts after refactoring
export * from './sync/index';
```

This ensures all imports resolve correctly.

---

## 🚨 Rollback Strategy

### Quick Rollback

If something goes wrong:

```bash
# Undo all changes and start over
git checkout src/services/sync/
git checkout src/services/sync.ts

# Verify rollback
npx tsc --noEmit
npm run lint
```

### Selective Rollback

If only one step failed:

```bash
# Undo just one file
git checkout src/services/sync/accounts.ts

# Continue from previous successful step
```

---

## 📋 Step-by-Step Execution Checklist

### Phase 1: Foundation (10 min)
- [ ] Step 1: Extract types ✅ Type errors? Run tsc
- [ ] Step 2: Create core service ✅ Inheritance working?

### Phase 2: Support Services (8 min)
- [ ] Step 3: Create cache ✅ Cache layer correct?
- [ ] Step 4: Create balance ✅ Methods accessible?

### Phase 3: Data Operations (12 min)
- [ ] Step 5: Create accounts ✅ Sorting logic preserved?
- [ ] Step 6: Create categories ✅ Smart filtering works?
- [ ] Step 7: Create destinations ✅ No backend filtering?

### Phase 4: Integration (10 min)
- [ ] Step 8: Create user ✅ Error handling intact?
- [ ] Step 9: Create index ✅ Singleton exported?
- [ ] Step 10: Backward compatibility ✅ Re-exports work?

### Phase 5: Validation (5 min)
- [ ] Step 11: Verify imports ✅ No circular deps?
- [ ] Step 12: Lint & commit ✅ All green?

---

## 💡 Key Decisions Made

### 1. Inheritance Chain (vs Composition)

**Chosen**: Inheritance through class extension
**Reason**: Clear dependency order, all methods accessible on final class
**Trade-off**: Rigid hierarchy (acceptable for this fixed responsibility chain)

### 2. Re-Export Wrapper (vs New Path)

**Chosen**: Keep `sync.ts` as re-export wrapper
**Reason**: Zero breaking changes, all existing imports work
**Trade-off**: An extra indirection layer (minimal cost)

### 3. No Enhancements During Refactoring

**Chosen**: Pure refactoring, no feature changes
**Reason**: Keeps changes focused and easier to review
**Trade-off**: Enhancements can be added in follow-up PR

### 4. Modular Separation

**Chosen**: Features split by responsibility (accounts, categories, etc.)
**Reason**: Clear separation, easier to test and extend
**Trade-off**: More files (10 vs 1)

---

## 🔍 Testing After Migration

### Automated Tests

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Unit tests (if any)
npm test
```

### Manual Testing

1. **Check imports work**:
   ```typescript
   import { syncService, AccountUsage } from './services/sync';
   ```

2. **Verify singleton**:
   ```typescript
   const baseUrl = syncService.getBaseUrl();
   const isConfigured = syncService.isConfigured();
   ```

3. **Test API calls**:
   ```typescript
   const accounts = await syncService.getAccountsUsage('test_user');
   const categories = await syncService.getCategoriesUsage();
   ```

---

## 📚 File Structure Reference

### types.ts (95 lines)
```
AccountUsage
AccountsUsageResponse
CategoryUsage
CategoriesUsageResponse
DestinationSuggestion
DestinationNameUsageResponse
CurrentBalanceResponse
TelegramUserData
ExchangeRateCache
```

### core.ts (120 lines)
```
baseUrl: string
anonKey: string | null
constructor()
makeRequest<T>()
getAnonKey()
getBaseUrl()
isConfigured()
checkConnection()
```

### cache.ts (60 lines)
```
Extends: SyncServiceCore
categoryCache
accountCache
balanceCache
Cache management initialization
```

### balance.ts (100 lines)
```
Extends: SyncServiceCache
fetchCurrentBalance()
getExchangeRate()
```

### accounts.ts (95 lines)
```
Extends: SyncServiceBalance
getAccountsUsage()
```

### categories.ts (125 lines)
```
Extends: SyncServiceAccounts
getCategoriesUsage()
```

### destinations.ts (35 lines)
```
Extends: SyncServiceCategories
getDestinationNameUsage()
```

### user.ts (35 lines)
```
Extends: SyncServiceDestinations
getTelegramUser()
```

### index.ts (5 lines)
```
Export all from ./types
Export syncService singleton
Export default
```

---

## 🎓 Future Enhancements

After this refactoring, it's easier to add:

1. **Transaction Flow Service**
   - Create `transactions.ts` extending `SyncServiceUser`
   - Methods for expense, income, transfer operations

2. **Retry & Timeout Logic**
   - Enhance `makeRequest()` in `core.ts`
   - Add exponential backoff

3. **Request Throttling**
   - Add `requestQueue` to `cache.ts`
   - Implement concurrency control

4. **Telemetry & Metrics**
   - Track cache hit rates
   - Monitor API response times

5. **Offline Support**
   - Cache more aggressively
   - Add offline indicators

---

## 🤝 Getting Help

If you get stuck:

1. **Check the specific step** `.md` file for troubleshooting
2. **Run type check**: `npx tsc --noEmit`
3. **Check for circular imports**: Look at import statements
4. **Verify file paths**: Ensure files are in correct locations
5. **Rollback if needed**: `git checkout src/services/sync/`

---

## 📝 Summary

This migration:

✅ Improves code organization
✅ Enhances testability
✅ Maintains backward compatibility
✅ Follows SOLID principles
✅ Enables future enhancements
✅ Reduces technical debt

**Result**: Same functionality, better structure, easier maintenance.

Good luck! 🚀
