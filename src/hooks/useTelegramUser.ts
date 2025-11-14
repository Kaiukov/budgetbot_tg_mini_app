/**
 * React Hook for Telegram User Data
 * Provides easy access to Telegram user information in React components
 */

import { useState, useEffect } from 'react';
import telegramService from '../services/telegram';
import type { TelegramWebAppUser } from '../types/telegram';
import { fetchUserData } from '../utils/fetchUserData';

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

      // Fetch additional user data from backend (full name, photo, bio, and username)
      if (user?.id) {
        console.log('📸 Fetching comprehensive user data from backend...');
        fetchUserData(user.id).then((backendData) => {
          if (backendData?.success && backendData.userData) {
            setUserData((prev) => ({
              ...prev,
              userName: backendData.userData.username || prev.userName,      // Username for API
              userFullName: backendData.userData.name || prev.userFullName,  // Full name for display
              userBio: backendData.userData.bio || prev.userBio,
            }));
            console.log('✅ Updated comprehensive user data from backend:', {
              username: backendData.userData.username,      // "Kaiukov"
              fullName: backendData.userData.name,          // "Oleksandr 🇺🇦 Kaiukov"
              avatar_url: backendData.userData.avatar_url,
              bio: backendData.userData.bio,
            });
          }
        }).catch((error) => {
          console.error('❌ Failed to fetch comprehensive user data:', error);
        });
      }
    } else {
      console.warn('Telegram WebApp not available. Running in browser mode.');
    }
  }, []);

  return userData;
}
