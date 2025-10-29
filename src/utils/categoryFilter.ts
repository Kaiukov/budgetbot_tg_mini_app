/**
 * Category Filtering Utility
 * Filters categories by transaction type (income only)
 * Expense and transfer flows show ALL categories
 */

import categoryConfig from '../config/categories.json';
import type { CategoryUsage } from '../services/sync';

export type TransactionType = 'expense' | 'income' | 'transfer';

/**
 * Filter categories by transaction type
 *
 * IMPORTANT: Only filters for INCOME transactions (category_id: 4)
 * Expense and transfer transactions show ALL categories
 *
 * @param categories - Full list of categories from API
 * @param type - Transaction type (expense, income, transfer)
 * @returns Filtered category list (or all categories for expense/transfer)
 */
export function filterCategoriesByType(
  categories: CategoryUsage[],
  type: TransactionType
): CategoryUsage[] {
  // Only filter for income - show only category_id: 4
  if (type === 'income') {
    const allowedIds = categoryConfig.income;
    const filtered = categories.filter(cat => allowedIds.includes(cat.category_id));

    console.log('🔍 Category filtering for INCOME:', {
      type,
      totalCategories: categories.length,
      filteredCategories: filtered.length,
      allowedIds,
      filteredNames: filtered.map(c => c.category_name)
    });

    return filtered;
  }

  // For expense and transfer - return ALL categories (no filtering)
  console.log('🔍 Category filtering for EXPENSE/TRANSFER:', {
    type,
    totalCategories: categories.length,
    note: 'No filtering applied - showing all categories'
  });

  return categories;
}

/**
 * Check if a category is allowed for the given transaction type
 *
 * @param categoryId - Category ID to check
 * @param type - Transaction type
 * @returns true if category is allowed for this transaction type
 */
export function isCategoryAllowed(
  categoryId: number,
  type: TransactionType
): boolean {
  if (type === 'income') {
    return categoryConfig.income.includes(categoryId);
  }

  // All categories allowed for expense and transfer
  return true;
}
