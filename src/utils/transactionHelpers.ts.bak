/**
 * Transaction Helper Utilities
 * Functions for formatting and processing transaction data for display
 */

import { getCurrencySymbol } from './currencies';
import type { DisplayTransaction } from '../types/transaction';

/**
 * Format amount with currency symbol
 * @param amount - Numeric amount
 * @param currency - Currency code (e.g., 'USD', 'EUR')
 * @returns Formatted string like "$100" or "100 UAH"
 */
export function formatTransactionAmount(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = Math.abs(amount).toFixed(2);

  // If symbol is a single character that's not a letter code, put it before the number
  if (symbol && symbol.length === 1 && !/[A-Z]{3}/.test(symbol)) {
    return `${symbol}${formattedAmount}`;
  }

  // Otherwise put currency after the number
  return `${formattedAmount} ${symbol || currency}`;
}

/**
 * Get transaction icon information based on type
 * @param type - Transaction type ('income', 'withdrawal', 'transfer')
 * @returns Object with icon info
 */
export function getTransactionIcon(type: 'income' | 'withdrawal' | 'transfer'): {
  name: string;
  color: string;
  bgColor: string;
} {
  switch (type) {
    case 'income':
      return {
        name: 'income',
        color: '#10B981', // green
        bgColor: '#10B98120',
      };
    case 'withdrawal':
      return {
        name: 'withdrawal',
        color: '#EF4444', // red
        bgColor: '#EF444420',
      };
    case 'transfer':
      return {
        name: 'transfer',
        color: '#3B82F6', // blue
        bgColor: '#3B82F620',
      };
    default:
      return {
        name: 'unknown',
        color: '#6B7280',
        bgColor: '#6B728020',
      };
  }
}

/**
 * Get display label for transaction based on type
 * @param transaction - Transaction to label
 * @returns Display label string
 */
export function getTransactionLabel(transaction: DisplayTransaction): string {
  switch (transaction.type) {
    case 'income':
      return transaction.destinationName || 'Income';
    case 'withdrawal':
      // If destination or category is "Fee", display as "Fee"
      if (transaction.destinationName === 'Fee' || transaction.categoryName === 'Fee') {
        return 'Fee';
      }
      return transaction.categoryName || 'Withdrawal';
    case 'transfer':
      return transaction.sourceName || 'Transfer';
    default:
      return 'Transaction';
  }
}

/**
 * Get secondary label for transaction (comment/description)
 * @param transaction - Transaction to label
 * @returns Display label string
 */
export function getTransactionSecondaryLabel(transaction: DisplayTransaction): string {
  switch (transaction.type) {
    case 'income':
      return transaction.description || 'No comment';
    case 'withdrawal':
      return transaction.sourceName || 'Unknown Account';
    case 'transfer':
      return transaction.destinationName || 'Transfer';
    default:
      return transaction.description || 'No comment';
  }
}

/**
 * Format transaction date to readable string
 * @param dateStr - ISO date string
 * @returns Formatted date like "Nov 1, 2025"
 */
export function formatTransactionDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format transaction time to readable string
 * @param dateStr - ISO date string
 * @returns Formatted time like "2:30 PM"
 */
export function formatTransactionTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

/**
 * Determine if amount is displayed as positive or negative
 * Income amounts are positive, withdrawals negative
 * @param transaction - Transaction data
 * @returns Numeric amount with appropriate sign
 */
export function getDisplayAmount(transaction: DisplayTransaction): number {
  if (transaction.type === 'withdrawal') {
    return -transaction.amount;
  }
  return transaction.amount;
}

/**
 * Determine if transaction should show foreign amount
 * @param transaction - Transaction data
 * @returns true if foreign amount should be displayed
 */
export function shouldShowForeignAmount(transaction: DisplayTransaction): boolean {
  return (
    !!transaction.foreignAmount &&
    !!transaction.foreignCurrency &&
    transaction.foreignCurrency !== transaction.currency
  );
}

/**
 * Get comparison text for foreign amount (e.g., "= 98 EUR")
 * @param amount - Foreign amount
 * @param currency - Foreign currency code
 * @returns Formatted comparison string
 */
export function formatForeignAmountComparison(amount: number, currency: string): string {
  const formatted = formatTransactionAmount(amount, currency);
  return `= ${formatted}`;
}

/**
 * Get transaction status display
 * @param reconciled - Whether transaction is reconciled
 * @returns Status label
 */
export function getTransactionStatus(reconciled: boolean): string {
  return reconciled ? 'Reconciled' : 'Pending';
}

/**
 * Format transaction for list item display
 * Returns object with all display-formatted information
 */
export function formatTransactionForDisplay(transaction: DisplayTransaction): {
  label: string;
  secondaryLabel: string;
  amount: string;
  foreignAmount?: string;
  date: string;
  time: string;
  type: 'income' | 'withdrawal' | 'transfer';
  icon: ReturnType<typeof getTransactionIcon>;
} {
  return {
    label: getTransactionLabel(transaction),
    secondaryLabel: getTransactionSecondaryLabel(transaction),
    amount: formatTransactionAmount(getDisplayAmount(transaction), transaction.currency),
    foreignAmount: shouldShowForeignAmount(transaction)
      ? formatForeignAmountComparison(
          transaction.type === 'withdrawal' ? -transaction.foreignAmount! : transaction.foreignAmount!,
          transaction.foreignCurrency!
        )
      : undefined,
    date: formatTransactionDate(transaction.date),
    time: formatTransactionTime(transaction.date),
    type: transaction.type,
    icon: getTransactionIcon(transaction.type),
  };
}
