/**
 * Budget Machine Types
 * Complete type definitions for the xstate FSM
 */

import type { TelegramWebAppUser } from '../types/telegram';
import type { AccountUsage, CategoryUsage, DestinationSuggestion, SourceSuggestion } from '../services/sync';
import type { DisplayTransaction, TransactionData } from '../types/transaction';

// ============================================================================
// User & Auth Types
// ============================================================================

export interface BudgetUser {
  id: number;
  user_name: string;
  fullName: string;
  photoUrl: string | null;
  initials: string;
  bio: string;
  colorScheme: 'light' | 'dark';
  rawUser: TelegramWebAppUser | null;
}

// ============================================================================
// Transaction Form Types (Withdrawal/Deposit)
// ============================================================================

/**
 * Withdrawal Form - Ordered per API spec
 * Fields in spec order: user_name, account_name, account_id, account_currency,
 * amount, amount_eur, category_id, category_name, destination_id, destination_name, notes, date
 */
export interface WithdrawalForm {
  // Page 1: Account Selection
  user_name: string;
  account_name: string;
  account_id: string | number;
  account_currency: string;

  // Page 2: Amount
  amount: string;
  amount_eur: string;

  // Page 3: Category
  category_id: number;
  category_name: string;
  budget_name?: string;

  // Page 4: Destination Name
  destination_id: number;
  destination_name: string;

  // Page 5: Confirmation
  notes: string; // Can be empty
  date: string; // ISO format, editable

  // UI State (non-payload)
  isLoadingConversion?: boolean;
  conversionAmount?: number | null;
  suggestions?: DestinationSuggestion[];
  isLoadingSuggestions?: boolean;
  suggestionsError?: string | null;
  isSubmitting?: boolean;
  submitMessage?: { type: 'success' | 'error'; text: string } | null;
  errors?: Record<string, string>; // Page-level validation errors
}

export const initialWithdrawalForm: WithdrawalForm = {
  // Page 1: Account Selection
  user_name: '',
  account_name: '',
  account_id: '',
  account_currency: '',

  // Page 2: Amount
  amount: '',
  amount_eur: '',

  // Page 3: Category
  category_id: 0,
  category_name: '',
  budget_name: '',

  // Page 4: Destination Name
  destination_id: 0,
  destination_name: '',

  // Page 5: Confirmation
  notes: '',
  date: '',

  // UI State
  isLoadingConversion: false,
  conversionAmount: null,
  suggestions: [],
  isLoadingSuggestions: false,
  suggestionsError: null,
  isSubmitting: false,
  submitMessage: null,
  errors: {},
};

/**
 * Deposit Form - Ordered per API spec
 * Fields in spec order: user_name, account_name, account_id, account_currency,
 * amount, amount_eur, category_id, category_name, source_id, source_name, notes, date
 */
export interface DepositForm {
  // Page 1: Account Selection
  user_name: string;
  account_name: string;
  account_id: string | number;
  account_currency: string;

  // Page 2: Amount
  amount: string;
  amount_eur: string;

  // Page 3: Category
  category_id: number;
  category_name: string;
  budget_name?: string;

  // Page 4: Source Name
  source_id: number;
  source_name: string;

  // Page 5: Confirmation
  notes: string; // Can be empty
  date: string; // ISO format, editable

  // UI State (non-payload)
  isLoadingConversion?: boolean;
  conversionAmount?: number | null;
  suggestions?: SourceSuggestion[];
  isLoadingSuggestions?: boolean;
  suggestionsError?: string | null;
  isSubmitting?: boolean;
  submitMessage?: { type: 'success' | 'error'; text: string } | null;
  errors?: Record<string, string>; // Page-level validation errors
}

export const initialDepositForm: DepositForm = {
  // Page 1: Account Selection
  user_name: '',
  account_name: '',
  account_id: '',
  account_currency: '',

  // Page 2: Amount
  amount: '',
  amount_eur: '',

  // Page 3: Category
  category_id: 0,
  category_name: '',
  budget_name: '',

  // Page 4: Source Name
  source_id: 0,
  source_name: '',

  // Page 5: Confirmation
  notes: '',
  date: '',

  // UI State
  isLoadingConversion: false,
  conversionAmount: null,
  suggestions: [],
  isLoadingSuggestions: false,
  suggestionsError: null,
  isSubmitting: false,
  submitMessage: null,
  errors: {},
};

/**
 * Legacy TransactionForm - Kept for backward compatibility
 * Maps to both WithdrawalForm and DepositForm
 */
