/**
 * Telegram WebApp Service
 * Provides utilities for interacting with Telegram Mini App API
 * when running inside Telegram. No fake data or browser debug auth.
 */

import type { TelegramWebApp, TelegramWebAppUser } from '../../types/telegram';

class TelegramService {
  private webApp: TelegramWebApp | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      this.webApp.ready();
      this.webApp.expand();
    }
  }

  /**
   * Check if running inside Telegram Mini App
   */
  public isAvailable(): boolean {
    return this.webApp !== null;
  }

  /**
   * Check if running as a standalone PWA (not inside Telegram)
   */
  public isStandalone(): boolean {
    return this.webApp === null;
  }

  public getWebApp(): TelegramWebApp | null {
    return this.webApp;
  }

  public getUser(): TelegramWebAppUser | null {
    return this.webApp?.initDataUnsafe?.user || null;
  }

  public getInitData(): string {
    return this.webApp?.initData || '';
  }

  public getUserName(): string {
    const user = this.getUser();
    if (!user) return 'Guest';
    return user.username || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User';
  }

  public getUserPhotoUrl(): string | null {
    const user = this.getUser();
    if (!user) return null;
    return user.photo_url || null;
  }

  public getUserBio(): string | null {
    return null;
  }

  public getUserInitials(): string {
    const user = this.getUser();
    if (!user) return 'G';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || user.username?.[0]?.toUpperCase() || 'U';
  }

  public getColorScheme(): 'light' | 'dark' {
    return this.webApp?.colorScheme || 'dark';
  }

  public getThemeParams() {
    return this.webApp?.themeParams || {};
  }

  public showMainButton(text: string, onClick: () => void): void {
    if (!this.webApp) return;
    this.webApp.MainButton.setText(text);
    this.webApp.MainButton.onClick(onClick);
    this.webApp.MainButton.show();
  }

  public hideMainButton(): void {
    this.webApp?.MainButton.hide();
  }

  public showBackButton(onClick: () => void): void {
    if (!this.webApp) return;
    this.webApp.BackButton.onClick(onClick);
    this.webApp.BackButton.show();
  }

  public hideBackButton(): void {
    this.webApp?.BackButton.hide();
  }

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

  public close(): void {
    this.webApp?.close();
  }

  public disableVerticalSwipes(): void {
    if (!this.webApp) return;
    const disableVerticalSwipes = (this.webApp as any).disableVerticalSwipes;
    if (typeof disableVerticalSwipes === 'function') {
      disableVerticalSwipes();
      return;
    }
    const swipeBehavior = (this.webApp as any).swipeBehavior;
    if (swipeBehavior && typeof swipeBehavior.disableVertical === 'function') {
      swipeBehavior.disableVertical();
    }
  }

  public enableVerticalSwipes(): void {
    if (!this.webApp) return;
    const enableVerticalSwipes = (this.webApp as any).enableVerticalSwipes;
    if (typeof enableVerticalSwipes === 'function') {
      enableVerticalSwipes();
      return;
    }
    const swipeBehavior = (this.webApp as any).swipeBehavior;
    if (swipeBehavior && typeof swipeBehavior.enableVertical === 'function') {
      swipeBehavior.enableVertical();
    }
  }

  public isVerticalSwipesEnabled(): boolean {
    if (!this.webApp) return false;
    const isVerticalSwipesEnabled = (this.webApp as any).isVerticalSwipesEnabled;
    if (typeof isVerticalSwipesEnabled === 'function') {
      return isVerticalSwipesEnabled();
    }
    const swipeBehavior = (this.webApp as any).swipeBehavior;
    if (swipeBehavior && typeof swipeBehavior.isVerticalEnabled === 'function') {
      return swipeBehavior.isVerticalEnabled();
    }
    return true;
  }

  public sendData(data: any): void {
    if (!this.webApp) return;
    this.webApp.sendData(JSON.stringify(data));
  }

  public openTelegramLink(url: string): void {
    this.webApp?.openTelegramLink(url);
  }

  public openLink(url: string): void {
    this.webApp?.openLink(url);
  }

  public showAlert(message: string, callback?: () => void): void {
    if (!this.webApp) return;
    this.webApp.showAlert(message, callback);
  }

  public showConfirm(message: string, callback?: (confirmed: boolean) => void): void {
    if (!this.webApp) return;
    this.webApp.showConfirm(message, callback);
  }

  public isReady(): boolean {
    if (!this.webApp) return false;
    return !!(this.webApp.initData && this.webApp.initDataUnsafe);
  }

  public getConnectionStatus(): string {
    if (!this.webApp) {
      return 'Standalone PWA mode';
    }
    if (this.isReady()) {
      return 'Connected to Telegram';
    }
    return 'Telegram initialization pending';
  }
}

export const telegramService = new TelegramService();
export default telegramService;
