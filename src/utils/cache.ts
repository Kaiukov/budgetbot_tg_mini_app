/**
 * Dual-Layer Cache Utility
 * Provides memory (fast) + localStorage (persistent) caching with configurable TTL
 *
 * Usage:
 *   const cache = new DualLayerCache<number>({ ttl: 3600000, prefix: 'exchange_rate_' });
 *   cache.set('USD:EUR', 0.92);
 *   const rate = cache.get('USD:EUR'); // returns 0.92 or null if expired
 */

import type { CacheEntry, CacheConfig } from '../services/sync/types';

export class DualLayerCache<T> {
  private memory: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = {
      useLocalStorage: true,
      ...config
    };
  }

  /**
   * Retrieve value from cache (memory → localStorage fallback)
   * Returns null if key not found or entry expired
   */
  get(key: string): T | null {
    const normalizedKey = this.normalizeKey(key);

    // Layer 1: Check memory cache first (fastest)
    const memEntry = this.memory.get(normalizedKey);
    if (memEntry && this.isNotExpired(memEntry.timestamp)) {
      console.log(`💾 Cache HIT (memory): ${normalizedKey}`);
      return memEntry.data;
    }

    // Layer 2: Check localStorage fallback
    if (this.config.useLocalStorage) {
      try {
        const storageKey = this.prefixKey(normalizedKey);
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          const parsed = JSON.parse(stored) as CacheEntry<T>;
          if (this.isNotExpired(parsed.timestamp)) {
            // Restore to memory for future hits
            this.memory.set(normalizedKey, parsed);
            console.log(`💾 Cache HIT (localStorage): ${normalizedKey}`);
            return parsed.data;
          } else {
            // Clean up expired entry
            localStorage.removeItem(storageKey);
            console.log(`💾 Cache EXPIRED: ${normalizedKey}`);
          }
        }
      } catch (e) {
        console.warn(`💾 Cache read error for ${normalizedKey}:`, e);
      }
    }

    // Cache miss - return null (caller should fetch from API)
    console.log(`💾 Cache MISS: ${normalizedKey}`);
    return null;
  }

  /**
   * Store value in cache (both memory and localStorage)
   */
  set(key: string, value: T): void {
    const normalizedKey = this.normalizeKey(key);
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now()
    };

    // Store in memory (always)
    this.memory.set(normalizedKey, entry);

    // Store in localStorage if enabled
    if (this.config.useLocalStorage) {
      try {
        const storageKey = this.prefixKey(normalizedKey);
        localStorage.setItem(storageKey, JSON.stringify(entry));
        const expiryMinutes = Math.round(this.config.ttl / 60000);
        console.log(`💾 Cached (${expiryMinutes}min): ${normalizedKey}`);
      } catch (e) {
        console.warn(`💾 Cache write error for ${normalizedKey}:`, e);
      }
    } else {
      console.log(`💾 Cached (memory only): ${normalizedKey}`);
    }
  }

  /**
   * Check if entry exists and is not expired
   */
  isExpired(key: string): boolean {
    const normalizedKey = this.normalizeKey(key);
    const entry = this.memory.get(normalizedKey);
    if (!entry) return true;
    return !this.isNotExpired(entry.timestamp);
  }

  /**
   * Delete specific cache entry from both layers
   */
  delete(key: string): void {
    const normalizedKey = this.normalizeKey(key);

    // Remove from memory
    this.memory.delete(normalizedKey);

    // Remove from localStorage
    if (this.config.useLocalStorage) {
      try {
        const storageKey = this.prefixKey(normalizedKey);
        localStorage.removeItem(storageKey);
        console.log(`💾 Deleted: ${normalizedKey}`);
      } catch (e) {
        console.warn(`💾 Cache delete error for ${normalizedKey}:`, e);
      }
    }
  }

  /**
   * Clear all cached entries from both layers
   */
  clear(): void {
    const size = this.memory.size;
    this.memory.clear();

    if (this.config.useLocalStorage && this.config.prefix) {
      try {
        const prefix = this.config.prefix;
        const keysToDelete: string[] = [];

        // Find all keys with this prefix
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(prefix)) {
            keysToDelete.push(key);
          }
        }

        // Delete them
        keysToDelete.forEach(key => localStorage.removeItem(key));
        console.log(`💾 Cleared ${keysToDelete.length} entries`);
      } catch (e) {
        console.warn('💾 Cache clear error:', e);
      }
    } else {
      console.log(`💾 Cleared ${size} memory entries`);
    }
  }

  /**
   * Check if value is not expired based on timestamp
   * TTL is configured in milliseconds
   */
  private isNotExpired(timestamp: number): boolean {
    const elapsed = Date.now() - timestamp;
    return elapsed < this.config.ttl;
  }

  /**
   * Normalize cache key to uppercase for consistency
   * Prevents "USD" vs "usd" cache misses
   */
  private normalizeKey(key: string): string {
    return key.toUpperCase();
  }

  /**
   * Add prefix to key for localStorage storage
   * Format: "prefix:KEY"
   */
  private prefixKey(key: string): string {
    if (this.config.prefix) {
      return `${this.config.prefix}${key}`;
    }
    return key;
  }
}
