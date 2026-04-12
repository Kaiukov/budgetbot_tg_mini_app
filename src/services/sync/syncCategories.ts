/**
 * Sync API - Category Operations
 * Provides methods for fetching category data from Sync API
 * Includes smart sorting: used categories (high to low) then unused categories
 * All operations use 5-minute caching to reduce API calls
 */

import { Cache } from '../../utils/cache';
import { apiClient } from './apiClient';

// ============================================================================
// Type Definitions
// ============================================================================

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

// ============================================================================
// Categories Service
// ============================================================================

class CategoriesService {
  // Category cache with 5-minute expiry
  private categoryCache: Cache<CategoriesUsageResponse>;
  private readonly CATEGORY_CACHE_EXPIRY_MS = 300000; // 5 minutes in milliseconds

  constructor() {
    // Initialize category cache with 5-minute expiry
    this.categoryCache = new Cache<CategoriesUsageResponse>(
      this.CATEGORY_CACHE_EXPIRY_MS,
      'category_'
    );

    console.log('🔧 CategoriesService initialized');
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
        ? `/api/v1/read-model/categories/usage?${queryString}`
        : '/api/v1/read-model/categories/usage';

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

      // Cache the result for 5 minutes
      this.categoryCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Failed to get categories usage:', error);
      throw error;
    }
  }

  /**
   * Clear category cache (useful for forcing a refresh)
   */
  public clearCaches(): void {
    console.log('🗑️ Clearing category cache');
    this.categoryCache.clear();
  }
}

// Export singleton instance
export const categoriesService = new CategoriesService();
