/**
 * Sync API Service - Cache Layer
 * Manages caching for balance data
 * NOTE: Accounts and categories are now cached at the utility layer (utils/cache.ts)
 * to avoid dual-caching conflicts and maintain a single source of truth
 */

import { Cache } from '../../utils/cache';
import type {
  AccountsUsageResponse,
  CategoriesUsageResponse,
  CurrentBalanceResponse
} from './types';
import { SyncServiceCore } from './core';

export class SyncServiceCache extends SyncServiceCore {
  // Only balance cache remains at service level (API response caching)
  protected balanceCache: Cache<CurrentBalanceResponse>;
  protected readonly BALANCE_CACHE_EXPIRY_MS = 300000; // 5 minutes in milliseconds

  constructor() {
    super();

    // Initialize balance cache with 5-minute expiry
    this.balanceCache = new Cache<CurrentBalanceResponse>(
      this.BALANCE_CACHE_EXPIRY_MS,
      'balance_'
    );
  }

  /**
   * Get account cache instance for subclasses
   * NOTE: Now returns null - accounts caching handled at utility layer
   * @deprecated Use utility layer caching (accountsCache from utils/cache.ts)
   */
  protected getAccountCache(): Cache<AccountsUsageResponse> | null {
    return null;
  }

  /**
   * Get category cache instance for subclasses
   * NOTE: Now returns null - categories caching handled at utility layer
   * @deprecated Use utility layer caching (categoriesCache from utils/cache.ts)
   */
  protected getCategoryCache(): Cache<CategoriesUsageResponse> | null {
    return null;
  }

  /**
   * Get balance cache instance for subclasses
   */
  protected getBalanceCache(): Cache<CurrentBalanceResponse> {
    return this.balanceCache;
  }
}
