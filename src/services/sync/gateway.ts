/**
 * Sync Service Gateway
 * Simple facade consolidating all API operations into single entry point
 * Delegates to domain modules for clean separation of concerns
 *
 * Usage:
 *   import { gateway } from '../services/sync/gateway';
 *   const accounts = await gateway.getAccounts('username');
 */

import { syncService } from '../sync';
import type { AccountUsage, CategoryUsage, DestinationSuggestion, SourceSuggestion } from '../sync';
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  fetchTransactions,
  fetchTransactionById,
  getExchangeRate,
  getExchangeRateOnly,
  needsConversion
} from './index';
import type { DisplayTransaction } from '../../types/transaction';

/**
 * Gateway class - single entry point for all sync/firefly API operations
 * No interceptors or complex logic - just delegation to domain modules
 */
class Gateway {
  /**
   * Account Operations (2 methods)
   */

  async getAccounts(user_name?: string): Promise<AccountUsage[]> {
    const response = await syncService.getAccountsUsage(user_name);
    return response.get_accounts_usage || [];
  }

  async getBalance(): Promise<number> {
    return syncService.fetchCurrentBalance();
  }

  /**
   * Category Operations (1 method)
   */

  async getCategories(
    user_name?: string,
    type?: 'withdrawal' | 'deposit'
  ): Promise<CategoryUsage[]> {
    const response = await syncService.getCategoriesUsage(user_name, type);
    return response.get_categories_usage || [];
  }

  /**
   * Destination & Source Suggestions (2 methods)
   */

  async getDestinationSuggestions(
    user_name?: string,
    categoryId?: number
  ): Promise<DestinationSuggestion[]> {
    const response = await syncService.getDestinationNameUsage(user_name, categoryId);
    return response.get_destination_name_usage || [];
  }

  async getSourceSuggestions(
    user_name?: string,
    categoryId?: number
  ): Promise<SourceSuggestion[]> {
    const response = await syncService.getSourceNameUsage(user_name, categoryId);
    return response.get_source_name_usage || [];
  }

  /**
   * Transaction Operations (5 methods)
   */

  async fetchTransactions(page?: number, limit?: number): Promise<DisplayTransaction[]> {
    const result = await fetchTransactions(page, limit);
    return result.transactions || [];
  }

  async fetchTransactionById(transactionId: string): Promise<DisplayTransaction | undefined> {
    const result = await fetchTransactionById(transactionId);
    return result.transaction;
  }

  async createTransaction(
    type: 'withdrawal' | 'deposit' | 'transfer',
    data: any,
    enableVerification?: boolean
  ): Promise<void> {
    await addTransaction(data, type, enableVerification);
  }

  async updateTransaction(
    transactionId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await updateTransaction(transactionId, data);
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await deleteTransaction(transactionId);
  }

  /**
   * Currency Operations (2 methods)
   */

  async getExchangeRate(
    from: string,
    to: string,
    amount?: number
  ): Promise<number | null> {
    return getExchangeRate(from, to, amount);
  }

  async getExchangeRateOnly(from: string, to: string): Promise<number | null> {
    return getExchangeRateOnly(from, to);
  }

  /**
   * Utility Methods (2 methods)
   */

  async checkHealth(): Promise<{ success: boolean; message: string }> {
    return syncService.checkConnection();
  }

  needsCurrencyConversion(from: string, to: string): boolean {
    return needsConversion(from, to);
  }
}

// Export singleton instance
export const gateway = new Gateway();
