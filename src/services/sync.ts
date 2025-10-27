/**
 * Sync API Service
 * Provides utilities for interacting with the Sync API
 */

export interface AccountUsage {
  user_name: string;
  account_name: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface AccountsUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_accounts_usage: AccountUsage[];
  total: number;
}

class SyncService {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor() {
    // Detect environment
    const isProduction = typeof window !== 'undefined' &&
      (window.location.hostname.includes('workers.dev') ||
       window.location.hostname.includes('pages.dev'));

    // In production: call backend directly (middleware not working)
    // In development: use Vite proxy (empty baseUrl)
    this.baseUrl = isProduction ? 'https://dev.neon-chuckwalla.ts.net' : '';

    this.apiKey = import.meta.env.VITE_SYNC_API_KEY || null;

    console.log('🔧 Sync Service Config:', {
      environment: isProduction ? 'production' : 'development',
      baseUrl: this.baseUrl || '(using proxy)',
      hasApiKey: !!this.apiKey
    });
  }

  /**
   * Get current API key
   */
  public getApiKey(): string | null {
    return this.apiKey;
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
    // so we only need to check for apiKey
    return !!this.apiKey;
  }

  /**
   * Make API request to Sync API with Telegram authentication
   */
  private async makeRequest<T>(endpoint: string, options?: { method?: string; body?: any }): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new Error('Sync API key not configured');
    }

    // Get Telegram initData for authentication
    const { default: telegramService } = await import('./telegram');
    const initData = telegramService.getInitData();

    const method = options?.method || 'POST';

    console.log('🔄 Sync API Request:', {
      url,
      method,
      hasApiKey: !!apiKey,
      hasInitData: !!initData
    });

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Only include body for POST requests (GET cannot have body)
        ...(method === 'POST' && {
          body: JSON.stringify({
            initData,
            ...options?.body
          })
        }),
      });

      console.log('📡 Sync API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Sync API Error Response:', errorText);
        throw new Error(`Sync API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Sync API Success:', { totalAccounts: (data as any).total });
      return data;
    } catch (error) {
      console.error('💥 Sync API Fetch Error:', error);
      throw error;
    }
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

      const data = await this.makeRequest<AccountsUsageResponse>(
        '/api/sync/get_accounts_usage',
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

      // Smart sorting for specific user
      const allAccounts = data.get_accounts_usage;

      // Get all unique account names from API response
      const uniqueAccountNames = new Set<string>(
        allAccounts.map(acc => acc.account_name)
      );

      console.log('🔍 Account extraction:', {
        totalRows: allAccounts.length,
        uniqueAccounts: uniqueAccountNames.size,
        accountNames: Array.from(uniqueAccountNames)
      });

      // Separate into used and unused accounts for this user
      const usedAccounts = allAccounts.filter(
        account => account.user_name === userName && account.usage_count > 0
      );

      console.log('📊 User account filtering:', {
        userName,
        usedAccountsCount: usedAccounts.length,
        usedAccounts: usedAccounts.map(a => ({ name: a.account_name, usage: a.usage_count }))
      });

      // Find accounts this user hasn't used
      const usedAccountNames = new Set(usedAccounts.map(acc => acc.account_name));
      const unusedAccountNames = Array.from(uniqueAccountNames).filter(
        name => !usedAccountNames.has(name)
      );

      console.log('🔍 Unused accounts:', {
        unusedCount: unusedAccountNames.length,
        unusedNames: unusedAccountNames
      });

      // Sort used accounts by usage_count (high to low)
      usedAccounts.sort((a, b) => b.usage_count - a.usage_count);

      // Create placeholder entries for unused accounts
      const currentTimestamp = new Date().toISOString();
      const unusedAccounts: AccountUsage[] = unusedAccountNames.map(accountName => ({
        user_name: userName,
        account_name: accountName,
        usage_count: 0,
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
      }));

      // Combine: used accounts first, then unused
      const sortedAccounts = [...usedAccounts, ...unusedAccounts];

      console.log('✅ Smart sorted results:', {
        requestedUser: userName,
        usedCount: usedAccounts.length,
        unusedCount: unusedAccounts.length,
        totalCount: sortedAccounts.length,
        topAccount: sortedAccounts[0]?.account_name,
        topUsage: sortedAccounts[0]?.usage_count,
        sortedOrder: sortedAccounts.map(a => ({ name: a.account_name, usage: a.usage_count }))
      });

      return {
        ...data,
        get_accounts_usage: sortedAccounts,
        total: sortedAccounts.length,
      };
    } catch (error) {
      console.error('Failed to get accounts usage:', error);
      throw error;
    }
  }

  /**
   * Check Sync API connection
   */
  public async checkConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Sync API key not configured',
        };
      }

      await this.getAccountsUsage();

      return {
        success: true,
        message: 'Connected to Sync API',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;
