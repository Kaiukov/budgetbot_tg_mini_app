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
   * Get exchange rate for currency conversion with 1-hour caching
   * Returns converted amount for the requested value
   */
  public async getExchangeRate(from: string, to: string, amount: number = 1.0): Promise<number | null> {
    const source = from.toUpperCase();
    const target = to.toUpperCase();

    if (!Number.isFinite(amount) || amount <= 0) {
      console.warn('⚠️ Invalid amount for exchange rate', { from: source, to: target, amount });
      return null;
    }

    // Check cache first (rate cached, not converted amount)
    const cachedRate = this.getExchangeRateFromCache(source, target);
    if (cachedRate !== null) {
      return cachedRate * amount;
    }

    if (!this.isConfigured()) {
      console.warn('⚠️ Sync API not configured, cannot fetch exchange rate');
      return null;
    }

    const params = new URLSearchParams({
      from: source,
      to: target,
      amount: String(amount),
    });

    const url = `${this.getBaseUrl()}/api/v1/exchange_rate?${params.toString()}`;
    const anonKey = this.getAnonKey();
    const { default: telegramService } = await import('../telegram');
    const initData = telegramService.getInitData();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Anonymous-Key': anonKey as string,
          ...(initData && { 'X-Telegram-Init-Data': initData }),
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Exchange rate request failed:', response.status, response.statusText);
        return null;
      }

      const data = await response.json() as Record<string, unknown>;

      let converted: number | null = null;
      let rate: number | null = null;

      if (data.exchangeData && typeof (data.exchangeData as Record<string, unknown>).exchangeAmount === 'number') {
        converted = (data.exchangeData as Record<string, unknown>).exchangeAmount as number;
      } else if (typeof (data as Record<string, unknown>).converted_amount === 'number') {
        converted = (data as Record<string, unknown>).converted_amount as number;
      } else if (typeof (data as Record<string, unknown>).result === 'number') {
        converted = (data as Record<string, unknown>).result as number;
      } else if (typeof (data as Record<string, unknown>).exchange_rate === 'number') {
        rate = (data as Record<string, unknown>).exchange_rate as number;
      }

      if (converted !== null && Number.isFinite(converted)) {
        rate = converted / amount;
      }

      if (rate !== null && Number.isFinite(rate)) {
        this.setExchangeRateCache(source, target, rate);
        if (converted === null) {
          converted = rate * amount;
        }
      }

      if (converted === null || !Number.isFinite(converted)) {
        console.error('❌ Invalid exchange rate response:', data);
        return null;
      }

      return converted;
    } catch (error) {
      console.error('💥 Exchange rate fetch error:', error);

      // Fallback to cache if available (even if API call failed)
      const fallbackRate = this.getExchangeRateFromCache(source, target);
      if (fallbackRate !== null) {
        return fallbackRate * amount;
      }

      return null;
    }
  }
}
