/**
 * Sync API Service - Telegram User Profile
 * Handles Telegram user data retrieval and transaction creation
 */

import type { TelegramUserData, ExpenseTransactionData, IncomeTransactionData, TransferTransactionData } from './types';
import { SyncServiceDestinations } from './destinations';
import { SyncServiceTransactions } from './transactions';

// Create a combined service class with both Destinations and Transactions
export class SyncServiceUser extends SyncServiceDestinations {
  // Mixin transaction methods from SyncServiceTransactions
  private transactionService = new SyncServiceTransactions();
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

      // Get Telegram initData for the request body
      const { default: telegramService } = await import('../telegram');
      const initData = telegramService.getInitData();

      const data = await this.makeRequest<TelegramUserData>('/api/v1/tgUser', {
        method: 'POST',
        body: { initData }
      });

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
   * Check Sync API connection
   * Override from core service with complete implementation
   */
  public override async checkConnection(): Promise<{
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

  /**
   * Delegate transaction creation to transaction service
   */
  public async addTransaction(
    body: ExpenseTransactionData | IncomeTransactionData | TransferTransactionData,
    transactionType: string,
    enableVerification: boolean = true
  ) {
    return this.transactionService.addTransaction(body, transactionType, enableVerification);
  }

  /**
   * Delegate transaction deletion to transaction service
   */
  public async deleteTransaction(transactionId: string) {
    return this.transactionService.deleteTransaction(transactionId);
  }

  /**
   * Delegate transaction update to transaction service
   */
  public async updateTransaction(transactionId: string, payload: unknown) {
    return this.transactionService.updateTransaction(transactionId, payload);
  }

  /**
   * Delegate transaction fetching to transaction service
   */
  public async fetchTransactions(page: number = 1, limit: number = 50) {
    return this.transactionService.fetchTransactions(page, limit);
  }

  /**
   * Delegate single transaction fetching to transaction service
   */
  public async fetchTransactionById(id: string) {
    return this.transactionService.fetchTransactionById(id);
  }
}
