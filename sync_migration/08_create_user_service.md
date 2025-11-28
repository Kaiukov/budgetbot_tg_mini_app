# Step 8: Create User Service

**Objective**: Extract Telegram user profile operations into dedicated service module.

**Create file**: `src/services/sync/user.ts`

## Code to Extract from sync.ts

Imports:
```typescript
import type { TelegramUserData } from './types';
import { SyncServiceDestinations } from './destinations';
```

Extract method (lines 619-651):
```typescript
/**
 * Get Telegram user data from backend
 * Returns user photo, bio, and user ID validated through Telegram
 */
public async getTelegramUser(): Promise<TelegramUserData> {
  // Implementation with success/error handling
}
```

## File Structure

```typescript
// src/services/sync/user.ts
import type { TelegramUserData } from './types';
import { SyncServiceDestinations } from './destinations';

export class SyncServiceUser extends SyncServiceDestinations {
  /**
   * Get Telegram user data from backend
   * Returns user photo, bio, and user ID validated through Telegram
   */
  public async getTelegramUser(): Promise<TelegramUserData> {
    try {
      if (!this.isConfigured()) {
        console.warn('⚠️ Sync API not configured');
        return {
          success: false,
          message: 'Sync API not configured on client',
          timestamp: new Date().toISOString(),
          userData: null
        };
      }

      console.log('📸 Fetching Telegram user data from backend');

      const data = await this.makeRequest<TelegramUserData>(
        '/api/sync/tgUser',
        { method: 'POST' }
      );

      if (data.success) {
        console.log('✅ Successfully fetched Telegram user data:', data.userData);
      } else {
        console.error('❌ Backend returned error:', data.message);
      }

      return data;
    } catch (error) {
      console.error('💥 Error fetching Telegram user data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        userData: null
      };
    }
  }
}
```

## Validation

```bash
npx tsc --noEmit
npm run lint src/services/sync/user.ts
```

## Checklist

- [ ] File created at `src/services/sync/user.ts`
- [ ] Extends `SyncServiceDestinations` correctly
- [ ] `getTelegramUser()` method with full error handling
- [ ] Returns graceful fallback when not configured
- [ ] No TypeScript errors
- [ ] Next: Step 9 - Create index export

## Dependencies

- ✅ Step 7 completed (destinations.ts exists)

## Rollback

```bash
git checkout src/services/sync/user.ts
```
