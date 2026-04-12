/**
 * Sync API - Account Operations
 * Provides methods for fetching account data from Sync API
 * Includes account usage data and current balance information
 * All operations use 5-minute caching to reduce API calls
 */

import { Cache } from '../../utils/cache';
import { apiClient } from './apiClient';

// ============================================================================
// Type Definitions
// ============================================================================

export interface AccountUsage {
  account_id: string;
  user_name: string;
  account_name: string;
  account_currency: string;
  current_balance: number;
  balance_in_USD: number;
  balance_in_EUR: number;
  owner: string;
  owner_id: string;
  usage_count: number;
  first_used_at: string | null;
  last_used_at: string | null;
}

export interface AccountsUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_accounts_usage: AccountUsage[];
  total_sync: number;
}

export interface CurrentBalanceResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_running_balance: {
    date: string | null;
    balance_eur: number;
    balance_usd: number;
  }[];
  total: number;
}

// ============================================================================
// Account Service
// ============================================================================

class AccountsService {
  // Account cache with 5-minute expiry
  private accountCache: Cache<AccountsUsageResponse>;
  private readonly ACCOUNT_CACHE_EXPIRY_MS = 300000; // 5 minutes in milliseconds

  // Balance cache with 5-minute expiry
  private balanceCache: Cache<CurrentBalanceResponse>;
  private readonly BALANCE_CACHE_EXPIRY_MS = 300000; // 5 minutes in milliseconds

  constructor() {
    // Initialize account cache with 5-minute expiry
    this.accountCache = new Cache<AccountsUsageResponse>(
      this.ACCOUNT_CACHE_EXPIRY_MS,
      'account_'
    );

    // Initialize balance cache with 5-minute expiry
    this.balanceCache = new Cache<CurrentBalanceResponse>(
      this.BALANCE_CACHE_EXPIRY_MS,
      'balance_'
    );

    console.log('🔧 AccountsService initialized');
  }

  /**
   * Check if service is configured
   */
  private isConfigured(): boolean {
    return apiClient.isConfigured();
  }

  /**
   * Make API request using unified ApiClient with Tier 2 auth
   * Tier 2: Anonymous Authorized (session token after bootstrap)
   */
  private async makeRequest<T>(
    endpoint: string,
    options?: { method?: string; body?: any }
  ): Promise<T> {
    const method = options?.method || 'GET';
    return apiClient.request<T>(endpoint, {
      method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      body: options?.body,
      auth: 'tier2', // Tier 2: Anonymous Authorized (Telegram Mini App users)
    });
  }

  /**
   * Get current balance from the API with 5-minute caching
   */
  public async getCurrentBalance(): Promise<number> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      const cacheKey = 'current_balance';

      // Check cache first
      const cachedData = this.balanceCache.get(cacheKey);
      if (cachedData) {
        console.log('💾 Using cached balance');
        const latestCachedBalance =
          cachedData?.get_running_balance?.[cachedData.get_running_balance.length - 1]?.balance_usd;
        if (latestCachedBalance !== undefined) {
          return latestCachedBalance;
        }
      }

      console.log('🔄 Fetching fresh balance');

      const data = await this.makeRequest<CurrentBalanceResponse>(
        '/api/v1/read-model/running-balance',
        { method: 'GET' }
      );

      // Validate response structure before accessing
      if (!data || !data.get_running_balance || !Array.isArray(data.get_running_balance) || data.get_running_balance.length === 0) {
        console.warn('⚠️ Invalid balance response structure, returning 0');
        return 0;
      }

      // Cache the result for 5 minutes
      this.balanceCache.set(cacheKey, data);

      return data.get_running_balance[data.get_running_balance.length - 1]?.balance_usd || 0;
    } catch (error) {
      console.error('Failed to fetch current balance:', error);
      return 0; // Return 0 instead of throwing to prevent UI breakage
    }
  }

  /**
   * Get accounts usage for a specific user or all accounts
   * Returns all existing accounts with smart sorting:
   * - Top: Accounts user has used (usage_count > 0), sorted high to low
   * - Bottom: Accounts user hasn't used (usage_count = 0)
   *
   * @param user_name - Optional username to sort accounts by usage
   */
  public async getAccountsUsage(user_name?: string): Promise<AccountsUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      // Generate cache key
      const cacheKey = user_name || 'all';

      // Check cache first
      const cachedData = this.accountCache.get(cacheKey);
      if (cachedData) {
        console.log('💾 Using cached accounts for:', cacheKey);
        return cachedData;
      }

      console.log('🔄 Fetching fresh accounts for:', cacheKey);

      // Build URL with optional user_name query parameter
      const endpoint = user_name
        ? `/api/v1/read-model/accounts/usage?user_name=${encodeURIComponent(user_name)}`
        : '/api/v1/read-model/accounts/usage';

      const data = await this.makeRequest<AccountsUsageResponse>(
        endpoint,
        { method: 'GET' }
      );

      console.log('📋 Raw API data:', {
        user_name,
        total_sync: data.total_sync,
        accountCount: data.get_accounts_usage.length,
        firstAccount: data.get_accounts_usage[0]
      });

      // If no username provided, return all accounts as-is
      if (!user_name) {
        console.log('✅ Returning all accounts (no sorting)');
        return data;
      }

      // When user_name is provided, API already filtered the results server-side
      // We just need to sort by usage_count: high to low, with 0 usage at the end
      const allAccounts = data.get_accounts_usage;

      console.log('📊 API returned accounts for user:', {
        user_name,
        totalAccounts: allAccounts.length,
        accountsData: allAccounts.map(a => ({
          name: a.account_name,
          user: a.user_name,
          usage: a.usage_count
        }))
      });

      // Separate accounts by usage: used (count > 0) and unused (count = 0)
      const usedAccounts = allAccounts.filter(account => account.usage_count > 0);
      const unusedAccounts = allAccounts.filter(account => account.usage_count === 0);

      // Sort used accounts by usage_count (high to low)
      usedAccounts.sort((a, b) => b.usage_count - a.usage_count);

      // Combine: used accounts first, then unused
      const sortedAccounts = [...usedAccounts, ...unusedAccounts];

      console.log('✅ Sorted account results:', {
        requestedUser: user_name,
        usedCount: usedAccounts.length,
        unusedCount: unusedAccounts.length,
        totalCount: sortedAccounts.length,
        topAccount: sortedAccounts[0]?.account_name,
        topUsage: sortedAccounts[0]?.usage_count,
        sortedOrder: sortedAccounts.map(a => ({
          name: a.account_name,
          usage: a.usage_count
        }))
      });

      const result = {
        ...data,
        get_accounts_usage: sortedAccounts,
        total_sync: sortedAccounts.length,
      };

      // Cache the result for 5 minutes
      this.accountCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Failed to get accounts usage:', error);
      throw error;
    }
  }

  /**
   * Clear account caches (useful for forcing a refresh)
   */
  public clearCaches(): void {
    console.log('🗑️ Clearing account and balance caches');
    this.accountCache.clear();
    this.balanceCache.clear();
  }
}

// Export singleton instance
export const accountsService = new AccountsService();