export interface TransactionForm {
  account: string;
  amount: string;
  category: string;
  category_id: number;
  budget_name: string;
  notes: string;
  destination_name: string;
  destination_id: number;
  source_name: string;
  source_id: number;
  account_id: string;
  account_currency: string;
  user_id: number | undefined;
  user_name: string;
  amount_eur: string;
  date?: string; // ISO format, editable
  // UI State for withdrawal flow
  conversionAmount: number | null;
  isLoadingConversion: boolean;
  suggestions: DestinationSuggestion[] | SourceSuggestion[];
  isLoadingSuggestions: boolean;
  suggestionsError: string | null;
  isSubmitting: boolean;
  submitMessage: { type: 'success' | 'error'; text: string } | null;
  errors?: Record<string, string>; // Validation errors
}

export const initialTransactionForm: TransactionForm = {
  account: '',
  amount: '',
  category: '',
  category_id: 0,
  budget_name: '',
  notes: '',
  destination_name: '',
  destination_id: 0,
  source_name: '',
  source_id: 0,
  account_id: '',
  account_currency: '',
  user_id: undefined,
  user_name: '',
  amount_eur: '',
  date: '',
  conversionAmount: null,
  isLoadingConversion: false,
  suggestions: [],
  isLoadingSuggestions: false,
  suggestionsError: null,
  isSubmitting: false,
  submitMessage: null,
  errors: {},
};

// ============================================================================
// Transfer Flow Types
// ============================================================================

/**
 * Transfer Form - Standardized per API spec with snake_case naming
 * Follows same naming pattern as WithdrawalForm and DepositForm
 * Fields: source account, destination account, amounts, fees, notes, date
 */
export interface TransferForm {
  // Page 1: Source Account
  user_name: string;
  source_account_name: string;
  source_account_id: string;
  source_account_currency: string;

  // Page 2: Destination Account
  destination_account_name: string;
  destination_account_id: string;
  destination_account_currency: string;

  // Page 3: Amounts
  source_amount: string;
  destination_amount: string;
  exchange_rate: number | null;

  // Page 4: Fees (if multi-currency)
  source_fee: string;
  destination_fee: string;

  // Page 5: Confirmation
  notes: string; // Auto-generated, can be edited
  date: string; // ISO format, editable

  // UI State (non-payload)
  isLoadingConversion?: boolean;
  isSubmitting?: boolean;
  errors?: Record<string, string>; // Page-level validation errors

  // Smart clearing state (internal tracking)
  prevDestinationAccountId?: string; // Track previous destination for smart clearing on back navigation
}

export const initialTransferForm: TransferForm = {
  // Page 1: Source Account
  user_name: '',
  source_account_name: '',
  source_account_id: '',
  source_account_currency: '',

  // Page 2: Destination Account
  destination_account_name: '',
  destination_account_id: '',
  destination_account_currency: '',

  // Page 3: Amounts
  source_amount: '',
  destination_amount: '',
  exchange_rate: null,

  // Page 4: Fees
  source_fee: '0',
  destination_fee: '0',

  // Page 5: Confirmation
  notes: '',
  date: '',

  // UI State
  isLoadingConversion: false,
  isSubmitting: false,
  errors: {},
};

// ============================================================================
// UI State Types
// ============================================================================

export interface ResourceLoadingState {
  loading: boolean;
  error: string | null;
}

export interface UIState {
  accounts: ResourceLoadingState;
  categories: ResourceLoadingState;
  transactions: ResourceLoadingState;
  services: {
    telegram: ServiceStatus;
    sync: ServiceStatus;
    firefly: ServiceStatus;
  };
}

export interface ServiceStatus {
  name: string;
  status: 'checking' | 'connected' | 'disconnected';
  message: string;
}

export const initialUIState: UIState = {
  accounts: { loading: false, error: null },
  categories: { loading: false, error: null },
  transactions: { loading: false, error: null },
  services: {
    telegram: { name: 'Telegram SDK', status: 'checking', message: 'Initializing...' },
    sync: { name: 'Sync API', status: 'checking', message: 'Initializing...' },
    firefly: { name: 'Firefly API', status: 'checking', message: 'Initializing...' },
  },
};

// ============================================================================
// Selected Transaction Types
// ============================================================================

export interface SelectedTransactionState {
  id: string | null;
  rawData: TransactionData | null;
  editing: DisplayTransaction | null;
}

export const initialSelectedTransaction: SelectedTransactionState = {
  id: null,
  rawData: null,
  editing: null,
};

// ============================================================================
// Data Types
// ============================================================================

export interface DataState {
  accounts: AccountUsage[];
  categories: CategoryUsage[];
  transactions: DisplayTransaction[];
}

export const initialDataState: DataState = {
  accounts: [],
  categories: [],
  transactions: [],
};

// ============================================================================
// Machine Context
// ============================================================================

