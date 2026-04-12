/**
 * User Initialization Service
 * Determines the user identity based on runtime environment:
 * - Inside Telegram Mini App: uses Telegram WebApp SDK
 * - Standalone PWA: checks cookie-based session via backend
 */

import { withTimeout } from '../../machines/errorHandling';
import { ACTOR_TIMEOUTS } from '../../config/actorTimeouts';
import telegramService from './sdk';
import { authService } from '../sync/auth';
import type { BudgetUser } from './types';

export interface TelegramUserInitOptions {
  timeout?: number;
}

/**
 * Initialize user data.
 * In Telegram: uses initData + backend enrichment.
 * In PWA: checks cookie session via backend status endpoint.
 */
export async function initializeTelegramUser(
  options: TelegramUserInitOptions = {}
): Promise<BudgetUser> {
  const { timeout = ACTOR_TIMEOUTS.TELEGRAM_INIT } = options;

  try {
    return await withTimeout(
      initializeUserInternal(),
      timeout,
      'User Initialization'
    );
  } catch (error) {
    console.error('User initialization failed:', error);
    return guestUser();
  }
}

async function initializeUserInternal(): Promise<BudgetUser> {
  if (telegramService.isAvailable()) {
    return initializeFromTelegram();
  }
  // Standalone PWA: check for existing cookie session
  return initializeFromSession();
}

async function initializeFromTelegram(): Promise<BudgetUser> {
  const user = telegramService.getUser();
  const user_name = telegramService.getUserName();
  const userPhotoUrl = telegramService.getUserPhotoUrl();
  const userInitials = telegramService.getUserInitials();
  const colorScheme = telegramService.getColorScheme();
  const userBio = telegramService.getUserBio() || 'Manage finances and create reports';

  if (user?.id) {
    try {
      const { fetchUserData } = await import('../../utils/fetchUserData');
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
      console.error('Backend user fetch failed:', error);
    }
  }

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

async function initializeFromSession(): Promise<BudgetUser> {
  const currentUser = await authService.getCurrentUser();
  if (!currentUser) {
    return guestUser();
  }

  const displayName = currentUser.name || currentUser.username || 'User';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

  return {
    id: currentUser.id || 0,
    user_name: currentUser.username || displayName,
    fullName: displayName,
    photoUrl: currentUser.avatar_url || null,
    initials,
    bio: currentUser.bio || 'Manage finances and create reports',
    colorScheme: 'dark' as const,
    rawUser: null,
  };
}

function guestUser(): BudgetUser {
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
