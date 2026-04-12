/**
 * Fetch Telegram user photo from backend sync-service
 */

import telegramService from '../services/telegram';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_KEY = import.meta.env.VITE_SYNC_API_KEY || '';

export interface UserData {
  success: boolean;
  photo_url: string | null;
  bio: string;
  user_id: number;
  error?: string;
}

export async function fetchUserPhoto(_userId: number): Promise<UserData | null> {
  try {
    const initData = telegramService.getInitData();

    if (!initData) {
      return null;
    }

    const response = await fetch(`${BASE_URL}/api/v1/auth/telegram/session`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Anonymous-Key': API_KEY,
        'X-Telegram-Init-Data': initData,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: UserData = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user photo:', error);
    return null;
  }
}
