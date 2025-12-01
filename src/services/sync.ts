/**
 * Sync API Service
 * Provides utilities for interacting with the unified Firefly API (v1)
 * Uses the unified ApiClient for all HTTP requests with Firefly 3-tier auth
 */

import { Cache } from '../utils/cache';
import { apiClient } from './sync/apiClient';

/**
 * Safe JSON stringifier that handles Unicode surrogate pairs correctly
 * Prevents "no low surrogate in string" errors by sanitizing strings
 */
function safeJsonStringify(obj: any): string {
  // Custom replacer function to sanitize strings with potential surrogate pair issues
  const replacer = (_key: string, value: any): any => {
    if (typeof value === 'string') {
      // Replace any unpaired surrogates with Unicode replacement character (U+FFFD)
      return value
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '\uFFFD')  // unpaired high surrogate
        .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD'); // unpaired low surrogate
    }
    return value;
  };

  return JSON.stringify(obj, replacer);
}

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

export interface CategoryUsage {
  user_name: string;
  category_name: string;
  category_id: number;
  usage_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CategoriesUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_categories_usage: CategoryUsage[];
  total: number;
}

export interface DestinationSuggestion {
  user_name: string;
  destination_id: string;
  destination_name: string;
  category_id: string;
  category_name: string;
  usage_count: number;
  global_usage?: number;
  user_has_used?: boolean;
}

export interface DestinationNameUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_destination_name_usage: DestinationSuggestion[];
  total: number;
}

export interface CurrentBalanceResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_current_balance: {
    balance_in_USD: number;
  }[];
  total: number;
}

export interface TelegramUserData {
  success: boolean;
  message: string;
  timestamp: string;
  userData: {
    photo_url: string | null;
    bio: string;
    user_id: number;
  } | null;
}

export interface ExchangeRateCache {
  rate: number;
  timestamp: number;
}

class SyncService {
  private exchangeRateCache: Map<string, ExchangeRateCache> = new Map();
  private readonly CACHE_EXPIRY_MS = 3600000; // 1 hour in milliseconds
  private readonly CACHE_KEY_PREFIX = 'exchange_rate_';

  // Category cache with 5-minute expiry
  private categoryCache: Cache<CategoriesUsageResponse>;
  private readonly CATEGORY_CACHE_EXPIRY_MS = 300000; // 5 minutes in milliseconds

  // Account cache with 5-minute expiry
  private accountCache: Cache<AccountsUsageResponse>;
  private readonly ACCOUNT_CACHE_EXPIRY_MS = 300000; // 5 minutes in milliseconds

  // Balance cache with 5-minute expiry
  private balanceCache: Cache<CurrentBalanceResponse>;
  private readonly BALANCE_CACHE_EXPIRY_MS = 300000; // 5 minutes in milliseconds

  constructor() {
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

    console.log('🔧 SyncService initialized with ApiClient (Tier 2 auth)');
  }

  /**
   * Generate cache key for exchange rate pair
   */
  private generateCacheKey(from: string, to: string): string {
    return `${from.toUpperCase()}:${to.toUpperCase()}`;
  }

  /**
   * Get exchange rate from cache (memory + localStorage)
   * Returns null if cache is expired or doesn't exist
   */
  private getExchangeRateFromCache(from: string, to: string): number | null {
    const cacheKey = this.generateCacheKey(from, to);
    const now = Date.now();

    // Check memory cache first
    const memoryCache = this.exchangeRateCache.get(cacheKey);
    if (memoryCache && (now - memoryCache.timestamp) < this.CACHE_EXPIRY_MS) {
      console.log('💾 Exchange rate cache HIT (memory):', { from, to, rate: memoryCache.rate });
      return memoryCache.rate;
    }

    // Check localStorage as fallback
    try {
      const storageKey = `${this.CACHE_KEY_PREFIX}${cacheKey}`;
      const cached = localStorage.getItem(storageKey);

      if (cached) {
        const data = JSON.parse(cached) as ExchangeRateCache;

        if ((now - data.timestamp) < this.CACHE_EXPIRY_MS) {
          console.log('💾 Exchange rate cache HIT (localStorage):', { from, to, rate: data.rate });
          // Restore to memory cache for faster access
          this.exchangeRateCache.set(cacheKey, data);
          return data.rate;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(storageKey);
          this.exchangeRateCache.delete(cacheKey);
          console.log('💾 Exchange rate cache EXPIRED:', { from, to });
        }
      }
    } catch (error) {
      console.warn('⚠️ Error reading exchange rate from localStorage:', error);
    }

    return null;
  }

