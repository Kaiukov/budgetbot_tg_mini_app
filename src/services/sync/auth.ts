/**
 * Sync API - Authentication Helpers (Tier 2 - Anonymous Authorized)
 * Provides utilities for managing Telegram Mini App authentication
 * Tier 2: Anonymous Authorized - X-Anonymous-Key + X-Telegram-Init-Data
 */

// ============================================================================
// Authentication Service
// ============================================================================

class AuthService {
  /**
   * Get Tier 2 authentication headers
   * Tier 2: Anonymous Authorized (Telegram Mini App users)
   * Requires both X-Anonymous-Key and X-Telegram-Init-Data
   */
  public getTier2Headers(): Record<string, string> {
    const anonymousKey = import.meta.env.VITE_ANONYMOUS_KEY;
    const initData = window.Telegram?.WebApp?.initData;

    if (!anonymousKey) {
      console.warn('⚠️ VITE_ANONYMOUS_KEY not configured');
    }

    if (!initData) {
      console.warn('⚠️ Telegram initData not available');
    }

    return {
      'X-Anonymous-Key': anonymousKey || '',
      'X-Telegram-Init-Data': initData || '',
    };
  }

  /**
   * Check if user is authenticated (Tier 2 auth available)
   * Returns true if both anonymous key and init data are available
   */
  public isAuthenticated(): boolean {
    const anonymousKey = import.meta.env.VITE_ANONYMOUS_KEY;
    const initData = window.Telegram?.WebApp?.initData;

    return !!(anonymousKey && initData);
  }

  /**
   * Get authentication configuration
   * Returns the key and initData required for API requests
   */
  public getAuthConfig(): { key: string; initData: string } {
    const anonymousKey = import.meta.env.VITE_ANONYMOUS_KEY || '';
    const initData = window.Telegram?.WebApp?.initData || '';

    return {
      key: anonymousKey,
      initData,
    };
  }

  /**
   * Validate Tier 2 auth headers
   * Checks if headers are properly formatted and contain required values
   */
  public isValidTier2Headers(headers: Record<string, string>): boolean {
    return !!(
      headers['X-Anonymous-Key'] &&
      headers['X-Telegram-Init-Data']
    );
  }

  /**
   * Log authentication state (useful for debugging)
   */
  public logAuthState(): void {
    const isAuth = this.isAuthenticated();
    const config = this.getAuthConfig();

    console.log('🔐 Authentication State:', {
      isAuthenticated: isAuth,
      hasAnonymousKey: !!config.key,
      hasInitData: !!config.initData,
      initDataLength: config.initData.length,
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
