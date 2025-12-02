/**
 * Generic Cache Utility
 * Provides dual-layer caching (memory + localStorage) with configurable expiry
 * Used for exchange rates (1H) and categories (1Min)
 */

export interface CacheEntry<T> {
 data: T;
 timestamp: number;
}

const enableDebugLogs = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ENABLE_DEBUG_LOGS === 'true';
const debugLog = (...args: any[]) => {
  if (enableDebugLogs) {
    console.log(...args);
  }
};

/**
 * Safe JSON stringifier that handles Unicode surrogate pairs correctly
 * Prevents "no low surrogate in string" errors by sanitizing strings
 */
function safeJsonStringify(obj: any): string {
  // Custom replacer function to sanitize strings with potential surrogate pair issues
  const replacer = (_key: string, value: any): any => {
    if (typeof value === 'string') {
      // Replace any unpaired surrogates with Unicode replacement character (U+FFFD)
      return value
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '\uFFFD')  // unpaired high surrogate
        .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD'); // unpaired low surrogate
    }
    return value;
  };

  return JSON.stringify(obj, replacer);
}

export class Cache<T> {
  private memoryCache: Map<string, CacheEntry<T>> = new Map();
  private readonly expiryMs: number;
  private readonly storageKeyPrefix: string;

  /**
   * Create a new cache instance
   * @param expiryMs - Cache expiry time in milliseconds
   * @param storageKeyPrefix - Prefix for localStorage keys
   */
  constructor(expiryMs: number, storageKeyPrefix: string) {
    this.expiryMs = expiryMs;
    this.storageKeyPrefix = storageKeyPrefix;
  }

  /**
   * Get value from cache (memory first, then localStorage)
   * Returns null if cache miss or expired
   */
  get(key: string): T | null {
    const now = Date.now();

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && (now - memoryEntry.timestamp) < this.expiryMs) {
      debugLog(`💾 Cache HIT (memory): ${this.storageKeyPrefix}${key}`);
      return memoryEntry.data;
    }

    // Check localStorage as fallback
    try {
      const storageKey = `${this.storageKeyPrefix}${key}`;
      const cached = localStorage.getItem(storageKey);

      if (cached) {
        const entry = JSON.parse(cached) as CacheEntry<T>;

        if ((now - entry.timestamp) < this.expiryMs) {
          debugLog(`💾 Cache HIT (localStorage): ${this.storageKeyPrefix}${key}`);
          // Restore to memory cache for faster access
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(storageKey);
          this.memoryCache.delete(key);
          debugLog(`💾 Cache EXPIRED: ${this.storageKeyPrefix}${key}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error reading cache from localStorage:`, error);
    }

    debugLog(`💾 Cache MISS: ${this.storageKeyPrefix}${key}`);
    return null;
  }

  /**
   * Set value in cache (memory + localStorage)
   */
  set(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in localStorage for persistence
    try {
      const storageKey = `${this.storageKeyPrefix}${key}`;
      localStorage.setItem(storageKey, safeJsonStringify(entry));
      debugLog(`💾 Cache SET: ${this.storageKeyPrefix}${key} (expires in ${this.expiryMs / 1000}s)`);
    } catch (error) {
      console.warn(`⚠️ Error saving cache to localStorage:`, error);
    }
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.memoryCache.delete(key);

    try {
      const storageKey = `${this.storageKeyPrefix}${key}`;
      localStorage.removeItem(storageKey);
      debugLog(`💾 Cache DELETED: ${this.storageKeyPrefix}${key}`);
    } catch (error) {
      console.warn(`⚠️ Error deleting cache from localStorage:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear();

    try {
      // Clear all localStorage entries with this prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storageKeyPrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      debugLog(`💾 Cache CLEARED: ${this.storageKeyPrefix}* (${keysToRemove.length} entries)`);
    } catch (error) {
      console.warn(`⚠️ Error clearing cache from localStorage:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { memorySize: number; expiryMs: number; prefix: string } {
    return {
      memorySize: this.memoryCache.size,
      expiryMs: this.expiryMs,
      prefix: this.storageKeyPrefix
    };
  }
}

/**
 * Transaction Cache
 * Provides 5-minute caching for transaction data with proactive refresh
 */

import type { DisplayTransaction } from '../types/transaction';
import { fetchTransactions } from '../services/sync/index';

// Transaction cache instance (5-minute TTL)
export const transactionCache = new Cache<DisplayTransaction[]>(
  5 * 60 * 1000, // 5 minutes
  'firefly_transactions_'
);

// Cache key constants
export const TRANSACTION_CACHE_KEYS = {
  HOME_LATEST: 'home_latest',
} as const;

/**
 * Refresh home screen transaction cache
 * Call this after successful transaction create/edit/delete
 *
 * @returns true if cache was refreshed successfully
 */
export async function refreshHomeTransactionCache(): Promise<boolean> {
  try {
    debugLog('🔄 Refreshing transaction cache...');
    const result = await fetchTransactions(1, 10);

    if (!result.error && result.transactions.length >= 0) {
      transactionCache.set(TRANSACTION_CACHE_KEYS.HOME_LATEST, result.transactions);
      debugLog('✅ Transaction cache refreshed with', result.transactions.length, 'transactions');
      return true;
    }

    console.warn('⚠️ Failed to refresh cache:', result.error);
    return false;
  } catch (error) {
    console.error('❌ Error refreshing transaction cache:', error);
    return false;
  }
}

/**
 * Clear transaction cache
 * Use when needed for manual cache invalidation
 */
export function clearTransactionCache(): void {
  transactionCache.clear();
  debugLog('🗑️ Transaction cache cleared');
}
