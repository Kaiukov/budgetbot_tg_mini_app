/**
 * Sync API - Cache Manager
 * Provides unified cache management for Sync API operations
 * Consolidates account, category, balance, and exchange rate caches
 */

import { Cache } from '../../utils/cache';

// ============================================================================
// Cache Configuration
// ============================================================================

const CACHE_CONFIG = {
  ACCOUNT_TTL_MS: 300000,      // 5 minutes
  CATEGORY_TTL_MS: 300000,     // 5 minutes
  BALANCE_TTL_MS: 300000,      // 5 minutes
  EXCHANGE_RATE_TTL_MS: 3600000, // 1 hour
} as const;

// ============================================================================
// Cache Manager
// ============================================================================

class CacheManager {
  /**
   * Get cache expiry time for given cache type
   */
  public static getExpiry(cacheType: 'account' | 'category' | 'balance' | 'exchangeRate'): number {
    switch (cacheType) {
      case 'account':
        return CACHE_CONFIG.ACCOUNT_TTL_MS;
      case 'category':
        return CACHE_CONFIG.CATEGORY_TTL_MS;
      case 'balance':
        return CACHE_CONFIG.BALANCE_TTL_MS;
      case 'exchangeRate':
        return CACHE_CONFIG.EXCHANGE_RATE_TTL_MS;
      default:
        return CACHE_CONFIG.ACCOUNT_TTL_MS;
    }
  }

  /**
   * Create a typed cache instance
   */
  public static createCache<T>(cacheType: 'account' | 'category' | 'balance' | 'exchangeRate', prefix: string): Cache<T> {
    const ttl = this.getExpiry(cacheType);
    return new Cache<T>(ttl, prefix);
  }

  /**
   * Format cache duration for logging
   */
  public static formatCacheDuration(ttlMs: number): string {
    if (ttlMs < 60000) {
      return `${Math.round(ttlMs / 1000)}s`;
    } else if (ttlMs < 3600000) {
      return `${Math.round(ttlMs / 60000)}min`;
    } else {
      return `${Math.round(ttlMs / 3600000)}h`;
    }
  }

  /**
   * Get cache statistics for debugging
   */
  public static getCacheStats(): {
    accountTTL: string;
    categoryTTL: string;
    balanceTTL: string;
    exchangeRateTTL: string;
  } {
    return {
      accountTTL: this.formatCacheDuration(CACHE_CONFIG.ACCOUNT_TTL_MS),
      categoryTTL: this.formatCacheDuration(CACHE_CONFIG.CATEGORY_TTL_MS),
      balanceTTL: this.formatCacheDuration(CACHE_CONFIG.BALANCE_TTL_MS),
      exchangeRateTTL: this.formatCacheDuration(CACHE_CONFIG.EXCHANGE_RATE_TTL_MS),
    };
  }

  /**
   * Log cache statistics
   */
  public static logCacheConfig(): void {
    const stats = this.getCacheStats();
    console.log('💾 Cache Configuration:', stats);
  }
}

// ============================================================================
// Exchange Rate Cache (Memory + LocalStorage)
// ============================================================================

export interface ExchangeRateCache {
  rate: number;
  timestamp: number;
}

class ExchangeRateCacheManager {
  private memoryCache: Map<string, ExchangeRateCache> = new Map();
  private readonly CACHE_KEY_PREFIX = 'exchange_rate_';
  private readonly CACHE_EXPIRY_MS = CACHE_CONFIG.EXCHANGE_RATE_TTL_MS;

  /**
   * Generate cache key for exchange rate pair
   */
  private generateCacheKey(from: string, to: string): string {
    return `${from.toUpperCase()}:${to.toUpperCase()}`;
  }

  /**
   * Get exchange rate from cache (memory first, then localStorage)
   */
  public get(from: string, to: string): number | null {
    const cacheKey = this.generateCacheKey(from, to);
    const now = Date.now();

    // Check memory cache first
    const memoryCache = this.memoryCache.get(cacheKey);
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
          this.memoryCache.set(cacheKey, data);
          return data.rate;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(storageKey);
          this.memoryCache.delete(cacheKey);
          console.log('💾 Exchange rate cache EXPIRED:', { from, to });
        }
      }
    } catch (error) {
      console.warn('⚠️ Error reading exchange rate from localStorage:', error);
    }

    return null;
  }

  /**
   * Set exchange rate in cache (memory + localStorage)
   */
  public set(from: string, to: string, rate: number): void {
    const cacheKey = this.generateCacheKey(from, to);
    const cacheData: ExchangeRateCache = {
      rate,
      timestamp: Date.now()
    };

    // Store in memory cache
    this.memoryCache.set(cacheKey, cacheData);

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
   * Clear all exchange rate caches
   */
  public clear(): void {
    console.log('🗑️ Clearing exchange rate caches');
    this.memoryCache.clear();

    // Also clear localStorage caches
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('⚠️ Error clearing localStorage:', error);
    }
  }
}

// Export singleton instances and utilities
export const cacheManager = CacheManager;
export const exchangeRateCacheManager = new ExchangeRateCacheManager();
