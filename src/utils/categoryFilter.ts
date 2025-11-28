/**
 * Category Filtering Utility
 * Backend API handles filtering by type (deposit/withdrawal)
 * This utility is now a pass-through for backend-filtered results
 */

import type { CategoryUsage } from '../services/sync';

export type TransactionType = 'expense' | 'income' | 'transfer';

/**
 * Filter categories by transaction type
 *
 * IMPORTANT: Backend API already filters by type (deposit/withdrawal)
 * This function is now a pass-through - no client-side filtering needed
 *
 * @param categories - Full list of categories from API (already filtered by backend)
 * @param type - Transaction type (expense, income, transfer)
 * @returns All categories from API (backend handles filtering)
 */
export function filterCategoriesByType(
  categories: CategoryUsage[],
  type: TransactionType
): CategoryUsage[] {
  // Backend already filters by type=deposit (income) or type=withdrawal (expense)
  // No client-side filtering needed - return all categories from API
  console.log('🔍 Category filtering for', type.toUpperCase() + ':', {
    type,
    totalCategories: categories.length,
    note: 'Backend filtered, showing all API results',
    categoryNames: categories.map(c => c.category_name)
  });

  return categories;
}

/**
 * Check if a category is allowed for the given transaction type
 *
 * @param _categoryId - Category ID to check (unused - backend handles filtering)
 * @param _type - Transaction type (unused - backend handles filtering)
 * @returns true - all categories allowed (backend pre-filtered)
 *
 * DEPRECATED: Backend API handles filtering, this function no longer needed
 */
export function isCategoryAllowed(
  _categoryId: number,
  _type: TransactionType
): boolean {
  // Backend handles all filtering - allow all categories
  // Keep this function for backward compatibility but always return true
  console.warn('⚠️ isCategoryAllowed is deprecated - backend handles filtering');
  return true;
}
