/**
 * Transaction Types and Interfaces
 * Definitions for displaying and managing transactions from Firefly III API
 */

/**
 * Represents a single transaction from the API
 * Supports three types: deposit (income), withdrawal (expense), transfer
 */
export interface TransactionData {
  user: string;
  transaction_journal_id: string | number;
  type: 'deposit' | 'withdrawal' | 'transfer';
  date: string;
  order: number;

  // Currency information
  currency_code: string;
  currency_symbol: string;
  currency_name: string;
  currency_decimal_places: number;

  // Foreign currency (for transfers or multi-currency)
  foreign_currency_code?: string;
  foreign_currency_symbol?: string;
  foreign_currency_name?: string;
  foreign_currency_decimal_places?: number;

  // Amounts
  amount: string;
  foreign_amount?: string;

  // Account information
  source_id?: string;
  source_name?: string;
  source_type?: string;
  destination_id?: string;
  destination_name?: string;
  destination_type?: string;

  // Transaction details
  category_id?: string;
  category_name?: string;
  description: string;
  notes?: string;

  // Meta
  reconciled: boolean;
  tags: string[];
  external_id: string;
}

/**
 * API response structure for transactions list
 */
export interface FireflyTransactionResponse {
  data: Array<{
    type: string;
    id: string;
    attributes: {
      created_at: string;
      updated_at: string;
      user: string;
      transactions: TransactionData[];
    };
    links: {
      self: string;
    };
  }>;
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
  links: {
    self: string;
    first: string;
    next?: string;
    prev?: string;
    last: string;
  };
}

/**
 * Simplified transaction for display
 * Normalizes the API structure into easier-to-use format
 */
export interface DisplayTransaction {
  id: string;
  type: 'income' | 'withdrawal' | 'transfer';
  date: string;

  // Primary amount info
  amount: number;
  currency: string;
  currencySymbol: string;

  // For transfers - secondary amount info
  foreignAmount?: number;
  foreignCurrency?: string;
  foreignCurrencySymbol?: string;

  // Account/Category
  categoryName?: string;
  sourceName?: string;
  destinationName?: string;

  // Details
  description: string;
  username: string;

  // For navigation/editing
  journalId: string | number;
}

/**
 * Request format for updating transactions
 * Must include all fields as the API replaces the entire transaction
 */
export interface UpdateTransactionRequest {
  transactions: Array<{
    type: 'withdrawal' | 'deposit' | 'transfer';
    date: string;
    amount: string;
    description: string;
    source_id?: string;
    source_name?: string;
    destination_id?: string;
    destination_name?: string;
    category_id?: string;
    category_name?: string;
    currency_code: string;
    foreign_currency_code?: string;
    foreign_amount?: string;
    notes?: string;
    tags?: string[];
    reconciled?: boolean;
  }>;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
}