  /**
   * Save exchange rate to cache (memory + localStorage)
   */
  private setExchangeRateCache(from: string, to: string, rate: number): void {
    const cacheKey = this.generateCacheKey(from, to);
    const cacheData: ExchangeRateCache = {
      rate,
      timestamp: Date.now()
    };

    // Store in memory cache
    this.exchangeRateCache.set(cacheKey, cacheData);

    // Store in localStorage for persistence
    try {
      const storageKey = `${this.CACHE_KEY_PREFIX}${cacheKey}`;
      localStorage.setItem(storageKey, safeJsonStringify(cacheData));
      console.log('💾 Exchange rate cached:', { from, to, rate, expiresIn: '1h' });
    } catch (error) {
      console.warn('⚠️ Error saving exchange rate to localStorage:', error);
    }
  }

  /**
   * Check if service is configured
   */
  public isConfigured(): boolean {
    return apiClient.isConfigured();
  }

  /**
   * Make API request using unified ApiClient with Tier 2 auth
   * Tier 2: Anonymous Authorized (X-Anonymous-Key + X-Telegram-Init-Data)
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
  public async fetchCurrentBalance(): Promise<number> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      const cacheKey = 'current_balance';

      // Check cache first
      const cachedData = this.balanceCache.get(cacheKey);
      if (cachedData) {
        console.log('💾 Using cached balance');
        return cachedData.get_current_balance[0]?.balance_in_USD || 0;
      }

      console.log('🔄 Fetching fresh balance');

      const data = await this.makeRequest<CurrentBalanceResponse>(
        '/api/v1/get_running_balance',
        { method: 'GET' }
      );

      // Cache the result for 5 minutes
      this.balanceCache.set(cacheKey, data);

      return data.get_current_balance[0]?.balance_in_USD || 0;
    } catch (error) {
      console.error('Failed to fetch current balance:', error);
      throw error;
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
        ? `/api/v1/get_accounts_usage?user_name=${encodeURIComponent(user_name)}`
        : '/api/v1/get_accounts_usage';

      const data = await this.makeRequest<AccountsUsageResponse>(
        endpoint,
        { method: 'GET' }
      );

      console.log('📋 Raw API data:', {
        user_name,
        total: data.total,
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
        total: sortedAccounts.length,
      };

      // Cache the result for 60 seconds
      this.accountCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Failed to get accounts usage:', error);
      throw error;
    }
  }

  /**
   * Get categories usage for a specific user or all categories
   * Returns all existing categories with smart sorting:
   * - Top: Categories user has used (usage_count > 0), sorted high to low
   * - Bottom: Categories user hasn't used (usage_count = 0)
   *
   * Uses 5-minute cache to reduce API calls
   *
   * @param user_name - Optional username to sort categories by usage
   * @param type - Optional transaction type filter: 'withdrawal' for expenses, 'deposit' for income
   */
  public async getCategoriesUsage(user_name?: string, type?: 'withdrawal' | 'deposit'): Promise<CategoriesUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      // Generate cache key including type parameter
      const cacheKey = `${user_name || 'all'}_${type || 'all'}`;

      // Check cache first
      const cachedData = this.categoryCache.get(cacheKey);
      if (cachedData) {
        console.log('💾 Using cached categories for:', cacheKey);
        return cachedData;
      }

      console.log('🔄 Fetching fresh categories for:', cacheKey);

