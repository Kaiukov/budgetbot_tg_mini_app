/**
 * Fetch Telegram user data from backend sync-service
 */

import telegramService from '../services/telegram';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_KEY = import.meta.env.VITE_SYNC_API_KEY || '';

export interface TelegramUserData {
  id: number;
  name: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  language_code: string;
  bot_blocked: boolean;
}

export interface UserDataResponse {
  success: boolean;
  message: string;
  timestamp: string;
  userData: TelegramUserData;
  sessionToken?: string | null;
  sessionExpiresAt?: string | null;
}

const userDataFetchPromises = new Map<number, Promise<UserDataResponse>>();

export async function fetchUserData(userId?: number): Promise<UserDataResponse> {
  if (userId && userDataFetchPromises.has(userId)) {
    return userDataFetchPromises.get(userId)!;
  }

  const promise = (async () => {
    try {
      const initData = telegramService.getInitData();

      if (!initData) {
        throw new Error('Telegram initData not available');
      }

      const baseUrl = BASE_URL;
      const apiKey = API_KEY;

      if (!apiKey) {
        throw new Error('Sync API key not configured');
      }

      const url = `${baseUrl}/api/v1/auth/telegram/session`;

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Anonymous-Key': apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(initData && { 'X-Telegram-Init-Data': initData }),
        },
        body: JSON.stringify({
          ...(userId && { userId })
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: UserDataResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    } finally {
      if (userId) {
        userDataFetchPromises.delete(userId);
      }
    }
  })();

  if (userId) {
    userDataFetchPromises.set(userId, promise);
  }

  return promise;
}
