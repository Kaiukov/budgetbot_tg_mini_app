/**
 * Telegram WebApp Service
 * Provides utilities for interacting with Telegram Mini App API
 */

import type { TelegramWebApp, TelegramWebAppUser } from '../types/telegram';

class TelegramService {
  private webApp: TelegramWebApp | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Telegram WebApp
   */
  private initialize(): void {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      this.webApp.ready();
      this.webApp.expand();
    }
  }

  /**
   * Check if running inside Telegram
   */
  public isAvailable(): boolean {
    return this.webApp !== null;
  }

  /**
   * Get Telegram WebApp instance
   */
  public getWebApp(): TelegramWebApp | null {
    return this.webApp;
  }

  /**
   * Get current user data
   */
  public getUser(): TelegramWebAppUser | null {
    return this.webApp?.initDataUnsafe?.user || null;
  }

  /**
   * Get user's Telegram username (or full name as fallback)
   */
  public getUserName(): string {
    const user = this.getUser();
    if (!user) return 'Guest';

    // Use Telegram username first (matches backend format)
    return user.username || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User';
  }

  /**
   * Get user's profile photo URL
   */
  public getUserPhotoUrl(): string | null {
    const user = this.getUser();
    if (!user) return null;

    // Telegram provides photo_url in initDataUnsafe
    return user.photo_url || null;
  }

  /**
   * Get user's profile bio/description
   */
  public getUserBio(): string | null {
    // Note: Telegram WebApp doesn't provide bio directly
    // We'll need to fetch it from the bot API or use a default
    return null;
  }

  /**
   * Get user's initials for avatar fallback
   */
  public getUserInitials(): string {
    const user = this.getUser();
    if (!user) return 'G';

    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';

    return (firstInitial + lastInitial).toUpperCase() || user.username?.[0]?.toUpperCase() || 'U';
  }

  /**
   * Get theme color scheme
   */
  public getColorScheme(): 'light' | 'dark' {
    return this.webApp?.colorScheme || 'dark';
  }

  /**
   * Get theme parameters
   */
  public getThemeParams() {
    return this.webApp?.themeParams || {};
  }

  /**
   * Show main button
   */
  public showMainButton(text: string, onClick: () => void): void {
    if (!this.webApp) return;

    this.webApp.MainButton.setText(text);
    this.webApp.MainButton.onClick(onClick);
    this.webApp.MainButton.show();
  }

  /**
   * Hide main button
   */
  public hideMainButton(): void {
    this.webApp?.MainButton.hide();
  }

  /**
   * Show back button
   */
  public showBackButton(onClick: () => void): void {
    if (!this.webApp) return;

    this.webApp.BackButton.onClick(onClick);
    this.webApp.BackButton.show();
  }

  /**
   * Hide back button
   */
  public hideBackButton(): void {
    this.webApp?.BackButton.hide();
  }

  /**
   * Trigger haptic feedback
   */
  public hapticFeedback(type: 'impact' | 'notification' | 'selection', style?: string): void {
    if (!this.webApp) return;

    switch (type) {
      case 'impact':
        this.webApp.HapticFeedback.impactOccurred(style as any || 'medium');
        break;
      case 'notification':
        this.webApp.HapticFeedback.notificationOccurred(style as any || 'success');
        break;
      case 'selection':
        this.webApp.HapticFeedback.selectionChanged();
        break;
    }
  }

  /**
   * Close the mini app
   */
  public close(): void {
    this.webApp?.close();
  }

  /**
   * Send data to bot
   */
  public sendData(data: any): void {
    if (!this.webApp) return;
    this.webApp.sendData(JSON.stringify(data));
  }

  /**
   * Open Telegram link
   */
  public openTelegramLink(url: string): void {
    this.webApp?.openTelegramLink(url);
  }

  /**
   * Open external link
   */
  public openLink(url: string): void {
    this.webApp?.openLink(url);
  }
}

// Export singleton instance
export const telegramService = new TelegramService();
export default telegramService;
