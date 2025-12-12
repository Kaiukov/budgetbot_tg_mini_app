/**
 * Sync API Service - Facade
 * Provides unified entry point for all Sync API operations
 * This file re-exports from domain-specific modules for better organization
 *
 * Module Organization:
 * - syncAccounts.ts: Account fetching and balance operations
 * - syncCategories.ts: Category fetching and sorting
 * - syncDestinationSourceNames.ts: Destination/source suggestions
 * - auth.ts: Tier 2 authentication helpers
 * - cache.ts: Cache management utilities
 * - addTransactions.ts: Transaction creation operations
 * - getTransactions.ts: Transaction fetching operations
 */

// ============================================================================
// Account Operations
// ============================================================================
export { accountsService } from './sync/syncAccounts';
export type { AccountUsage, AccountsUsageResponse, CurrentBalanceResponse } from './sync/syncAccounts';

// ============================================================================
// Category Operations
// ============================================================================
export { categoriesService } from './sync/syncCategories';
export type { CategoryUsage, CategoriesUsageResponse } from './sync/syncCategories';

// ============================================================================
// Destination & Source Operations
// ============================================================================
export { destinationSourceService } from './sync/syncDestinationSourceNames';
export type {
  DestinationSuggestion,
  DestinationNameUsageResponse,
  SourceSuggestion,
  SourceNameUsageResponse,
} from './sync/syncDestinationSourceNames';

// ============================================================================
// Authentication
// ============================================================================
export { authService } from './sync/auth';

// ============================================================================
// Cache Management
// ============================================================================
export { cacheManager, exchangeRateCacheManager } from './sync/cache';
export type { ExchangeRateCache } from './sync/cache';

// ============================================================================
// API Client (HTTP Layer)
// ============================================================================
export { apiClient } from './sync/apiClient';

// ============================================================================
// Legacy SyncService Wrapper for Backward Compatibility
// ============================================================================

import { accountsService } from './sync/syncAccounts';
import { categoriesService } from './sync/syncCategories';
import { destinationSourceService } from './sync/syncDestinationSourceNames';
import { authService } from './sync/auth';

/**
 * Unified SyncService for backward compatibility
 * Delegates to domain-specific services
 * @deprecated Use individual services (accountsService, categoriesService, etc.) instead
 */
class SyncService {
  /**
   * Get current balance
   * @deprecated Use accountsService.getCurrentBalance() instead
   */
  public async fetchCurrentBalance(): Promise<number> {
    return accountsService.getCurrentBalance();
  }

  /**
   * Get accounts usage
   * @deprecated Use accountsService.getAccountsUsage() instead
   */
  public async getAccountsUsage(user_name?: string) {
    return accountsService.getAccountsUsage(user_name);
  }

  /**
   * Get categories usage
   * @deprecated Use categoriesService.getCategoriesUsage() instead
   */
  public async getCategoriesUsage(user_name?: string, type?: 'withdrawal' | 'deposit') {
    return categoriesService.getCategoriesUsage(user_name, type);
  }

  /**
   * Get destination name usage
   * @deprecated Use destinationSourceService.getDestinationNameUsage() instead
   */
  public async getDestinationNameUsage(user_name?: string, categoryId?: number) {
    return destinationSourceService.getDestinationNameUsage(user_name, categoryId);
  }

  /**
   * Get source name usage
   * @deprecated Use destinationSourceService.getSourceNameUsage() instead
   */
  public async getSourceNameUsage(user_name?: string, categoryId?: number) {
    return destinationSourceService.getSourceNameUsage(user_name, categoryId);
  }

  /**
   * Get telegram user data
   * Note: This method needs to be added to the destination/source service
   * For now, returning a stub implementation
   */
  public async getTelegramUser() {
    return {
      success: false,
      message: 'getTelegramUser moved to a separate service',
      timestamp: new Date().toISOString(),
      userData: null
    };
  }

  /**
   * Get exchange rate and convert amount
   * @deprecated Use exchangeRateService.getExchangeRate() instead
   */
  public async getExchangeRate(from: string, to: string, amount: number = 1.0): Promise<number | null> {
    const { getExchangeRate } = await import('./sync/exchangeRate');
    return getExchangeRate(from, to, amount);
  }

  /**
   * Check service configuration
   */
  public isConfigured(): boolean {
    return authService.isAuthenticated();
  }

  /**
   * Check service connection
   */
  public async checkConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Simple health check by fetching account usage
      const result = await this.getAccountsUsage();
      return {
        success: !!result && result.success,
        message: result?.message || 'Connection successful',
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();

// ============================================================================
// Types (Re-exports from modules)
// ============================================================================

export type {
  TransactionType,
  BaseTransactionData,
  WithdrawalTransactionData,
  DepositTransactionData,
  TransferTransactionData,
  WithdrawalWebhookPayload,
  DepositWebhookPayload,
  TransferWebhookPayload,
  UnifiedWebhookPayload,
  FireflyTransactionPayload,
  FireflyCreateTransactionRequest,
  FireflyTransactionResponse,
  TransactionResult,
  VerificationResponse,
} from './sync/types';

// Note: Transaction operations (addTransaction, fetchTransactions, etc.) are in separate modules
// Import from './sync/addTransactions' and './sync/getTransactions' instead
