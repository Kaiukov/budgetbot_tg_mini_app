/**
 * Telegram User Initialization Service
 * Single source of truth for Telegram user data initialization
 * Used by both useTelegramUser hook and telegramInitActor
 */

import { withTimeout } from '../../machines/errorHandling';
import { ACTOR_TIMEOUTS } from '../../config/actorTimeouts';
import { fetchUserData } from '../../utils/fetchUserData';
import telegramService from './sdk';
import type { BudgetUser } from './types';

export interface TelegramUserInitOptions {
  timeout?: number;
  skipBackendFetch?: boolean;
}

/**
 * Initialize Telegram user data with timeout protection
 * Fetches basic user from Telegram WebApp SDK, enriches with backend data
 * Returns Guest user on any error
 */
export async function initializeTelegramUser(
  options: TelegramUserInitOptions = {}
): Promise<BudgetUser> {
  const {
    timeout = ACTOR_TIMEOUTS.TELEGRAM_INIT,
    skipBackendFetch = false
  } = options;

  try {
    // Wrap entire initialization with timeout protection
    return await withTimeout(
      initializeUserInternal(skipBackendFetch),
      timeout,
      'Telegram User Initialization'
    );
  } catch (error) {
    console.error('❌ Telegram initialization failed:', error);

    // Return Guest user fallback on any error
    return {
      id: 0,
      user_name: 'Guest',
      fullName: 'Guest',
      photoUrl: null,
      initials: 'G',
      bio: 'Manage finances and create reports',
      colorScheme: 'dark' as const,
      rawUser: null,
    };
  }
}

/**
 * Internal initialization logic without timeout wrapper
 * Separated for reusability and testing
 */
async function initializeUserInternal(
  skipBackendFetch: boolean
): Promise<BudgetUser> {
  // Check Telegram availability
  const isAvailable = telegramService.isAvailable();
  if (!isAvailable) {
    throw new Error('Telegram WebApp not available');
  }

  // Get basic Telegram user data from SDK
  const user = telegramService.getUser();
  const user_name = telegramService.getUserName();
  const userPhotoUrl = telegramService.getUserPhotoUrl();
  const userInitials = telegramService.getUserInitials();
  const colorScheme = telegramService.getColorScheme();
  const userBio = telegramService.getUserBio() || 'Manage finances and create reports';

  // Enrich with backend data if user ID available and not skipped
  if (user?.id && !skipBackendFetch) {
    try {
      const backendData = await fetchUserData(user.id);
      if (backendData?.success && backendData.userData) {
        return {
          id: user.id,
          user_name: backendData.userData.username || user_name,
          fullName: backendData.userData.name || user_name,
          photoUrl: userPhotoUrl,
          initials: userInitials,
          bio: backendData.userData.bio || userBio,
          colorScheme,
          rawUser: user,
        };
      }
    } catch (error) {
      console.error('❌ Backend user fetch failed, using Telegram data only:', error);
      // Fall through to return basic user data
    }
  }

  // Return basic user data from Telegram (fallback when backend unavailable)
  return {
    id: user?.id || 0,
    user_name,
    fullName: user_name,
    photoUrl: userPhotoUrl,
    initials: userInitials,
    bio: userBio,
    colorScheme,
    rawUser: user || null,
  };
}
