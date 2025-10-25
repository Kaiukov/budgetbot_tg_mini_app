/**
 * React Hook for Telegram User Data
 * Provides easy access to Telegram user information in React components
 */

import { useState, useEffect } from 'react';
import telegramService from '../services/telegram';
import type { TelegramWebAppUser } from '../types/telegram';
import { fetchUserData } from '../utils/fetchUserPhoto';

export interface TelegramUserData {
  user: TelegramWebAppUser | null;
  userName: string;
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
    userPhotoUrl: null,
    userInitials: 'G',
    userBio: 'Manage finances and create reports',
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
      const userBio = telegramService.getUserBio() || 'Manage finances and create reports';

      // Set initial data
      setUserData({
        user,
        userName,
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

      // Fetch additional user data from backend (photo and bio)
      if (user?.id) {
        console.log('📸 Fetching user data from backend...');
        fetchUserData(user.id).then((backendData) => {
          if (backendData?.success) {
            setUserData((prev) => ({
              ...prev,
              userPhotoUrl: backendData.photo_url || prev.userPhotoUrl,
              userBio: backendData.bio || prev.userBio,
            }));
            console.log('✅ Updated user data from backend');
          }
        });
      }
    } else {
      console.warn('Telegram WebApp not available. Running in browser mode.');
    }
  }, []);

  return userData;
}
