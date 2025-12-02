/**
 * Telegram WebApp Service
 * Provides utilities for interacting with Telegram Mini App API
 */

import type { TelegramWebApp, TelegramWebAppUser } from '../types/telegram';
import { isBrowserMode, generateFakeInitData, generateFakeInitDataUnsafe } from '../utils/fakeInitData';

class TelegramService {
  private webApp: TelegramWebApp | null = null;
  private browserMode: boolean = false;
  private fakeInitData: string = '';
  private fakeInitDataUnsafe: any = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Telegram WebApp
   */
  private initialize(): void {
    this.browserMode = isBrowserMode();

    if (this.browserMode) {
      console.log('🔧 Browser debug mode enabled');
      this.fakeInitData = generateFakeInitData();
      this.fakeInitDataUnsafe = generateFakeInitDataUnsafe();

      // Create a mock WebApp object for browser mode
      this.webApp = {
        initData: this.fakeInitData,
        initDataUnsafe: this.fakeInitDataUnsafe,
        colorScheme: 'dark',
        themeParams: {},
        isExpanded: true,
        viewportHeight: window.innerHeight,
        viewportStableHeight: window.innerHeight,
        headerColor: '#000000',
        backgroundColor: '#000000',
        isClosingConfirmationEnabled: false,
        BackButton: {
          isVisible: false,
          onClick: () => {},
          offClick: () => {},
          show: () => {},
          hide: () => {},
        },
        MainButton: {
          text: '',
          color: '#000000',
          textColor: '#ffffff',
          isVisible: false,
          isActive: true,
          isProgressVisible: false,
          setText: () => {},
          onClick: () => {},
          offClick: () => {},
          show: () => {},
          hide: () => {},
          enable: () => {},
          disable: () => {},
          showProgress: () => {},
          hideProgress: () => {},
        },
        HapticFeedback: {
          impactOccurred: () => {},
          notificationOccurred: () => {},
          selectionChanged: () => {},
        },
        ready: () => console.log('🔧 Mock WebApp ready'),
        expand: () => console.log('🔧 Mock WebApp expand'),
        close: () => console.log('🔧 Mock WebApp close'),
        sendData: () => console.log('🔧 Mock WebApp sendData'),
        openLink: (url: string) => window.open(url, '_blank'),
        openTelegramLink: (url: string) => window.open(url, '_blank'),
        showAlert: (message: string, callback?: () => void) => {
          alert(message);
          callback?.();
        },
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => {
          const result = confirm(message);
          callback?.(result);
        },
      } as any;
    } else if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
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
   * Check if running in browser debug mode
   */
  public isBrowserMode(): boolean {
    return this.browserMode;
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
   * Get Telegram initData for backend authentication
   * This contains HMAC-signed data used to validate user identity
   */
  public getInitData(): string {
    return this.webApp?.initData || '';
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
   * Disable vertical swipes (prevent closing app by swiping)
   */
  public disableVerticalSwipes(): void {
    if (!this.webApp) return;

    // Try new SDK method first (if available)
    const disableVerticalSwipes = (this.webApp as any).disableVerticalSwipes;
    if (typeof disableVerticalSwipes === 'function') {
      disableVerticalSwipes();
      return;
    }

    // Fallback: disable swipe behavior via swipeBehavior object
    const swipeBehavior = (this.webApp as any).swipeBehavior;
    if (swipeBehavior && typeof swipeBehavior.disableVertical === 'function') {
      swipeBehavior.disableVertical();
    }
  }

  /**
   * Enable vertical swipes
   */
  public enableVerticalSwipes(): void {
    if (!this.webApp) return;

    // Try new SDK method first (if available)
    const enableVerticalSwipes = (this.webApp as any).enableVerticalSwipes;
    if (typeof enableVerticalSwipes === 'function') {
      enableVerticalSwipes();
      return;
    }

    // Fallback: enable swipe behavior via swipeBehavior object
    const swipeBehavior = (this.webApp as any).swipeBehavior;
    if (swipeBehavior && typeof swipeBehavior.enableVertical === 'function') {
      swipeBehavior.enableVertical();
    }
  }

  /**
   * Check if vertical swipes are enabled
   */
  public isVerticalSwipesEnabled(): boolean {
    if (!this.webApp) return false;

    // Try new SDK method first
    const isVerticalSwipesEnabled = (this.webApp as any).isVerticalSwipesEnabled;
    if (typeof isVerticalSwipesEnabled === 'function') {
      return isVerticalSwipesEnabled();
    }

    // Fallback: check via swipeBehavior object
    const swipeBehavior = (this.webApp as any).swipeBehavior;
    if (swipeBehavior && typeof swipeBehavior.isVerticalEnabled === 'function') {
      return swipeBehavior.isVerticalEnabled();
    }

    // Default to enabled if unable to determine
    return true;
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

  /**
   * Show alert dialog
   */
  public showAlert(message: string, callback?: () => void): void {
    if (!this.webApp) return;
    this.webApp.showAlert(message, callback);
  }

  /**
   * Show confirmation dialog
   */
  public showConfirm(message: string, callback?: (confirmed: boolean) => void): void {
    if (!this.webApp) return;
    this.webApp.showConfirm(message, callback);
  }

  /**
   * Check if Telegram WebApp is ready and connected
   */
  public isReady(): boolean {
    if (!this.webApp) return false;

    // Check if WebApp is properly initialized with required methods
    return !!(this.webApp.initData && this.webApp.initDataUnsafe);
  }

  /**
   * Get Telegram connection status message
   */
  public getConnectionStatus(): string {
    if (!this.webApp) {
      return 'Telegram WebApp not available';
    }

    if (this.isReady()) {
      return 'Connected to Telegram';
    }

    return 'Telegram initialization pending';
  }
}

// Export singleton instance
export const telegramService = new TelegramService();
export default telegramService;
