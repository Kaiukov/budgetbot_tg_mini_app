/**
 * Fetch Telegram user data from backend sync-service
 * 
 * This function fetches the complete user data from the API with the structure:
 * {
 *   "success": true,
 *   "message": "User data retrieved successfully",
 *   "timestamp": "2025-10-27T04:04:18.446959",
 *   "userData": {
 *     "id": 64096067,
 *     "name": "Oleksandr 🇺🇦 Kaiukov",
 *     "username": "Kaiukov",
 *     "bio": "😎",
 *     "avatar_url": "https://api.telegram.org/file/bot7287096901:AAEXbITi_NXcCeZmI-odblaOOL33fft4jmk/profile_photos/file_5.jpg",
 *     "language_code": "en",
 *     "bot_blocked": false
 *   }
 * }
 */

import telegramService from '../services/telegram';

// Define TypeScript interfaces matching the expected API response structure
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
}

/**
 * Fetches complete user data from the backend API
 * @param userId Optional user ID to fetch data for (if not provided, uses current user)
 * @returns Promise resolving to the complete user data response
 */
export async function fetchUserData(userId?: number): Promise<UserDataResponse> {
  try {
    console.log('📸 Fetching full user data from backend for user ID:', userId);

    // Get Telegram initData for authentication
    const initData = telegramService.getInitData();

    if (!initData) {
      console.warn('⚠️ No Telegram initData available (browser mode)');
      throw new Error('Telegram initData not available');
    }

    // Define the base URL - in production, use the production URL, otherwise use proxy
    const isProduction = typeof window !== 'undefined' &&
      (window.location.hostname.includes('workers.dev') ||
       window.location.hostname.includes('pages.dev'));

    const baseUrl = isProduction ? 'https://dev.neon-chuckwalla.ts.net' : '';
    const apiKey = import.meta.env.VITE_SYNC_API_KEY || '';

    if (!apiKey) {
      throw new Error('Sync API key not configured');
    }

    const url = `${baseUrl}/api/sync/tgUser`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        initData,
        ...(userId && { userId }) // Include userId in the request if provided
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch user data:', response.statusText, response.status, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: UserDataResponse = await response.json();
    console.log('📸 Full user data response:', data);

    return data;

  } catch (error) {
    console.error('💥 Error fetching user data from backend:', error);
    throw error;
  }
}