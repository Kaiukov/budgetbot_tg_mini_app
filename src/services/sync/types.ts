/**
 * Sync API Service - Type Definitions
 * All interfaces for Sync API responses and data structures
 */

import type { TransactionData, DisplayTransaction, PaginationMeta } from '../../types/transaction';

export interface AccountUsage {
  account_id: string;
  user_name: string;
  account_name: string;
  account_currency: string;
  current_balance: number;
  balance_in_USD: number;
  balance_in_EUR: number;
  owner: string;
  owner_id: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface AccountsUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_accounts_usage: AccountUsage[];
  total: number;
}

export interface CategoryUsage {
  user_name: string;
  category_name: string;
  category_id: number;
  usage_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CategoriesUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_categories_usage: CategoryUsage[];
  total: number;
}

export interface DestinationSuggestion {
  user_name: string;
  destination_name: string;
  category_name: string;
  usage_count: number;
  global_usage?: number;
  user_has_used?: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface DestinationNameUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_destination_name_usage: DestinationSuggestion[];
  total: number;
}

export interface CurrentBalanceResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_current_balance: {
    balance_in_USD: number;
  }[];
  total: number;
}

export interface TelegramUserData {
  success: boolean;
  message: string;
  timestamp: string;
  userData: {
    id: number;
    name: string;
    username: string;
    bio: string;
    avatar_url: string | null;
    language_code: string;
    bot_blocked: boolean;
  } | null;
}

export interface ExchangeRateCache {
  rate: number;
  timestamp: number;
}


/**
 * Base transaction data - common to all transaction types
 */
export interface BaseTransactionData {
  username: string;
  date: string | Date;
  amount: string | number;
  currency: string;
  account: string;
  account_currency?: string;
  comment?: string;
  notes?: string;
}

/**
 * Expense-specific transaction data
 */
export interface ExpenseTransactionData extends BaseTransactionData {
  category: string;
  budget_name?: string;
  account_id?: string | number;
  amount_foreign?: string | number;
  user_id?: number;
}

/**
 * Income-specific transaction data
 */
export interface IncomeTransactionData extends BaseTransactionData {
  category: string;
  budget_name?: string;
  account_id?: string | number;
  amount_foreign?: string | number;
  user_id?: number;
}

/**
 * Transfer-specific transaction data
 */
export interface TransferTransactionData {
  username: string;
  date: string | Date;
  currency?: string;
  exit_account: string;
  entry_account: string;
  exit_amount?: string | number;
  entry_amount?: string | number;
  exit_currency?: string;
  entry_currency?: string;
  exit_fee?: string | number;
  entry_fee?: string | number;
  description?: string;
}

/**
 * Individual transaction payload for Firefly III API
 */
export interface FireflyTransactionPayload {
  type: 'withdrawal' | 'deposit' | 'transfer';
  date: string;
  amount: string;
  description: string;
  currency_code: string;
  source_name?: string;
  destination_name?: string;
  category_name?: string;
  budget_name?: string;
  foreign_currency_code?: string;
  foreign_amount?: string;
  notes?: string;
  tags?: string[];
  external_id: string;
  reconciled?: boolean;
}

/**
 * Complete API request payload for Sync API /transactions endpoint
 */
export interface FireflyCreateTransactionRequest {
  error_if_duplicate_hash: boolean;
  apply_rules: boolean;
  fire_webhooks: boolean;
  transactions: FireflyTransactionPayload[];
}

/**
 * Firefly III transaction response
 */
export interface FireflyTransactionResponse {
  data?: {
    type: string;
    id: string;
    attributes: {
      transactions: Array<{
        external_id: string;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    };
  };
  errors?: Array<{
    status: number;
    title: string;
    detail: string;
  }>;
  validation?: {
    external_id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Result type for transaction operations
 */
export type TransactionResult = [success: boolean, response: FireflyTransactionPayload | { error: string }];

/**
 * Verification response
 */
export interface VerificationResponse {
  verified: boolean;
  transactionId?: string;
  error?: string;
}

export interface TransactionLink {
  self: string;
  first: string;
  last: string;
  prev?: string;
  next?: string;
}

export interface TransactionMeta {
  current_page: number;
  total_pages: number;
  per_page: number;
  total: number;
  count: number;
}

export interface TransactionRead {
  type: string;
  id: string;
  attributes: {
    created_at: string;
    updated_at: string;
    user: string;
    group_title: string | null;
    transactions: FireflyTransactionPayload[];
  };
  links: {
    self: string;
  };
}

export interface TransactionsResponse {
  data: TransactionRead[];
  meta: {
    pagination: TransactionMeta;
  };
  links: TransactionLink;
}

export interface SingleTransactionResponse {
  data: TransactionRead;
}

export interface ServiceTransactionsResponse {
  success: boolean;
  error?: string;
  transactions: DisplayTransaction[];
  pagination: PaginationMeta;
}

export interface ServiceSingleTransactionResponse {
  success: boolean;
  error?: string;
  transaction?: DisplayTransaction;
  rawData?: TransactionData;
}
