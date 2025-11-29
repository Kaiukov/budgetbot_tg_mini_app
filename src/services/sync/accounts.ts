/**
 * Sync API Service - Account Operations
 * Handles account usage queries and sorting
 */

import type { AccountsUsageResponse } from './types';
import { SyncServiceBalance } from './balance';

export class SyncServiceAccounts extends SyncServiceBalance {
  /**
   * Build account usage endpoints with singular → plural fallback
   */
  private getAccountUsageEndpoints(userName?: string): string[] {
    const query = userName ? `?user_name=${encodeURIComponent(userName)}` : '';
    return [
      `/api/v1/get_account_usage${query}`,   // new endpoint with richer payload
      `/api/v1/get_accounts_usage${query}`, // legacy endpoint
    ];
  }

  /**
   * Normalize account usage payload shape (singular/plural)
   */
  private normalizeAccountUsageResponse(response: Record<string, unknown>): AccountsUsageResponse {
    const pluralPayload = response as unknown as AccountsUsageResponse;
    if (Array.isArray((pluralPayload as any).get_accounts_usage)) {
      return pluralPayload;
    }

    const singularList = (response as any).get_account_usage;
    if (Array.isArray(singularList)) {
      return {
        ...(response as any),
        get_accounts_usage: singularList,
        total: (response as any).total ?? singularList.length,
      } as AccountsUsageResponse;
    }

    throw new Error('Invalid account usage response shape');
  }

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

      // NOTE: Caching now handled at utility layer (utils/cache.ts)
      console.log('🔄 Fetching accounts for:', userName || 'all');

      const endpoints = this.getAccountUsageEndpoints(userName);
      let data: AccountsUsageResponse | null = null;
      let selectedEndpoint = '';
      let lastError: unknown = null;

      for (const endpoint of endpoints) {
        try {
          const rawData = await this.makeRequest<Record<string, unknown>>(
            endpoint,
            { method: 'GET' }
          );
          data = this.normalizeAccountUsageResponse(rawData);
          selectedEndpoint = endpoint;
          break;
        } catch (error) {
          lastError = error;
          console.warn('⚠️ Account usage endpoint failed, trying fallback:', {
            endpoint,
            message: error instanceof Error ? error.message : String(error)
          });
        }
      }

      if (!data) {
        throw lastError instanceof Error ? lastError : new Error('Failed to fetch account usage');
      }

      console.log('📋 Raw API data:', {
        userName,
        endpoint: selectedEndpoint,
        total: data.total,
        accountCount: data.get_accounts_usage.length,
        firstAccount: data.get_accounts_usage[0],
        hasGlobalUsage: typeof data.get_accounts_usage[0]?.global_usage !== 'undefined'
      });

      // If no username provided, return all accounts as-is
      if (!userName) {
        console.log('✅ Returning all accounts (no sorting)');
        return data;
      }

      // When userName is provided, API already filtered the results server-side
      // We need to deduplicate and sort by usage_count: high to low, with 0 usage at the end
      const allAccounts = data.get_accounts_usage;

      console.log('📊 API returned accounts for user:', {
        userName,
        totalAccounts: allAccounts.length,
        accountsData: allAccounts.map(a => ({
          name: a.account_name,
          user: a.user_name,
          usage: a.usage_count,
          id: a.account_id
        }))
      });

      // Deduplicate accounts by account_id, keeping the highest usage_count
      const deduplicatedMap = new Map<string, typeof allAccounts[0]>();
      for (const account of allAccounts) {
        const existing = deduplicatedMap.get(account.account_id);
        if (!existing || account.usage_count > existing.usage_count) {
          deduplicatedMap.set(account.account_id, account);
        }
      }
      const deduplicatedAccounts = Array.from(deduplicatedMap.values());

      if (deduplicatedAccounts.length < allAccounts.length) {
        console.warn('⚠️ Removed duplicate accounts:', {
          before: allAccounts.length,
          after: deduplicatedAccounts.length,
          removed: allAccounts.length - deduplicatedAccounts.length
        });
      }

      // Separate accounts by usage: used (count > 0) and unused (count = 0)
      const usedAccounts = deduplicatedAccounts.filter(account => account.usage_count > 0);
      const unusedAccounts = deduplicatedAccounts.filter(account => account.usage_count === 0);

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

      // NOTE: Caching now handled at utility layer (utils/cache.ts)
      return result;
    } catch (error) {
      console.error('Failed to get accounts usage:', error);
      throw error;
    }
  }
}
