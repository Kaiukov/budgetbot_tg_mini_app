/**
 * Sync API - Exchange Rate Service
 * Provides currency conversion with caching (memory + localStorage)
 * Handles non-EUR to EUR conversion for transaction forms
 *
 * API Response Format:
 * {
 *   success: true,
 *   exchangeData: {
 *     exchangeAmount: 110.5  // Converted amount (e.g., 100 USD * 1.105 = 110.5 EUR)
 *   }
 * }
 */

import { apiClient } from './apiClient';
import { exchangeRateCacheManager } from './cache';

interface ExchangeRateResponse {
  success?: boolean;
  exchangeData?: {
    exchangeAmount: number;
  };
  // Alternative formats the backend might return
  result?: number;
  converted_amount?: number;
}

/**
 * Get exchange rate and convert amount
 * Returns converted amount or null if conversion fails
 * Uses cache (memory first, then localStorage) with 1-hour TTL
 *
 * @param from Source currency code (e.g., "USD")
 * @param to Destination currency code (e.g., "EUR")
 * @param amount Amount to convert (default: 1.0 for rate lookup)
 * @returns Converted amount or null if unavailable
 */
export async function getExchangeRate(
  from: string,
  to: string,
  amount: number = 1.0
): Promise<number | null> {
  try {
    // Same currency - no conversion needed
    if (from.toUpperCase() === to.toUpperCase()) {
      return amount;
    }

    const normalizedFrom = from.toUpperCase();
    const normalizedTo = to.toUpperCase();

    // Check cache first (memory + localStorage with TTL)
    const cachedRate = exchangeRateCacheManager.get(normalizedFrom, normalizedTo);
    if (cachedRate !== null) {
      const convertedAmount = amount * cachedRate;
      console.log('💱 Exchange rate from cache:', { from: normalizedFrom, to: normalizedTo, rate: cachedRate, amount, converted: convertedAmount });
      return convertedAmount;
    }

    // Fetch from API if not cached
    console.log('💱 Fetching exchange rate from API:', { from: normalizedFrom, to: normalizedTo, amount });

    const response = await apiClient.request<ExchangeRateResponse>(
      `/api/v1/exchange-rate?from=${normalizedFrom}&to=${normalizedTo}&amount=${amount}`,
      {
        method: 'GET',
        auth: 'tier2'
      }
    );

    // Extract converted amount from response (supports multiple formats)
    let convertedAmount: number | null = null;

    if (response?.exchangeData?.exchangeAmount && typeof response.exchangeData.exchangeAmount === 'number') {
      convertedAmount = response.exchangeData.exchangeAmount;
    } else if (response?.result && typeof response.result === 'number') {
      convertedAmount = response.result;
    } else if (response?.converted_amount && typeof response.converted_amount === 'number') {
      convertedAmount = response.converted_amount;
    }

    if (convertedAmount !== null && convertedAmount > 0) {
      // Calculate and cache the exchange rate (rate per 1 unit)
      const rate = convertedAmount / amount;
      exchangeRateCacheManager.set(normalizedFrom, normalizedTo, rate);

      console.log('💱 Exchange rate fetched and cached:', { from: normalizedFrom, to: normalizedTo, rate, amount, converted: convertedAmount });
      return convertedAmount;
    }

    // API returned invalid response
    console.warn('⚠️ Exchange rate API returned invalid response:', response);
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ Failed to get exchange rate:', { from, to, amount, error: errorMessage });
    return null;
  }
}

/**
 * Get exchange rate (rate only, not converted amount)
 * Useful for displaying current rate without conversion
 *
 * @param from Source currency code
 * @param to Destination currency code
 * @returns Exchange rate (e.g., 1.1 for 1 USD = 1.1 EUR) or null
 */
export async function getExchangeRateOnly(
  from: string,
  to: string
): Promise<number | null> {
  try {
    // Same currency - rate is 1
    if (from.toUpperCase() === to.toUpperCase()) {
      return 1.0;
    }

    const normalizedFrom = from.toUpperCase();
    const normalizedTo = to.toUpperCase();

    // Check cache
    const cachedRate = exchangeRateCacheManager.get(normalizedFrom, normalizedTo);
    if (cachedRate !== null) {
      console.log('💱 Exchange rate from cache (rate only):', { from: normalizedFrom, to: normalizedTo, rate: cachedRate });
      return cachedRate;
    }

    // Fetch from API (amount=1 to get direct rate)
    const response = await apiClient.request<ExchangeRateResponse>(
      `/api/v1/exchange-rate?from=${normalizedFrom}&to=${normalizedTo}&amount=1`,
      {
        method: 'GET',
        auth: 'tier2'
      }
    );

    // Extract converted amount from response and convert to rate
    let convertedAmount: number | null = null;

    if (response?.exchangeData?.exchangeAmount && typeof response.exchangeData.exchangeAmount === 'number') {
      convertedAmount = response.exchangeData.exchangeAmount;
    } else if (response?.result && typeof response.result === 'number') {
      convertedAmount = response.result;
    } else if (response?.converted_amount && typeof response.converted_amount === 'number') {
      convertedAmount = response.converted_amount;
    }

    if (convertedAmount !== null && convertedAmount > 0) {
      // Rate is the converted amount (since amount=1)
      const rate = convertedAmount;
      exchangeRateCacheManager.set(normalizedFrom, normalizedTo, rate);
      console.log('💱 Exchange rate fetched and cached (rate only):', { from: normalizedFrom, to: normalizedTo, rate });
      return rate;
    }

    console.warn('⚠️ Exchange rate API returned invalid response:', response);
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ Failed to get exchange rate (rate only):', { from, to, error: errorMessage });
    return null;
  }
}

/**
 * Validate that conversion is needed
 * Returns true if currencies are different, false if same
 */
export function needsConversion(from: string, to: string): boolean {
  return from.toUpperCase() !== to.toUpperCase();
}

/**
 * Clear exchange rate cache
 * Useful for forcing refresh of rates
 */
export function clearCache(): void {
  exchangeRateCacheManager.clear();
  console.log('💱 Exchange rate cache cleared');
}
