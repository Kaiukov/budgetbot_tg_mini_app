/**
 * Sync API - Authentication Helpers
 * Cookie-based session auth for PWA. No localStorage tokens.
 */

import { resolveApiBaseUrl } from '../../config/runtime';

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

interface CodeRedeemResponse {
  success: boolean;
  userData?: AuthUserData;
  message?: string;
  sessionExpiresAt?: string | null;
}

class AuthService {
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
      console.info('[auth] auth/me start', { baseUrl });
      const resp = await fetch(`${baseUrl}/api/v1/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: this.requestHeaders(),
      });

      console.info('[auth] auth/me response', { baseUrl, status: resp.status });

      if (!resp.ok) {
        return null;
      }

      const data = (await resp.json()) as AuthMeResponse;
      if (!data.success || !data.userData) {
        console.info('[auth] auth/me unauthenticated', { baseUrl, message: data.message || null });
        return null;
      }

      console.info('[auth] auth/me authenticated', { baseUrl, userId: data.userData.id });
      return data.userData;
    } catch {
      console.info('[auth] auth/me network failure', { baseUrl });
      return null;
    }
  }

  /**
   * Redeem a short-lived login code issued by the Telegram bot.
   * The backend validates the code, creates the session, and sets the HttpOnly cookie.
   */
  public async redeemLoginCode(code: string): Promise<CodeRedeemResponse> {
    const baseUrl = this.resolveBaseUrl();
    try {
      console.info('[auth] code redeem start', {
        baseUrl,
        codeLength: code.trim().length,
      });
      const resp = await fetch(`${baseUrl}/api/v1/auth/code/redeem`, {
        method: 'POST',
        credentials: 'include',
        headers: this.requestHeaders(),
        body: JSON.stringify({ code }),
      });

      const data = (await resp.json()) as CodeRedeemResponse;
      console.info('[auth] code redeem response', {
        baseUrl,
        status: resp.status,
        success: Boolean(data?.success),
        message: data?.message || null,
      });
      if (!resp.ok || !data.success) {
        return {
          success: false,
          message: this.mapRedeemError(resp.status, data.message),
        };
      }
      return {
        success: true,
        userData: data.userData,
        message: data.message,
        sessionExpiresAt: data.sessionExpiresAt ?? null,
      };
    } catch (error) {
      console.error('Login code redemption failed:', error);
      const isNetworkError =
        error instanceof TypeError && /fetch|network|failed/i.test((error as Error).message);
      return {
        success: false,
        message: isNetworkError
          ? 'Network error: backend unreachable. Check your connection and try again.'
          : 'Login failed. Please try again.',
      };
    }
  }

  /**
   * Logout — calls backend to revoke session and clear cookie.
   */
  public async logout(): Promise<void> {
    const baseUrl = this.resolveBaseUrl();
    try {
      console.info('[auth] logout start', { baseUrl });
      const resp = await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: this.requestHeaders(),
      });
      await resp.text();
      console.info('[auth] logout response', { baseUrl, status: resp.status });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
  }

  /**
   * Map backend HTTP status codes to user-facing error messages.
   * Backend returns 400 for invalid codes, 401 for expired/reused, 429 for rate-limited.
   */
  private mapRedeemError(status: number, backendMessage?: string): string {
    if (status === 429) {
      return 'Too many attempts. Wait a few minutes and try again.';
    }
    if (status === 401) {
      // Distinguish expired vs already-used by message content
      const msg = (backendMessage || '').toLowerCase();
      if (msg.includes('expir')) {
        return 'This code has expired. Send /auth in Telegram to get a new one.';
      }
      if (msg.includes('already') || msg.includes('used') || msg.includes('redeemed')) {
        return 'This code was already used. Send /auth in Telegram to get a new one.';
      }
      return 'This code has expired or was already used. Send /auth in Telegram to get a new one.';
    }
    if (status === 400) {
      return 'Invalid code. Check the code from your Telegram message and try again.';
    }
    if (status >= 500) {
      return 'Server error. Please try again in a moment.';
    }
    return backendMessage || 'Login failed. Please try again.';
  }

  /**
   * Build standard headers for API requests.
   * Session is carried by HttpOnly cookie — no token in headers.
   */
  public getAuthHeaders(): Record<string, string> {
    return this.requestHeaders();
  }

  /**
   * Resolve base URL based on environment.
   */
  public resolveBaseUrl(): string {
    return resolveApiBaseUrl();
  }

  private requestHeaders(): Record<string, string> {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }
}

export const authService = new AuthService();
