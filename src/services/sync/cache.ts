/**
 * Sync API Service - Cache Layer
 * Manages caching for accounts, categories, and balance data
 */

import { Cache } from '../../utils/cache';
import type {
  AccountsUsageResponse,
  CategoriesUsageResponse,
  CurrentBalanceResponse
} from './types';
import { SyncServiceCore } from './core';

export class SyncServiceCache extends SyncServiceCore {
  protected categoryCache: Cache<CategoriesUsageResponse>;
  protected readonly CATEGORY_CACHE_EXPIRY_MS = 60000; // 1 minute in milliseconds

  protected accountCache: Cache<AccountsUsageResponse>;
  protected readonly ACCOUNT_CACHE_EXPIRY_MS = 60000; // 60 seconds in milliseconds

  protected balanceCache: Cache<CurrentBalanceResponse>;
  protected readonly BALANCE_CACHE_EXPIRY_MS = 300000; // 5 minutes in milliseconds

  constructor() {
    super();

    // Initialize category cache with 1-minute expiry
    this.categoryCache = new Cache<CategoriesUsageResponse>(
      this.CATEGORY_CACHE_EXPIRY_MS,
      'category_'
    );

    // Initialize account cache with 60-second expiry
    this.accountCache = new Cache<AccountsUsageResponse>(
      this.ACCOUNT_CACHE_EXPIRY_MS,
      'account_'
    );

    // Initialize balance cache with 5-minute expiry
    this.balanceCache = new Cache<CurrentBalanceResponse>(
      this.BALANCE_CACHE_EXPIRY_MS,
      'balance_'
    );
  }

  /**
   * Get account cache instance for subclasses
   */
  protected getAccountCache(): Cache<AccountsUsageResponse> {
    return this.accountCache;
  }

  /**
   * Get category cache instance for subclasses
   */
  protected getCategoryCache(): Cache<CategoriesUsageResponse> {
    return this.categoryCache;
  }

  /**
   * Get balance cache instance for subclasses
   */
  protected getBalanceCache(): Cache<CurrentBalanceResponse> {
    return this.balanceCache;
  }
}
