/**
 * Sync API Service - Core
 * Base configuration and API request logic
 */

import { DualLayerCache } from '../../utils/cache';

export class SyncServiceCore {
  protected baseUrl: string;
  protected anonKey: string | null = null;
  protected exchangeRateCache = new DualLayerCache<number>({
    ttl: 3600000, // 1 hour in milliseconds
    prefix: 'exchange_rate_'
  });

  constructor() {
    // Detect environment
    // Only Cloudflare deployments (workers.dev/pages.dev) are true production
    // Tailscale domains and localhost should use Vite proxy to avoid CORS issues
    const isProduction = typeof window !== 'undefined' &&
      (window.location.hostname.includes('workers.dev') ||
       window.location.hostname.includes('pages.dev'));

    // In production (Cloudflare): call backend directly
    // In development (localhost/Tailscale): ALWAYS use Vite proxy (empty baseUrl)
    // This ensures proper CORS handling and authentication flow
    this.baseUrl = isProduction ? import.meta.env.VITE_BASE_URL || '' : '';

    this.anonKey = import.meta.env.VITE_SYNC_API_KEY || null;

    console.log('🔧 Sync Service Config:', {
      environment: isProduction ? 'production' : 'development',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      baseUrl: this.baseUrl || '(using proxy)',
      hasApiKey: !!this.anonKey
    });
  }

  /**
   * Get exchange rate from cache (memory + localStorage fallback)
   * Normalized cache key format: "FROM:TO" (e.g., "USD:EUR")
   */
  protected getExchangeRateFromCache(from: string, to: string): number | null {
    const cacheKey = `${from}:${to}`;
    return this.exchangeRateCache.get(cacheKey);
  }

  /**
   * Save exchange rate to cache (both memory and localStorage)
   */
  protected setExchangeRateCache(from: string, to: string, rate: number): void {
    const cacheKey = `${from}:${to}`;
    this.exchangeRateCache.set(cacheKey, rate);
  }

  /**
   * Get current anonymous API key
   */
  public getAnonKey(): string | null {
    return this.anonKey;
  }

  /**
   * Get base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Check if service is configured
   */
  public isConfigured(): boolean {
    // baseUrl is always empty (using proxy routing in both dev and prod)
    // so we only need to check for anonKey
    return !!this.anonKey;
  }

  /**
   * Make API request to Sync API with anonymous key authentication
   * Supports all HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD)
   * Automatically injects X-Anonymous-Key and X-Telegram-Init-Data headers
   */
  protected async makeRequest<T>(
    endpoint: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
      body?: Record<string, unknown>;
    }
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const anonKey = this.getAnonKey();

    if (!anonKey) {
      throw new Error('Sync anonymous API key not configured');
    }

    // Get Telegram initData for authentication
    const { default: telegramService } = await import('../telegram');
    const initData = telegramService.getInitData();

    const method = options?.method || 'GET';

    console.log('🔄 Sync API Request:', {
      url,
      method,
      hasAnonKey: !!anonKey,
      hasInitData: !!initData
    });

    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          'X-Anonymous-Key': anonKey,
          // Include Telegram initData for all methods to enable Tier 2 (authenticated) access
          ...(initData && { 'X-Telegram-Init-Data': initData }),
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      };

      // Include body for methods that support it (POST, PUT, PATCH, DELETE)
      if (options?.body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        requestOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, requestOptions);

      console.log('📡 Sync API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Sync API Error Response:', errorText);
        throw new Error(`Sync API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as T;
      const apiResponse = data as Record<string, unknown>;
      console.log('✅ Sync API Success:', { totalAccounts: apiResponse.total });
      return data;
    } catch (error) {
      console.error('💥 Sync API Fetch Error:', error);
      throw error;
    }
  }

  /**
   * Check Sync API connection
   */
  public async checkConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Sync API key not configured',
        };
      }

      // Will be implemented by subclass
      return {
        success: false,
        message: 'Not implemented in core',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
