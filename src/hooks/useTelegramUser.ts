/**
 * React Hook for Telegram User Data
 * Provides easy access to Telegram user information in React components
 */

import { useState, useEffect } from 'react';
import telegramService from '../services/telegram';
import type { TelegramWebAppUser } from '../types/telegram';
import { syncService } from '../services/sync';

export interface TelegramUserData {
  user: TelegramWebAppUser | null;
  userName: string;           // Telegram username for API filtering (e.g., "Kaiukov")
  userFullName: string;        // Full display name (e.g., "Oleksandr 🇺🇦 Kaiukov")
  userPhotoUrl: string | null;
  userInitials: string;
  userBio: string;
  isAvailable: boolean;
  colorScheme: 'light' | 'dark';
}

export function useTelegramUser(): TelegramUserData {
  const [userData, setUserData] = useState<TelegramUserData>({
    user: null,
    userName: 'Guest',
    userFullName: 'Guest',
    userPhotoUrl: null,
    userInitials: 'G',
    userBio: '',
    isAvailable: false,
    colorScheme: 'dark',
  });

  useEffect(() => {
    // Check if Telegram WebApp is available
    const isAvailable = telegramService.isAvailable();

    if (isAvailable) {
      const user = telegramService.getUser();
      const userName = telegramService.getUserName();
      let userPhotoUrl = telegramService.getUserPhotoUrl();
      const userInitials = telegramService.getUserInitials();
      const colorScheme = telegramService.getColorScheme();
      const userBio = telegramService.getUserBio() || '';

      // Set initial data
      setUserData({
        user,
        userName,
        userFullName: userName, // Initially use username, will be updated from backend
        userPhotoUrl,
        userInitials,
        userBio,
        isAvailable,
        colorScheme,
      });

      console.log('🔍 Telegram User Data:', {
        user,
        userName,
        userPhotoUrl,
        userInitials,
        userBio,
        colorScheme,
        fullUserObject: user,
      });

      // Fetch additional user data from backend (bio via new sync service)
      // Only fetch if we have a valid Telegram user context
      if (user?.id && isAvailable) {
        console.log('📸 Fetching comprehensive user data from backend via sync service...');
        syncService.getTelegramUser().then((backendData) => {
          if (backendData?.success && backendData.userData) {
            const userData = backendData.userData;
            setUserData((prev) => ({
              ...prev,
              userName: userData.username || prev.userName,
              userFullName: userData.name || prev.userFullName,
              userBio: userData.bio || prev.userBio,
              userPhotoUrl: userData.avatar_url || prev.userPhotoUrl,
            }));
            console.log('✅ Updated user data from sync service:', {
              id: userData.id,
              username: userData.username,
              name: userData.name,
              bio: userData.bio,
              avatar_url: userData.avatar_url,
              language_code: userData.language_code,
            });
          }
        }).catch((error) => {
          console.error('❌ Failed to fetch user data from sync service:', error);
        });
      }
    } else {
      console.warn('Telegram WebApp not available. Running in browser mode.');
    }
  }, []);

  return userData;
}
