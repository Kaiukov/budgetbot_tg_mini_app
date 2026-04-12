/**
 * Sync API - Authentication Helpers
 * Cookie-based session auth for PWA. No localStorage tokens.
 */

const ANONYMOUS_KEY = import.meta.env.VITE_SYNC_API_KEY || '';

export interface AuthUserData {
  id: number;
  name: string;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  language_code?: string | null;
  bot_blocked?: boolean;
  isAuth?: boolean;
}

interface AuthMeResponse {
  success: boolean;
  userData?: AuthUserData;
  message?: string;
}

class AuthService {
  public getAnonymousKey(): string {
    return ANONYMOUS_KEY;
  }

  /**
   * Check if user is authenticated by calling a lightweight endpoint
   * with credentials: include (sends HttpOnly cookie).
   */
  public async isAuthenticated(): Promise<boolean> {
    try {
      return !!(await this.getCurrentUser());
    } catch {
      return false;
    }
  }

  public async getCurrentUser(): Promise<AuthUserData | null> {
    const baseUrl = this.resolveBaseUrl();
    try {
      const resp = await fetch(`${baseUrl}/api/v1/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: this.baseHeaders(),
      });

      if (!resp.ok) {
        return null;
      }

      const data = (await resp.json()) as AuthMeResponse;
      if (!data.success || !data.userData) {
        return null;
      }

      return data.userData;
    } catch {
      return null;
    }
  }

  /**
   * Login via Telegram Login Widget callback data.
   * Sends widget payload to backend, backend sets HttpOnly cookie.
   * Returns user data on success, null on failure.
   */
  public async loginWithWidget(widgetData: Record<string, string>): Promise<{
    success: boolean;
    userData?: any;
    message?: string;
  } | null> {
    const baseUrl = this.resolveBaseUrl();
    try {
      const resp = await fetch(`${baseUrl}/api/v1/auth/telegram/session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...this.baseHeaders(),
          'X-Telegram-Login': JSON.stringify(widgetData),
        },
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        return { success: false, message: data.message || 'Login failed' };
      }
      return { success: true, userData: data.userData };
    } catch (error) {
      console.error('Login request failed:', error);
      return null;
    }
  }

  /**
   * Logout — calls backend to revoke session and clear cookie.
   */
  public async logout(): Promise<void> {
    const baseUrl = this.resolveBaseUrl();
    try {
      await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: this.baseHeaders(),
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
  }

  /**
   * Build standard headers for API requests.
   * Session is carried by HttpOnly cookie — no token in headers.
   */
  public getAuthHeaders(): Record<string, string> {
    return this.baseHeaders();
  }

  /**
   * Resolve base URL based on environment.
   */
  public resolveBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL || '';
  }

  private baseHeaders(): Record<string, string> {
    return {
      'X-Anonymous-Key': ANONYMOUS_KEY,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }
}

export const authService = new AuthService();
