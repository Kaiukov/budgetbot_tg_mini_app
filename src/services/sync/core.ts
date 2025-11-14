/**
 * Sync API Service - Core
 * Base configuration and API request logic
 */

import type { ExchangeRateCache } from './types';

export class SyncServiceCore {
  protected baseUrl: string;
  protected anonKey: string | null = null;
  protected exchangeRateCache: Map<string, ExchangeRateCache> = new Map();
  protected readonly CACHE_EXPIRY_MS = 3600000; // 1 hour in milliseconds
  protected readonly CACHE_KEY_PREFIX = 'exchange_rate_';

  constructor() {
    // Detect environment
    const isProduction = typeof window !== 'undefined' &&
      (window.location.hostname.includes('workers.dev') ||
       window.location.hostname.includes('pages.dev'));

    // In production: call backend directly (middleware not working)
    // In development: use Vite proxy (empty baseUrl)
    this.baseUrl = isProduction ? 'https://dev.neon-chuckwalla.ts.net' : '';

    this.anonKey = import.meta.env.VITE_SYNC_API_KEY || null;

    console.log('🔧 Sync Service Config:', {
      environment: isProduction ? 'production' : 'development',
      baseUrl: this.baseUrl || '(using proxy)',
      hasApiKey: !!this.anonKey
    });
  }

  /**
   * Generate cache key for exchange rate pair
   */
  protected generateCacheKey(from: string, to: string): string {
    return `${from.toUpperCase()}:${to.toUpperCase()}`;
  }

  /**
   * Get exchange rate from cache (memory + localStorage)
   * Returns null if cache is expired or doesn't exist
   */
  protected getExchangeRateFromCache(from: string, to: string): number | null {
    const cacheKey = this.generateCacheKey(from, to);
    const now = Date.now();

    // Check memory cache first
    const memoryCache = this.exchangeRateCache.get(cacheKey);
    if (memoryCache && (now - memoryCache.timestamp) < this.CACHE_EXPIRY_MS) {
      console.log('💾 Exchange rate cache HIT (memory):', { from, to, rate: memoryCache.rate });
      return memoryCache.rate;
    }

    // Check localStorage as fallback
    try {
      const storageKey = `${this.CACHE_KEY_PREFIX}${cacheKey}`;
      const cached = localStorage.getItem(storageKey);

      if (cached) {
        const data = JSON.parse(cached) as ExchangeRateCache;

        if ((now - data.timestamp) < this.CACHE_EXPIRY_MS) {
          console.log('💾 Exchange rate cache HIT (localStorage):', { from, to, rate: data.rate });
          // Restore to memory cache for faster access
          this.exchangeRateCache.set(cacheKey, data);
          return data.rate;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(storageKey);
          this.exchangeRateCache.delete(cacheKey);
          console.log('💾 Exchange rate cache EXPIRED:', { from, to });
        }
      }
    } catch (error) {
      console.warn('⚠️ Error reading exchange rate from localStorage:', error);
    }

    return null;
  }

  /**
   * Save exchange rate to cache (memory + localStorage)
   */
  protected setExchangeRateCache(from: string, to: string, rate: number): void {
    const cacheKey = this.generateCacheKey(from, to);
    const cacheData: ExchangeRateCache = {
      rate,
      timestamp: Date.now()
    };

    // Store in memory cache
    this.exchangeRateCache.set(cacheKey, cacheData);

    // Store in localStorage for persistence
    try {
      const storageKey = `${this.CACHE_KEY_PREFIX}${cacheKey}`;
      localStorage.setItem(storageKey, JSON.stringify(cacheData));
      console.log('💾 Exchange rate cached:', { from, to, rate, expiresIn: '1h' });
    } catch (error) {
      console.warn('⚠️ Error saving exchange rate to localStorage:', error);
    }
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
   */
  protected async makeRequest<T>(endpoint: string, options?: { method?: string; body?: Record<string, unknown> }): Promise<T> {
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
      const response = await fetch(url, {
        method,
        headers: {
          'X-Anonymous-Key': anonKey,
          ...(method === 'POST' && { 'X-Telegram-Init-Data': initData }),
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Only include body for POST requests (GET cannot have body)
        ...(method === 'POST' && {
          body: JSON.stringify(options?.body || {})
        }),
      });

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
