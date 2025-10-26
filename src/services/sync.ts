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
    // Always use empty baseUrl to leverage proxy routing
    // In development: Vite proxy handles /api/* requests
    // In production: Cloudflare Pages middleware handles /api/* requests
    this.baseUrl = '';
    this.apiKey = import.meta.env.VITE_SYNC_API_KEY || null;
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
   * Make API request to Sync API
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new Error('Sync API key not configured');
    }

    console.log('🔄 Sync API Request:', { url, hasApiKey: !!apiKey });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
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
   * @param userName - Optional username to filter accounts (if not provided, returns all accounts)
   */
  public async getAccountsUsage(userName?: string): Promise<AccountsUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      const data = await this.makeRequest<AccountsUsageResponse>('/api/sync/get_accounts_usage');

      console.log('📋 Raw API data:', {
        userName,
        total: data.total,
        accountCount: data.get_accounts_usage.length,
        firstAccount: data.get_accounts_usage[0]
      });

      // Filter by username if provided
      if (userName) {
        const filteredAccounts = data.get_accounts_usage.filter(
          account => account.user_name === userName
        );

        console.log('🔍 Filtered results:', {
          requestedUser: userName,
          filteredCount: filteredAccounts.length,
          originalCount: data.get_accounts_usage.length
        });

        return {
          ...data,
          get_accounts_usage: filteredAccounts,
          total: filteredAccounts.length,
        };
      }

      console.log('✅ Returning all accounts (no filter)');
      return data;
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
