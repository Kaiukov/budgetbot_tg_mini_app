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
  // Deposit categories are already filtered by backend; keep config whitelist but fall back to full list
  if (type === 'deposit') {
    const allowedIds = categoryConfig.deposit;
    const filtered = allowedIds?.length
      ? categories.filter(cat => allowedIds.includes(Number(cat.category_id)))
      : categories;

    if (enableDebugLogs) {
      console.log('🔍 Category filtering for DEPOSIT:', {
        type,
        totalCategories: categories.length,
        filteredCategories: filtered.length,
        allowedIds,
        filteredNames: filtered.map(c => c.category_name)
      });
    }

    // If filtering removes everything (e.g., config mismatch), show all categories to avoid empty UI
    return filtered.length > 0 ? filtered : categories;
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
    const allowedIds = categoryConfig.deposit;
    return !allowedIds?.length || allowedIds.includes(Number(categoryId));
  }

  // All categories allowed for withdrawal and transfer
  return true;
}