      // Build URL with optional user_name and type query parameters
      const params = new URLSearchParams();
      if (user_name) params.append('user_name', user_name);
      if (type) params.append('type', type);
      const queryString = params.toString();
      const endpoint = queryString
        ? `/api/v1/get_categories_usage?${queryString}`
        : '/api/v1/get_categories_usage';

      const data = await this.makeRequest<CategoriesUsageResponse>(
        endpoint,
        { method: 'GET' }
      );

      console.log('📋 Raw categories API data:', {
        user_name,
        total: data.total,
        categoryCount: data.get_categories_usage.length,
        firstCategory: data.get_categories_usage[0]
      });

      // If no username provided, return all categories as-is
      if (!user_name) {
        console.log('✅ Returning all categories (no sorting)');
        return data;
      }

      // Smart sorting for specific user
      const allCategories = data.get_categories_usage;

      // Get all unique category names from API response
      const uniqueCategoryNames = new Set<string>(
        allCategories.map(cat => cat.category_name)
      );

      console.log('🔍 Category extraction:', {
        totalRows: allCategories.length,
        uniqueCategories: uniqueCategoryNames.size,
        categoryNames: Array.from(uniqueCategoryNames)
      });

      // Separate into used and unused categories for this user
      const usedCategories = allCategories.filter(
        category => category.user_name === user_name && category.usage_count > 0
      );

      console.log('📊 User category filtering:', {
        user_name,
        usedCategoriesCount: usedCategories.length,
        usedCategories: usedCategories.map(c => ({ name: c.category_name, usage: c.usage_count }))
      });

      // Find categories this user hasn't used
      const usedCategoryNames = new Set(usedCategories.map(cat => cat.category_name));
      const unusedCategoryNames = Array.from(uniqueCategoryNames).filter(
        name => !usedCategoryNames.has(name)
      );

      console.log('🔍 Unused categories:', {
        unusedCount: unusedCategoryNames.length,
        unusedNames: unusedCategoryNames
      });

      // Sort used categories by usage_count (high to low)
      usedCategories.sort((a, b) => b.usage_count - a.usage_count);

      // Create placeholder entries for unused categories
      const categoryIdMap = new Map(
        allCategories.map(cat => [cat.category_name, cat.category_id])
      );

      const unusedCategories: CategoryUsage[] = unusedCategoryNames.map(category_name => ({
        user_name: user_name,
        category_name: category_name,
        category_id: categoryIdMap.get(category_name) || 0,
        usage_count: 0,
        created_at: null,
        updated_at: null,
      }));

      // Combine: used categories first, then unused
      const sortedCategories = [...usedCategories, ...unusedCategories];

      console.log('✅ Smart sorted category results:', {
        requestedUser: user_name,
        usedCount: usedCategories.length,
        unusedCount: unusedCategories.length,
        totalCount: sortedCategories.length,
        topCategory: sortedCategories[0]?.category_name,
        topUsage: sortedCategories[0]?.usage_count,
        sortedOrder: sortedCategories.map(c => ({ name: c.category_name, usage: c.usage_count }))
      });

      const result = {
        ...data,
        get_categories_usage: sortedCategories,
        total: sortedCategories.length,
      };

