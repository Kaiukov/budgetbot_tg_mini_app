/**
 * Currency Formatting Utilities
 * Provides consistent currency display across the application
 */

/**
 * Format a number as currency with proper locale formatting
 * @param amount - The amount to format
 * @param currencyCode - The ISO currency code (e.g., 'USD', 'EUR', 'UAH')
 * @returns Formatted currency string (e.g., "$1,234.56 USD")
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  // Handle null/undefined/NaN
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `0.00 ${currencyCode}`;
  }

  // Format with proper decimal places
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${formatted} ${currencyCode}`;
}

/**
 * Format a number as currency with symbol
 * @param amount - The amount to format
 * @param currencyCode - The ISO currency code (e.g., 'USD', 'EUR', 'UAH')
 * @returns Formatted currency string with symbol (e.g., "$1,234.56")
 */
export function formatCurrencyWithSymbol(amount: number, currencyCode: string): string {
  // Handle null/undefined/NaN
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    return formatCurrency(amount, currencyCode);
  }
}
