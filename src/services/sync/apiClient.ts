/**
 * Unified HTTP Client for Firefly API
 * Implements Firefly 3-tier authentication system:
 * - Tier 2: Anonymous Authorized (Telegram Mini App users with initData)
 * - Tier 1: Service Role (Backend services with Bearer token)
 * - Tier 3: Anonymous Read-Only (Public access, read-only)
 */

type AuthTier = 'tier1' | 'tier2' | 'tier3';

interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  auth?: AuthTier;
  timeout?: number;
}

interface ApiError {
  status: number;
  statusText: string;
  message: string;
  body?: string;
}

export class ApiClient {
  private baseUrl: string;
  private syncApiKey: string | null = null;           // X-Anonymous-Key
  private fireflyToken: string | null = null;         // Tier 1 Bearer token
  private readonly DEFAULT_TIMEOUT_MS = 30000;

  constructor() {
    this.syncApiKey = import.meta.env.VITE_SYNC_API_KEY || null;
    this.fireflyToken = import.meta.env.VITE_FIREFLY_TOKEN || null;

    // Resolve base URL
    this.baseUrl = this.resolveBaseUrl();

    console.log('🔌 ApiClient initialized:', {
      environment: this.baseUrl ? 'production' : 'development (proxy)',
      baseUrl: this.baseUrl || '(using Vite proxy)',
      hasSyncApiKey: !!this.syncApiKey,
      hasFireflyToken: !!this.fireflyToken
    });
  }

  /**
   * Resolve base URL based on environment
   * - Development: Empty string (uses Vite proxy at /api)
   * - Production: Direct URL from env or hostname detection
   */
  private resolveBaseUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const isProduction =
      window.location.hostname.includes('workers.dev') ||
      window.location.hostname.includes('pages.dev');

    if (isProduction) {
      return import.meta.env.VITE_API_BASE_URL || 'https://dev.neon-chuckwalla.ts.net';
    }

    return ''; // Development: use Vite proxy
  }

  /**
   * Build Tier 2 headers: Anonymous Authorized (Telegram Mini App users)
   * Requires: X-Anonymous-Key + X-Telegram-Init-Data
   */
  private async buildTier2Headers(): Promise<Record<string, string>> {
    if (!this.syncApiKey) {
      throw new Error('Sync API key not configured for Tier 2 authentication');
    }

    // Dynamically import to avoid circular deps
    const { default: telegramService } = await import('../telegram');
    const initData = telegramService.getInitData();

    return {
      'X-Anonymous-Key': this.syncApiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(initData && { 'X-Telegram-Init-Data': initData }),
    };
  }

  /**
   * Build Tier 1 headers: Service Role (Backend services)
   * Requires: Authorization (Bearer) + X-Anonymous-Key
   */
  private buildTier1Headers(): Record<string, string> {
    if (!this.fireflyToken || !this.syncApiKey) {
      throw new Error('Firefly token and Sync API key required for Tier 1 authentication');
    }

    return {
      'Authorization': `Bearer ${this.fireflyToken}`,
      'X-Anonymous-Key': this.syncApiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Build Tier 3 headers: Anonymous Read-Only (Public access)
   * Requires: X-Anonymous-Key only
   */
  private buildTier3Headers(): Record<string, string> {
    if (!this.syncApiKey) {
      throw new Error('Sync API key not configured for Tier 3 authentication');
    }

    return {
      'X-Anonymous-Key': this.syncApiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Build headers based on authentication tier
   */
  private async buildHeaders(tier: AuthTier = 'tier2'): Promise<Record<string, string>> {
    switch (tier) {
      case 'tier1':
        return this.buildTier1Headers();
      case 'tier2':
        return this.buildTier2Headers();
      case 'tier3':
        return this.buildTier3Headers();
      default:
        throw new Error(`Unknown auth tier: ${tier}`);
    }
  }

  /**
   * Execute HTTP request with timeout
   */
  private async executeRequest<T>(
    url: string,
    config: RequestInit,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        const error: ApiError = {
          status: response.status,
          statusText: response.statusText,
          message: `API request failed: ${response.status} ${response.statusText}`,
          body: errorBody,
        };
        throw error;
      }

      const data = await response.json() as T;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Redact sensitive information from logs
   */
  private redactSecretsInLogs(msg: string): string {
    if (!msg) return msg;

    return msg
      .replace(new RegExp(this.syncApiKey || 'NOMATCH', 'g'), '***SYNC_KEY***')
      .replace(new RegExp(this.fireflyToken || 'NOMATCH', 'g'), '***FIREFLY_TOKEN***');
  }

  /**
   * Main request method - unified entry point for all API calls
   */
  public async request<T>(
    path: string,
    options?: ApiClientOptions
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      auth = 'tier2',
      timeout = this.DEFAULT_TIMEOUT_MS,
    } = options || {};

    const url = `${this.baseUrl}${path}`;

    try {
      // Build headers based on auth tier
      const headers = await this.buildHeaders(auth);

      // Log request (redacted)
      console.log('📤 API Request:', {
        method,
        url: url.replace(/https?:\/\/[^/]+/, ''), // Hide domain in logs
        auth,
        hasBody: !!body,
      });

      // Prepare request config
      const config: RequestInit = {
        method,
        headers,
        ...(method !== 'GET' && body && {
          body: JSON.stringify(body),
        }),
      };

      // Execute request with timeout
      const data = await this.executeRequest<T>(url, config, timeout);

      console.log('📥 API Response:', {
        method,
        status: 200,
        path: path.replace(/https?:\/\/[^/]+/, ''),
      });

      return data;
    } catch (error) {
      const err = error as any;

      // Handle abort errors (timeout)
      if (err.name === 'AbortError') {
        console.error('⏱️ API Request Timeout:', {
          method,
          url,
          timeout,
        });
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      // Handle API errors
      if (err.status !== undefined) {
        console.error('❌ API Error:', {
          method,
          url,
          status: err.status,
          statusText: err.statusText,
          message: this.redactSecretsInLogs(err.message),
        });
        throw err;
      }

      // Handle other errors
      console.error('💥 API Request Error:', {
        method,
        url,
        error: this.redactSecretsInLogs(err.message || String(err)),
      });

      throw error;
    }
  }

  /**
   * Convenience methods for common operations
   */
  public get<T>(path: string, timeout?: number): Promise<T> {
    return this.request<T>(path, { method: 'GET', timeout });
  }

  public post<T>(path: string, body?: any, timeout?: number): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, timeout });
  }

  public put<T>(path: string, body?: any, timeout?: number): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body, timeout });
  }

  public delete<T>(path: string, timeout?: number): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', timeout });
  }

  /**
   * Get base URL (for external use if needed)
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Check if API is properly configured
   */
  public isConfigured(): boolean {
    return !!this.syncApiKey;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
