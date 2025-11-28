import {
  currencyIconMap,
  currencyColorMap,
  currencyColorDefaults,
  type AccountIconType,
} from '../theme/dark/currencies';

/**
 * Get icon component based on currency code or account name
 * @param currencyCode - ISO currency code (e.g., 'USD', 'EUR')
 * @param accountName - Account name (fallback for detection)
 * @returns Icon component (either Lucide or custom React component)
 */
export const getAccountIcon = (currencyCode?: string, accountName?: string): AccountIconType => {
  // Primary: Use currency code if provided
  if (currencyCode && currencyIconMap[currencyCode.toUpperCase()]) {
    return currencyIconMap[currencyCode.toUpperCase()];
  }

  // Fallback: Detect from account name
  if (accountName) {
    const name = accountName.toLowerCase();
    if (name.includes('cash')) return currencyIconMap['USD'];
  }

  // Default fallback: Always use CreditCard for unknown currencies/accounts
  return currencyIconMap['RON'];
};

/**
 * Get color based on currency code or account name
 * @param currencyCode - ISO currency code (e.g., 'USD', 'EUR')
 * @param accountName - Account name (fallback for detection)
 */
export const getAccountColor = (currencyCode?: string, accountName?: string): string => {
  // Primary: Use currency code if provided
  if (currencyCode && currencyColorMap[currencyCode.toUpperCase()]) {
    return currencyColorMap[currencyCode.toUpperCase()];
  }

  // Fallback: Detect from account name
  if (accountName) {
    const name = accountName.toLowerCase();
    if (name.includes('cash')) return currencyColorDefaults.cash;
    if (name.includes('usd')) return currencyColorDefaults.usd;
    if (name.includes('eur')) return currencyColorDefaults.eur;
    if (name.includes('uah')) return currencyColorDefaults.uah;
    if (name.includes('ron')) return currencyColorDefaults.ron;
  }

  // Default gray
  return currencyColorDefaults.default;
};
