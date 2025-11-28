/**
 * Sync API Service - Category Operations
 * Handles category usage queries and smart sorting
 */

import type {
  CategoriesUsageResponse,
  CategoryUsage
} from './types';
import { SyncServiceAccounts } from './accounts';

export class SyncServiceCategories extends SyncServiceAccounts {
  /**
   * Get categories usage for a specific user or all categories
   * Returns all existing categories with smart sorting:
   * - Top: Categories user has used (usage_count > 0), sorted high to low
   * - Bottom: Categories user hasn't used (usage_count = 0)
   *
   * Uses 1-minute cache to reduce API calls
   *
   * @param userName - Optional username to sort categories by usage
   * @param transactionType - Optional transaction type filter (withdrawal/deposit)
   */
  public async getCategoriesUsage(userName?: string, transactionType?: 'withdrawal' | 'deposit'): Promise<CategoriesUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      // NOTE: Caching now handled at utility layer (utils/cache.ts)
      console.log('🔄 Fetching categories for:', `${userName || 'all'}:${transactionType || 'all'}`);

      // Build URL with optional user_name and type query parameters
      const params = new URLSearchParams();
      if (userName) params.set('user_name', userName);
      if (transactionType) params.set('type', transactionType);

      const endpoint = `/api/v1/get_categories_usage${params.toString() ? `?${params.toString()}` : ''}`;

      const data = await this.makeRequest<CategoriesUsageResponse>(
        endpoint,
        { method: 'GET' }
      );

      console.log('📋 Raw categories API data:', {
        userName,
        transactionType,
        total: data.total,
        categoryCount: data.get_categories_usage.length,
        firstCategory: data.get_categories_usage[0]
      });

      // If no username provided, return all categories as-is
      if (!userName) {
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
        category => category.user_name === userName && category.usage_count > 0
      );

      console.log('📊 User category filtering:', {
        userName,
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
      const categoryId1Map = new Map(
        allCategories.map(cat => [cat.category_name, (cat as any).category_id1])
      );

      const unusedCategories: CategoryUsage[] = unusedCategoryNames.map(categoryName => ({
        user_name: userName,
        category_name: categoryName,
        category_id: categoryIdMap.get(categoryName) || 0,
        category_id1: categoryId1Map.get(categoryName),
        type: transactionType,
        usage_count: 0,
        global_usage: 0,
        user_has_used: false,
        created_at: null,
        updated_at: null,
      }));

      // Combine: used categories first, then unused
      const sortedCategories = [...usedCategories, ...unusedCategories];

      console.log('✅ Smart sorted category results:', {
        requestedUser: userName,
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

      // NOTE: Caching now handled at utility layer (utils/cache.ts)
      return result;
    } catch (error) {
      console.error('Failed to get categories usage:', error);
      throw error;
    }
  }
}
