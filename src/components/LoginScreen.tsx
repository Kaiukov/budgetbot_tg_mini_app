/**
 * Login Screen — PWA entry point for unauthenticated users.
 * Renders the Telegram Login Widget and handles the auth callback.
 */

import React, { useEffect } from 'react';
import { renderLoginWidget, removeLoginWidget, TelegramWidgetUser } from '../services/telegram/loginWidget';
import { authService } from '../services/sync/auth';

interface LoginScreenProps {
  onLoginSuccess: (userData: any) => void;
  onLoginError?: (message: string) => void;
}

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'budgetbot';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onLoginError }) => {
  const containerId = 'telegram-login-widget';

  useEffect(() => {
    renderLoginWidget(containerId, BOT_USERNAME, async (user: TelegramWidgetUser) => {
      // Convert numeric string fields to string for the backend
      const widgetData: Record<string, string> = {
        id: String(user.id),
        first_name: user.first_name || '',
        auth_date: String(user.auth_date),
        hash: user.hash,
      };
      if (user.last_name) widgetData.last_name = user.last_name;
      if (user.username) widgetData.username = user.username;
      if (user.photo_url) widgetData.photo_url = user.photo_url;

      const result = await authService.loginWithWidget(widgetData);

      if (result?.success && result.userData) {
        onLoginSuccess(result.userData);
      } else {
        onLoginError?.(result?.message || 'Login failed');
      }
    });

    return () => {
      removeLoginWidget(containerId);
    };
  }, [onLoginSuccess, onLoginError]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2">BudgetBot</h1>
        <p className="text-gray-400 mb-8">Sign in with Telegram to manage your finances</p>

        <div id={containerId} className="flex justify-center mb-6" />

        <p className="text-xs text-gray-600 mt-4">
          Your Telegram account is used only for authentication.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
