/**
 * Firefly III Transaction Utility Functions
 */

import type { TransactionType } from './types';

/**
 * Generate external ID for transaction deduplication
 * Format: tg-{type}-{username}-{unix_timestamp}
 */
export function generateExternalId(transactionType: TransactionType | string, username: string): string {
  const unixTime = Math.floor(Date.now() / 1000);
  return `tg-${transactionType}-${username}-${unixTime}`;
}

/**
 * Remove null and undefined values from an object
 * Used to clean transaction payloads before sending to API
 */
export function removeNullValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value != null)
  ) as Partial<T>;
}

/**
 * Parse ISO date string to ISO format
 * Handles both string dates with 'Z' timezone and Date objects
 */
export function parseTransactionDate(date: string | Date): string {
  if (typeof date === 'string') {
    // Remove 'Z' and add +00:00 for proper ISO format if needed
    const dateString = date.replace('Z', '+00:00');
    return new Date(dateString).toISOString();
  }

  if (date instanceof Date) {
    return date.toISOString();
  }

  throw new Error('Invalid date format');
}

/**
 * Convert string or number amount to fixed decimal string
 * Ensures proper formatting for financial amounts
 */
export function formatAmount(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  return numAmount.toString();
}

/**
 * Extract category name from Firefly category string
 * Handles multi-word categories by splitting and taking second part if available
 * Example: "salary Salary" -> "Salary", "Groceries" -> "Groceries"
 */
export function extractCategoryName(category: string): string {
  if (!category) return '';

  const parts = category.split(' ');
  if (parts.length > 1) {
    return parts[1].trim();
  }

  return category.trim();
}

/**
 * Build description string for expense transactions
 */
export function buildExpenseDescription(
  category: string,
  account: string,
  amount: string | number,
  currency: string,
  foreignAmount?: string | number
): string {
  const baseDesc = `Expense ${category} from ${account} ${amount} ${currency}`;

  if (foreignAmount) {
    return `${baseDesc} (${foreignAmount} EUR)`;
  }

  return baseDesc;
}

/**
 * Build description string for income transactions
 */
export function buildIncomeDescription(
  category: string,
  account: string,
  amount: string | number,
  currency: string,
  comment?: string,
  foreignAmount?: string | number
): string {
  let baseDesc = `${category} income to ${account} ${amount} ${currency}`;

  if (comment) {
    baseDesc += ` Comment: ${comment}`;
  }

  if (foreignAmount) {
    return `${baseDesc} (${foreignAmount} EUR)`;
  }

  return baseDesc;
}

/**
 * Build description string for transfer transactions
 */
export function buildTransferDescription(
  exitAccount: string,
  entryAccount: string,
  amount: string | number,
  currency: string,
  exitFee?: string | number,
  entryFee?: string | number,
  description?: string
): string {
  let desc = `Transfer from ${exitAccount} to ${entryAccount} - ${amount} ${currency}`;

  if (description) {
    desc += `, Comment: ${description}`;
  }

  if (exitFee && parseFloat(String(exitFee)) > 0) {
    desc += `, Exit fee: ${exitFee} ${currency}`;
  }

  if (entryFee && parseFloat(String(entryFee)) > 0) {
    desc += `, Entry fee: ${entryFee} ${currency}`;
  }

  return desc;
}

/**
 * Build notes string for transaction
 */
export function buildTransactionNotes(
  baseNote: string,
  comment?: string,
  username?: string
): string {
  let notes = baseNote;

  if (comment) {
    notes += ` Comment: ${comment}`;
  }

  if (username) {
    notes += ` Added by ${username}`;
  }

  return notes;
}

/**
 * Validate transaction amount is positive
 */
export function validateAmount(amount: string | number): boolean {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount > 0;
}

/**
 * Check if amount requires currency conversion
 */
export function requiresConversion(transactionCurrency: string, accountCurrency: string = 'EUR'): boolean {
  return transactionCurrency.toUpperCase() !== accountCurrency.toUpperCase();
}

/**
 * Log transaction operation with emoji indicators
 */
export function logTransactionOperation(
  level: 'info' | 'error' | 'warn',
  message: string,
  data?: unknown
): void {
  const emojiMap = {
    info: '📝',
    error: '❌',
    warn: '⚠️',
  };

  const emoji = emojiMap[level];
  const fullMessage = `${emoji} ${message}`;

  if (level === 'error') {
    console.error(fullMessage, data);
  } else if (level === 'warn') {
    console.warn(fullMessage, data);
  } else {
    console.log(fullMessage, data);
  }
}

/**
 * Measure operation duration
 */
export class OperationTimer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  public getDuration(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  public reset(): void {
    this.startTime = Date.now();
  }
}
