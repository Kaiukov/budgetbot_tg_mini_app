/**
 * Fetch user data from backend sync-service
 *
 * Note: Telegram WebApp doesn't always provide photo_url in initDataUnsafe.
 * We fetch it securely from our backend which calls Telegram Bot API.
 */

import telegramService from '../services/telegram';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost';
const API_KEY = import.meta.env.VITE_SYNC_API_KEY || '';

export interface UserData {
  success: boolean;
  photo_url: string | null;
  bio: string;
  user_id: number;
  error?: string;
}

export async function fetchUserData(userId: number): Promise<UserData | null> {
  try {
    console.log('📸 Fetching user data from backend for user ID:', userId);

    // Get Telegram initData for authentication
    const initData = telegramService.getInitData();

    if (!initData) {
      console.warn('⚠️ No Telegram initData available (browser mode)');
      return null;
    }

    const response = await fetch(`${BASE_URL}/api/sync/tgUser`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch user data:', response.statusText, response.status);
      return null;
    }

    const data: UserData = await response.json();
    console.log('📸 Backend response:', data);

    if (data.success) {
      console.log('✅ Successfully fetched user data from backend');
      return data;
    } else {
      console.error('❌ Backend returned error:', data.error);
      return null;
    }

  } catch (error) {
    console.error('💥 Error fetching user data from backend:', error);
    return null;
  }
}