export interface BudgetMachineContext {
  user: BudgetUser;
  transaction: TransactionForm;
  transfer: TransferForm;
  data: DataState;
  ui: UIState;
  selectedTransaction: SelectedTransactionState;
}

export const initialContext: BudgetMachineContext = {
  user: {
    id: 0,
    user_name: 'Guest',
    fullName: 'Guest',
    photoUrl: null,
    initials: 'G',
    bio: 'Manage finances and create reports',
    colorScheme: 'dark',
    rawUser: null,
  },
  transaction: initialTransactionForm,
  transfer: initialTransferForm,
  data: initialDataState,
  ui: initialUIState,
  selectedTransaction: initialSelectedTransaction,
};

// ============================================================================
// Machine Events
// ============================================================================

// Initialization Events
export type InitEvent =
  | { type: 'INIT_START' }
  | { type: 'INIT_DONE'; data: { user: BudgetUser } }
  | { type: 'INIT_ERROR'; error: string };

// Navigation Events
export type NavigationEvent =
  | { type: 'NAVIGATE_HOME' }
  | { type: 'NAVIGATE_WITHDRAWAL_ACCOUNTS' }
  | { type: 'NAVIGATE_DEPOSIT_ACCOUNTS' }
  | { type: 'NAVIGATE_AMOUNT' }
  | { type: 'NAVIGATE_CATEGORY' }
  | { type: 'NAVIGATE_COMMENT' }
  | { type: 'NAVIGATE_CONFIRM' }
  | { type: 'NAVIGATE_TRANSFER_SOURCE' }
  | { type: 'NAVIGATE_TRANSFER_DEST' }
  | { type: 'NAVIGATE_TRANSFER_AMOUNT' }
  | { type: 'NAVIGATE_TRANSFER_FEES' }
  | { type: 'NAVIGATE_TRANSFER_CONFIRM' }
  | { type: 'NAVIGATE_TRANSACTIONS' }
  | { type: 'NAVIGATE_TRANSACTION_DETAIL' }
  | { type: 'NAVIGATE_TRANSACTION_EDIT' }
  | { type: 'NAVIGATE_DEBUG' }
  | { type: 'NAVIGATE_BACK' };

// Transaction Form Events
export type TransactionEvent =
  | { type: 'UPDATE_ACCOUNT'; account: string; account_id: string; account_currency: string; user_name: string }
  | { type: 'UPDATE_AMOUNT'; amount: string }
  | { type: 'UPDATE_AMOUNT_EUR'; amount_eur: string }
  | { type: 'UPDATE_CATEGORY'; category: string; category_id?: number; budget_name?: string }
  | { type: 'UPDATE_NOTES'; notes: string; comment?: string; destination_name?: string; destination_id?: number }
  | { type: 'UPDATE_SOURCE_NAME'; source_id: number; source_name: string }
  | { type: 'UPDATE_DATE'; date: string }
  | { type: 'RESET_TRANSACTION' }
  | { type: 'SET_USER_DATA'; user_id: number; user_name: string }
  | { type: 'SELECT_TRANSACTION'; id: string }
  | { type: 'CLEAR_SELECTED_TRANSACTION' }
  // Validation events
  | { type: 'VALIDATE_PAGE'; page: string }
  | { type: 'SET_VALIDATION_ERROR'; page: string; error: string | null }
  // UI state events for withdrawal flow
  | { type: 'SET_CONVERSION_AMOUNT'; amount_eur: number }
  | { type: 'SET_IS_LOADING_CONVERSION'; isLoading: boolean }
  | { type: 'SET_SUGGESTIONS'; suggestions: DestinationSuggestion[] }
  | { type: 'SET_DEPOSIT_SUGGESTIONS'; suggestions: SourceSuggestion[] }
  | { type: 'SET_IS_LOADING_SUGGESTIONS'; isLoading: boolean }
  | { type: 'SET_SUGGESTIONS_ERROR'; error: string | null }
  | { type: 'SET_IS_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_SUBMIT_MESSAGE'; message: { type: 'success' | 'error'; text: string } | null };

// Transfer Events - Standardized naming per API spec
export type TransferEvent =
  | { type: 'SET_TRANSFER_SOURCE'; user_name: string; source_account_name: string; source_account_id: string; source_account_currency: string }
  | { type: 'SET_TRANSFER_DEST'; destination_account_name: string; destination_account_id: string; destination_account_currency: string }
  | { type: 'UPDATE_TRANSFER_SOURCE_AMOUNT'; source_amount: string }
  | { type: 'UPDATE_TRANSFER_DEST_AMOUNT'; destination_amount: string }
  | { type: 'UPDATE_TRANSFER_EXCHANGE_RATE'; exchange_rate: number }
  | { type: 'UPDATE_TRANSFER_SOURCE_FEE'; source_fee: string }
  | { type: 'UPDATE_TRANSFER_DEST_FEE'; destination_fee: string }
  | { type: 'UPDATE_TRANSFER_NOTES'; notes: string }
  | { type: 'UPDATE_TRANSFER_DATE'; date: string }
  | { type: 'RESET_TRANSFER' }
  // Validation events
  | { type: 'VALIDATE_TRANSFER_PAGE'; page: string }
  | { type: 'SET_TRANSFER_VALIDATION_ERROR'; page: string; error: string | null };

