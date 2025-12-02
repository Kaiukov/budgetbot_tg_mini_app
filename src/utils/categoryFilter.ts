/**
 * Category Filtering Utility
 * Filters categories by transaction type (deposit only)
 * Withdrawal and transfer flows show ALL categories
 */

import categoryConfig from '../config/categories.json';
import type { CategoryUsage } from '../services/sync';

const enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

export type TransactionType = 'withdrawal' | 'deposit' | 'transfer';

/**
 * Filter categories by transaction type
 *
 * IMPORTANT: Only filters for DEPOSIT transactions (category_id: 4)
 * Withdrawal and transfer transactions show ALL categories (backend handles filtering via type parameter)
 *
 * @param categories - Full list of categories from API
 * @param type - Transaction type (withdrawal, deposit, transfer)
 * @returns Filtered category list (or all categories for withdrawal/transfer)
 */
export function filterCategoriesByType(
  categories: CategoryUsage[],
  type: TransactionType
): CategoryUsage[] {
  // Only filter for deposit - show only category_id: 4
  if (type === 'deposit') {
    const allowedIds = categoryConfig.deposit;
    const filtered = categories.filter(cat => allowedIds.includes(cat.category_id));

    if (enableDebugLogs) {
      console.log('🔍 Category filtering for DEPOSIT:', {
        type,
        totalCategories: categories.length,
        filteredCategories: filtered.length,
        allowedIds,
        filteredNames: filtered.map(c => c.category_name)
      });
    }

    return filtered;
  }

  // For withdrawal and transfer - return ALL categories (backend handles filtering via type parameter)
  if (enableDebugLogs) {
    console.log('🔍 Category filtering for WITHDRAWAL/TRANSFER:', {
      type,
      totalCategories: categories.length,
      note: 'Backend handles type filtering - showing categories as received'
    });
  }

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
  if (type === 'deposit') {
    return categoryConfig.deposit.includes(categoryId);
  }

  // All categories allowed for withdrawal and transfer
  return true;
}