      // Cache the result for 1 minute
      this.categoryCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Failed to get categories usage:', error);
      throw error;
    }
  }

  /**
   * Get destination name usage data with optional filtering
   * Returns destination list optionally filtered by user and/or category
   *
   * @param user_name - Optional username to filter destinations
   * @param categoryId - Optional category ID to filter destinations by category
   * @returns Destination list for the specified user/category
   */
  public async getDestinationNameUsage(user_name?: string, categoryId?: number): Promise<DestinationNameUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (user_name) params.append('user_name', user_name);
      if (categoryId) params.append('category_id', categoryId.toString());
      const queryString = params.toString();
      const endpoint = queryString
        ? `/api/v1/get_destination_name_usage?${queryString}`
        : '/api/v1/get_destination_name_usage';

      const data = await this.makeRequest<DestinationNameUsageResponse>(
        endpoint,
        { method: 'GET' }
      );

      console.log('🏪 Fetched destinations from API:', {
        filters: { user_name, categoryId },
        total: data.total,
        sample: data.get_destination_name_usage.slice(0, 3).map(d => ({
          name: d.destination_name,
          category: d.category_name,
          user: d.user_name,
          usage: d.usage_count
        }))
      });

      return data;
    } catch (error) {
      console.error('Failed to get destination names:', error);
      throw error;
    }
  }

  /**
   * Get Telegram user data from backend
   * Returns user photo, bio, and user ID validated through Telegram
   */
  public async getTelegramUser(): Promise<TelegramUserData> {
    try {
      if (!this.isConfigured()) {
        console.warn('⚠️ Sync API not configured');
        return {
          success: false,
          message: 'Sync API not configured on client',
          timestamp: new Date().toISOString(),
          userData: null
        };
      }

      console.log('📸 Fetching Telegram user data from backend');

      const data = await this.makeRequest<TelegramUserData>('/api/v1/tgUser', { method: 'POST' });

      if (data.success) {
        console.log('✅ Successfully fetched Telegram user data:', data.userData);
      } else {
        console.error('❌ Backend returned error:', data.message);
      }

      return data;
    } catch (error) {
      console.error('💥 Error fetching Telegram user data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        userData: null
      };
    }
  }

  /**
   * Get exchange rate for currency conversion
   * Converts amount from one currency to another with 1-hour caching
   *
   * @param from - Source currency code (e.g., "UAH")
   * @param to - Target currency code (e.g., "EUR")
   * @param amount - Amount to convert (default: 1.0)
   * @returns Converted amount or null if conversion fails
   */
  public async getExchangeRate(from: string, to: string, amount: number = 1.0): Promise<number | null> {
    try {
      if (!this.isConfigured()) {
        console.warn('⚠️ Sync API not configured, cannot get exchange rate');
        return null;
      }

      // Normalize currency codes
      const fromCode = from.toUpperCase();
      const toCode = to.toUpperCase();

      // Check cache first
      const cachedRate = this.getExchangeRateFromCache(fromCode, toCode);
      if (cachedRate !== null) {
        // Apply amount to cached rate
        const convertedAmount = cachedRate * amount;
        console.log('💱 Using cached exchange rate:', {
          from: fromCode,
          to: toCode,
          amount,
          rate: cachedRate,
          convertedAmount
        });
        return convertedAmount;
      }

      // Build URL with query parameters
      const params = new URLSearchParams({
        from: fromCode,
        to: toCode,
        amount: String(amount)
      });

      const endpoint = `/api/v1/exchange_rate?${params.toString()}`;

      console.log('💱 Fetching fresh exchange rate:', {
        from: fromCode,
        to: toCode,
        amount,
        endpoint
      });

      const data = await this.makeRequest<any>(endpoint, { method: 'GET' });

      // Extract converted amount from response
      // API returns: { success: true, exchangeData: { exchangeAmount: number } }
      let convertedAmount: number | null = null;

      if (data.exchangeData && typeof data.exchangeData.exchangeAmount === 'number') {
        convertedAmount = data.exchangeData.exchangeAmount;
      } else if (data.result && typeof data.result === 'number') {
        convertedAmount = data.result;
      } else if (data.converted_amount && typeof data.converted_amount === 'number') {
        convertedAmount = data.converted_amount;
      }

      if (convertedAmount === null || typeof convertedAmount !== 'number') {
        console.error('❌ Invalid exchange rate response format:', data);
        return null;
      }

      // Calculate and cache the exchange rate (1 unit conversion)
      const rate = convertedAmount / amount;
      this.setExchangeRateCache(fromCode, toCode, rate);

      console.log('✅ Exchange rate conversion successful:', {
        from: fromCode,
        to: toCode,
        originalAmount: amount,
        convertedAmount,
        rate
      });

      return convertedAmount;
    } catch (error) {
      console.error('💥 Exchange rate conversion error:', error);
      return null;
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
