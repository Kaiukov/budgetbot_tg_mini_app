import { withTimeout } from '../../machines/errorHandling';
import { ACTOR_TIMEOUTS } from '../../config/actorTimeouts';
import telegramService from './sdk';
import { authService } from '../sync/auth';
import type { BudgetUser } from './types';

export interface TelegramUserInitOptions {
  timeout?: number;
}

export async function initializeTelegramUser(
  options: TelegramUserInitOptions = {}
): Promise<BudgetUser> {
  const { timeout = ACTOR_TIMEOUTS.TELEGRAM_INIT } = options;
  const colorScheme = telegramService.getColorScheme();

  try {
    return await withTimeout(
      initializeUserInternal(),
      timeout,
      'User Initialization'
    );
  } catch (error) {
    console.error('User initialization failed:', error);
    return guestUser(colorScheme);
  }
}

async function initializeUserInternal(): Promise<BudgetUser> {
  return initializeFromSession(telegramService.getColorScheme());
}

async function initializeFromSession(colorScheme: 'light' | 'dark'): Promise<BudgetUser> {
  const currentUser = await authService.getCurrentUser();
  if (!currentUser) {
    return guestUser(colorScheme);
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
    colorScheme,
    rawUser: null,
  };
}

function guestUser(colorScheme: 'light' | 'dark'): BudgetUser {
  return {
    id: 0,
    user_name: 'Guest',
    fullName: 'Guest',
    photoUrl: null,
    initials: 'G',
    bio: 'Manage finances and create reports',
    colorScheme,
    rawUser: null,
  };
}