// Data Fetch Events
export type DataEvent =
  | { type: 'FETCH_ACCOUNTS' }
  | { type: 'FETCH_ACCOUNTS_SUCCESS'; accounts: AccountUsage[] }
  | { type: 'FETCH_ACCOUNTS_ERROR'; error: string }
  | { type: 'FETCH_CATEGORIES' }
  | { type: 'FETCH_CATEGORIES_SUCCESS'; categories: CategoryUsage[] }
  | { type: 'FETCH_CATEGORIES_ERROR'; error: string }
  | { type: 'FETCH_TRANSACTIONS' }
  | { type: 'FETCH_TRANSACTIONS_SUCCESS'; transactions: DisplayTransaction[] }
  | { type: 'FETCH_TRANSACTIONS_ERROR'; error: string };

// Service Status Events
export type ServiceEvent =
  | { type: 'CHECK_SERVICES' }
  | { type: 'SERVICE_STATUS_CHANGED'; service: keyof UIState['services']; status: ServiceStatus }
  | { type: 'TELEGRAM_READY' }
  | { type: 'SYNC_CONNECTED' }
  | { type: 'FIREFLY_CONNECTED' };

// Submission Events
export type SubmissionEvent =
  | { type: 'SUBMIT_TRANSACTION' }
  | { type: 'SUBMIT_TRANSACTION_SUCCESS' }
  | { type: 'SUBMIT_TRANSACTION_ERROR'; error: string }
  | { type: 'SUBMIT_TRANSFER' }
  | { type: 'SUBMIT_TRANSFER_SUCCESS' }
  | { type: 'SUBMIT_TRANSFER_ERROR'; error: string }
  | { type: 'EDIT_TRANSACTION'; transaction: TransactionData }
  | { type: 'DELETE_TRANSACTION' }
  | { type: 'DELETE_TRANSACTION_SUCCESS' }
  | { type: 'DELETE_TRANSACTION_ERROR'; error: string };

// All Events
export type BudgetMachineEvent =
  | InitEvent
  | NavigationEvent
  | TransactionEvent
  | TransferEvent
  | DataEvent
  | ServiceEvent
  | SubmissionEvent;

// ============================================================================
// TypeScript Discriminated Union Helpers
// ============================================================================

export const isTransactionEvent = (event: BudgetMachineEvent): event is TransactionEvent => {
  return [
    'UPDATE_ACCOUNT',
    'UPDATE_AMOUNT',
    'UPDATE_AMOUNT_EUR',
    'UPDATE_CATEGORY',
    'UPDATE_NOTES',
    'UPDATE_SOURCE_NAME',
    'UPDATE_DATE',
    'RESET_TRANSACTION',
    'SET_USER_DATA',
    'SELECT_TRANSACTION',
    'CLEAR_SELECTED_TRANSACTION',
    'VALIDATE_PAGE',
    'SET_VALIDATION_ERROR',
    'SET_CONVERSION_AMOUNT',
    'SET_IS_LOADING_CONVERSION',
    'SET_SUGGESTIONS',
    'SET_DEPOSIT_SUGGESTIONS',
    'SET_IS_LOADING_SUGGESTIONS',
    'SET_SUGGESTIONS_ERROR',
    'SET_IS_SUBMITTING',
    'SET_SUBMIT_MESSAGE',
  ].includes(event.type as any);
};

export const isTransferEvent = (event: BudgetMachineEvent): event is TransferEvent => {
  return [
    'SET_TRANSFER_SOURCE',
    'SET_TRANSFER_DEST',
    'UPDATE_TRANSFER_SOURCE_AMOUNT',
    'UPDATE_TRANSFER_DEST_AMOUNT',
    'UPDATE_TRANSFER_EXCHANGE_RATE',
    'UPDATE_TRANSFER_SOURCE_FEE',
    'UPDATE_TRANSFER_DEST_FEE',
    'UPDATE_TRANSFER_NOTES',
    'UPDATE_TRANSFER_DATE',
    'RESET_TRANSFER',
    'VALIDATE_TRANSFER_PAGE',
    'SET_TRANSFER_VALIDATION_ERROR',
  ].includes(event.type as any);
};
