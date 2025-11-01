/**
 * Firefly III API Service
 * Provides utilities for interacting with Firefly III API
 */

import { Cache } from '../../utils/cache';

export interface FireflyAboutResponse {
  data: {
    version: string;
    api_version: string;
    os: string;
    php_version: string;
  };
}

export interface FireflyUserResponse {
  data: {
    type: string;
    id: string;
    attributes: {
      email: string;
      blocked: boolean;
      blocked_code: string | null;
      role: string;
    };
  };
}

export interface AccountUsage {
  account_id: string;
  account_name: string;
  account_currency: string;
  current_balance: number;
  usage_count: number;
}

interface FireflyAccount {
  id: string;
  attributes: {
    name: string;
    currency_code: string;
    current_balance: number;
    type: string;
  };
}

interface FireflyTransaction {
  type: string;
  attributes: {
    date: string;
    amount: string;
    source_name: string;
    destination_name: string;
    tags: string[];
    [key: string]: unknown;
  };
}

interface FireflyAccountsResponse {
  data: FireflyAccount[];
  meta?: {
    pagination?: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}

interface FireflyTransactionsResponse {
  data: FireflyTransaction[];
  meta?: {
    pagination?: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}

class FireflyService {
  private baseUrl: string;
  private apiToken: string | null = null;
  private accountCache: Cache<AccountUsage[]>;
  private readonly ACCOUNT_CACHE_EXPIRY_MS = 60000; // 60 seconds

  constructor() {
    // Use VITE_BASE_URL for direct API calls
    // If not set, use empty string (Vite proxy in development)
    this.baseUrl = import.meta.env.VITE_BASE_URL || '';

    // Get Firefly III API token
    this.apiToken = import.meta.env.VITE_FIREFLY_TOKEN || null;

    // Initialize account cache with 60-second expiry
    this.accountCache = new Cache<AccountUsage[]>(
      this.ACCOUNT_CACHE_EXPIRY_MS,
      'account_'
    );

    console.log('🔧 Firefly Service Config:', {
      baseUrl: this.baseUrl || '(using proxy)',
      hasToken: !!this.apiToken
    });
  }

  /**
   * Get current API token
   */
  public getToken(): string | null {
    return this.apiToken;
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
    // so we only need to check for apiToken
    return !!this.apiToken;
  }

  /**
   * Make API request (GET only)
   * Note: All Firefly III API endpoints follow the pattern /api/v1/{endpoint}
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const token = this.getToken();

    if (!token) {
      throw new Error('API token not configured');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make POST request to Firefly III API
   */
  public async postRequest<T = unknown>(
    endpoint: string,
    body: unknown
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const token = this.getToken();

    if (!token) {
      return { success: false, error: 'API token not configured' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`,
          data: data as T,
        };
      }

      return { success: true, data: data as T };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Make PUT request to Firefly III API
   */
  public async putRequest<T = unknown>(
    endpoint: string,
    body: unknown
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const token = this.getToken();

    if (!token) {
      return { success: false, error: 'API token not configured' };
    }

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`,
          data: data as T,
        };
      }

      return { success: true, data: data as T };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Make DELETE request to Firefly III API
   */
  public async deleteRequest(
    endpoint: string
  ): Promise<{ success: boolean; error?: string }> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const token = this.getToken();

    if (!token) {
      return { success: false, error: 'API token not configured' };
    }

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`,
        };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check API connection and get about information
   */
  public async checkConnection(): Promise<{
    success: boolean;
    message: string;
    data?: FireflyAboutResponse;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'API URL or token not configured',
        };
      }

      const data = await this.makeRequest<FireflyAboutResponse>('/api/v1/about');

      return {
        success: true,
        message: `Connected to Firefly III v${data.data.version}`,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current user information
   */
  public async getCurrentUser(): Promise<FireflyUserResponse | null> {
    try {
      return await this.makeRequest<FireflyUserResponse>('/api/v1/user');
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Test connection with custom URL and token
   */
  public async testConnection(url: string, token: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${url}/api/v1/about`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        };
      }

      const data: FireflyAboutResponse = await response.json();

