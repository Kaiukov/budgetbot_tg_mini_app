/**
 * Sync API Service - Account Operations
 * Handles account usage queries and sorting
 */

import type { AccountsUsageResponse } from './types';
import { SyncServiceBalance } from './balance';

export class SyncServiceAccounts extends SyncServiceBalance {
  /**
   * Get accounts usage for a specific user or all accounts
   * Returns all existing accounts with smart sorting:
   * - Top: Accounts user has used (usage_count > 0), sorted high to low
   * - Bottom: Accounts user hasn't used (usage_count = 0)
   *
   * @param userName - Optional username to sort accounts by usage
   */
  public async getAccountsUsage(userName?: string): Promise<AccountsUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      // Generate cache key
      const cacheKey = userName || 'all';

      // Check cache first
      const cachedData = this.getAccountCache().get(cacheKey);
      if (cachedData) {
        console.log('💾 Using cached accounts for:', cacheKey);
        return cachedData;
      }

      console.log('🔄 Fetching fresh accounts for:', cacheKey);

      // Build URL with optional user_name query parameter
      const endpoint = userName
        ? `/api/v1/get_accounts_usage?user_name=${encodeURIComponent(userName)}`
        : '/api/v1/get_accounts_usage';

      const data = await this.makeRequest<AccountsUsageResponse>(
        endpoint,
        { method: 'GET' }
      );

      console.log('📋 Raw API data:', {
        userName,
        total: data.total,
        accountCount: data.get_accounts_usage.length,
        firstAccount: data.get_accounts_usage[0]
      });

      // If no username provided, return all accounts as-is
      if (!userName) {
        console.log('✅ Returning all accounts (no sorting)');
        return data;
      }

      // When userName is provided, API already filtered the results server-side
      // We just need to sort by usage_count: high to low, with 0 usage at the end
      const allAccounts = data.get_accounts_usage;

      console.log('📊 API returned accounts for user:', {
        userName,
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
        requestedUser: userName,
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
        total: sortedAccounts.length,
      };

      // Cache the result for 60 seconds
      this.getAccountCache().set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Failed to get accounts usage:', error);
      throw error;
    }
  }
}
