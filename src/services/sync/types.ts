/**
 * Firefly III Transaction Types and Interfaces
 */

export enum TransactionType {
  EXPENSE = 'expense',
  INCOME = 'income',
  TRANSFER = 'transfer',
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
 * Complete API request payload for Firefly III /transactions endpoint
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
export type TransactionResult = [success: boolean, response: FireflyTransactionResponse | { error: string }];

/**
 * Verification response
 */
export interface VerificationResponse {
  verified: boolean;
  transactionId?: string;
  error?: string;
}
