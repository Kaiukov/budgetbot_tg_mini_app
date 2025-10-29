/**
 * Generic Cache Utility
 * Provides dual-layer caching (memory + localStorage) with configurable expiry
 * Used for exchange rates (1H) and categories (1Min)
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
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
      console.log(`💾 Cache HIT (memory): ${this.storageKeyPrefix}${key}`);
      return memoryEntry.data;
    }

    // Check localStorage as fallback
    try {
      const storageKey = `${this.storageKeyPrefix}${key}`;
      const cached = localStorage.getItem(storageKey);

      if (cached) {
        const entry = JSON.parse(cached) as CacheEntry<T>;

        if ((now - entry.timestamp) < this.expiryMs) {
          console.log(`💾 Cache HIT (localStorage): ${this.storageKeyPrefix}${key}`);
          // Restore to memory cache for faster access
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(storageKey);
          this.memoryCache.delete(key);
          console.log(`💾 Cache EXPIRED: ${this.storageKeyPrefix}${key}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error reading cache from localStorage:`, error);
    }

    console.log(`💾 Cache MISS: ${this.storageKeyPrefix}${key}`);
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
      localStorage.setItem(storageKey, JSON.stringify(entry));
      console.log(`💾 Cache SET: ${this.storageKeyPrefix}${key} (expires in ${this.expiryMs / 1000}s)`);
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
      console.log(`💾 Cache DELETED: ${this.storageKeyPrefix}${key}`);
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
      console.log(`💾 Cache CLEARED: ${this.storageKeyPrefix}* (${keysToRemove.length} entries)`);
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
