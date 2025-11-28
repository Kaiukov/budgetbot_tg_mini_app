/**
 * Sync API Service - Balance Operations
 * Handles balance and exchange rate operations
 */

import type { CurrentBalanceResponse } from './types';
import { SyncServiceCore } from './core';

export class SyncServiceBalance extends SyncServiceCore {
  /**
   * Get current balance from the API with 5-minute caching
   */
  public async fetchCurrentBalance(): Promise<number> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      const data = await this.makeRequest<CurrentBalanceResponse>(
        '/api/v1/get_current_balance',
        { method: 'GET' }
      );

      return data.get_current_balance[0]?.balance_in_USD || 0;
    } catch (error) {
      console.error('Failed to fetch current balance:', error);
      throw error;
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

      // Use makeRequest to include Telegram initData authentication
      const data = await this.makeRequest<Record<string, unknown>>(endpoint, {
        method: 'GET'
      });

      // Extract converted amount from response
      // API returns: { success: true, exchangeData: { exchangeAmount: number } }
      let convertedAmount: number | null = null;

      if ('exchangeData' in data && data.exchangeData && typeof data.exchangeData === 'object' && data.exchangeData !== null) {
        const exchangeData = data.exchangeData as Record<string, unknown>;
        if ('exchangeAmount' in exchangeData && typeof exchangeData.exchangeAmount === 'number') {
          convertedAmount = exchangeData.exchangeAmount;
        }
      } else if ('result' in data && typeof data.result === 'number') {
        convertedAmount = data.result;
      } else if ('converted_amount' in data && typeof data.converted_amount === 'number') {
        convertedAmount = data.converted_amount;
      }

      if (convertedAmount === null || typeof convertedAmount !== 'number') {
        console.error('❌ Invalid exchange rate response format:', data);
        return null;
      }

      // Calculate the exchange rate (1 unit conversion)
      const rate = convertedAmount / amount;

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
}
