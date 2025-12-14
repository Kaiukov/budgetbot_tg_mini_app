/**
 * Telegram Service Types
 * Shared type definitions for Telegram user data
 */

import type { TelegramWebAppUser } from '../../types/telegram';

/**
 * Unified budget user profile from Telegram and backend data
 * Used throughout the app for user identification and personalization
 */
export interface BudgetUser {
  id: number;
  user_name: string;                  // API filter username (e.g., "Kaiukov")
  fullName: string;                   // Display name (e.g., "Oleksandr 🇺🇦 Kaiukov")
  photoUrl: string | null;
  initials: string;
  bio: string;
  colorScheme: 'light' | 'dark';
  rawUser: TelegramWebAppUser | null; // Raw Telegram WebApp user object
}