      return {
        success: true,
        message: `Connected to Firefly III v${data.data.version}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get accounts usage by counting transactions over last 90 days
   *
   * Returns all accounts with usage_count calculated from transactions.
   * Smart sorting:
   * - Top: Accounts with usage_count > 0, sorted high → low
   * - Bottom: Accounts with usage_count = 0
   *
   * @param userName - Optional filter by user (from transaction tags)
   * @returns Sorted array of accounts with usage counts
   */
  public async getAccountsUsage(userName?: string): Promise<AccountUsage[]> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Firefly service not configured');
      }

      // Generate cache key
      const cacheKey = userName || 'all';

      // Check cache first
      const cachedData = this.accountCache.get(cacheKey);
      if (cachedData) {
        console.log('💾 Using cached accounts for:', cacheKey);
        return cachedData;
      }

      console.log('🔄 Fetching fresh accounts for:', cacheKey);

      // Fetch all asset accounts
      const accountsResponse = await this.makeRequest<FireflyAccountsResponse>(
        '/api/v1/accounts?type=asset'
      );

      const accounts = accountsResponse.data || [];

      console.log('📋 Fetched', accounts.length, 'accounts from Firefly');

      // Build account map for quick lookup
      const accountMap = new Map(
        accounts.map(acc => [
          acc.attributes.name,
          {
            id: acc.id,
            name: acc.attributes.name,
            currency: acc.attributes.currency_code,
            balance: acc.attributes.current_balance,
          }
        ])
      );

      // Fetch transactions from last 90 days
      const startDate = this.get90DaysAgo();
      const endDate = this.getToday();
      const transactionsUrl = `/api/v1/transactions?start=${startDate}&end=${endDate}&limit=1000`;

      const txnsResponse = await this.makeRequest<FireflyTransactionsResponse>(transactionsUrl);
      const transactions = txnsResponse.data || [];

      console.log('📋 Fetched', transactions.length, 'transactions');

      // Count transactions per account grouped by user tag
      const usageMap = new Map<string, Map<string, number>>();

      transactions.forEach(txn => {
        const sourceName = txn.attributes.source_name;
        const userTag = (txn.attributes.tags && txn.attributes.tags[0]) || 'Unknown';

        if (sourceName) {
          if (!usageMap.has(sourceName)) {
            usageMap.set(sourceName, new Map());
          }

          const accountUsers = usageMap.get(sourceName)!;
          const currentCount = accountUsers.get(userTag) || 0;
          accountUsers.set(userTag, currentCount + 1);
        }
      });

      // Build account usage array
      const allAccounts: AccountUsage[] = [];

      accountMap.forEach((accountData, accountName) => {
        const userUsageMap = usageMap.get(accountName);

        if (userName && userName !== 'Unknown') {
          // Filter by specific user
          const count = userUsageMap?.get(userName) || 0;
          allAccounts.push({
            account_id: accountData.id,
            account_name: accountData.name,
            account_currency: accountData.currency,
            current_balance: accountData.balance,
            usage_count: count,
          });
        } else {
          // Include all users - sum across all user tags for this account
          let totalCount = 0;
          if (userUsageMap) {
            userUsageMap.forEach(count => {
              totalCount += count;
            });
          }

          allAccounts.push({
            account_id: accountData.id,
            account_name: accountData.name,
            account_currency: accountData.currency,
            current_balance: accountData.balance,
            usage_count: totalCount,
          });
        }
      });

      console.log('📊 Built usage data for', allAccounts.length, 'accounts');

      // Smart sort: used accounts first (high → low), then unused
      const usedAccounts = allAccounts.filter(a => a.usage_count > 0);
      const unusedAccounts = allAccounts.filter(a => a.usage_count === 0);

      usedAccounts.sort((a, b) => b.usage_count - a.usage_count);

      const sortedAccounts = [...usedAccounts, ...unusedAccounts];

      console.log('✅ Sorted account results:', {
        requestedUser: userName || 'all',
        usedCount: usedAccounts.length,
        unusedCount: unusedAccounts.length,
        totalCount: sortedAccounts.length,
        topAccount: sortedAccounts[0]?.account_name,
        topUsage: sortedAccounts[0]?.usage_count,
      });

      // Cache the result for 60 seconds
      this.accountCache.set(cacheKey, sortedAccounts);

      return sortedAccounts;
    } catch (error) {
      console.error('Failed to get accounts usage:', error);
      throw error;
    }
  }

  /**
   * Get date N days ago in YYYY-MM-DD format
   */
  private getDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get date 90 days ago
   */
  private get90DaysAgo(): string {
    return this.getDaysAgo(90);
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }
}

// Export singleton instance
export const fireflyService = new FireflyService();
export default fireflyService;
