/**
 * Lightweight exchange rate helper with 6-hour caching
 * Uses Sync API `/api/v1/exchange_rate` endpoint
 */

import { DualLayerCache } from '../../utils/cache';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// Cache key format: "FROM:TO" (e.g., "USD:EUR")
const exchangeCache = new DualLayerCache<number>({
  ttl: SIX_HOURS_MS,
  prefix: 'exchange_rate_',
});

const getBaseUrl = (): string => {
  const isProduction = typeof window !== 'undefined' &&
    (window.location.hostname.includes('workers.dev') ||
     window.location.hostname.includes('pages.dev'));

  // In dev we rely on Vite proxy (empty base URL)
  return isProduction ? import.meta.env.VITE_BASE_URL || '' : '';
};

/**
 * Fetch exchange rate (1 unit) with 6-hour cache
 */
export async function fetchExchangeRate(from: string, to: string): Promise<number | null> {
  const source = from.toUpperCase();
  const target = to.toUpperCase();
  const cacheKey = `${source}:${target}`;

  const cached = exchangeCache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const anonKey = import.meta.env.VITE_SYNC_API_KEY;
  if (!anonKey) {
    console.warn('⚠️ Sync API key not configured, cannot fetch exchange rate');
    return null;
  }

  const params = new URLSearchParams({
    from: source,
    to: target,
    amount: '1', // 1-unit conversion gives the direct rate
  });

  const url = `${getBaseUrl()}/api/v1/exchange_rate?${params.toString()}`;

  const { default: telegramService } = await import('../telegram');
  const initData = telegramService.getInitData();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Anonymous-Key': anonKey,
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

    let rate: number | null = null;

    if ('exchangeData' in data && data.exchangeData && typeof data.exchangeData === 'object') {
      const exchangeData = data.exchangeData as Record<string, unknown>;
      if ('exchangeAmount' in exchangeData && typeof exchangeData.exchangeAmount === 'number') {
        rate = exchangeData.exchangeAmount;
      }
    } else if ('result' in data && typeof data.result === 'number') {
      rate = data.result;
    } else if ('converted_amount' in data && typeof data.converted_amount === 'number') {
      rate = data.converted_amount;
    } else if ('exchange_rate' in data && typeof data.exchange_rate === 'number') {
      rate = data.exchange_rate;
    }

    if (rate === null || Number.isNaN(rate)) {
      console.error('❌ Invalid exchange rate response:', data);
      return null;
    }

    exchangeCache.set(cacheKey, rate);
    return rate;
  } catch (error) {
    console.error('💥 Exchange rate fetch error:', error);
    return null;
  }
}
