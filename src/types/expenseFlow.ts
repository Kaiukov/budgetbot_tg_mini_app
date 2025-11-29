/**
 * Expense Flow Types
 * Defines the state shape for the multi-step expense flow
 */

import type { AccountUsage, CategoryUsage, DestinationSuggestion } from '../services/sync';

export type ExpenseFlowStep =
  | 'home'
  | 'expense-accounts'
  | 'expense-amount'
  | 'expense-category'
  | 'expense-destination'
  | 'expense-confirm';

export interface ExpenseFlowFields {
  user_name: string;
  account_name: string;
  account_id: string;
  account_currency: string;
  amount: string;
  amount_eur: string;
  category_id: string | number;
  category_name: string;
  destination_id: string;
  destination_name: string;
  date: string;
  comment: string;
}

export interface ExpenseFlowCache {
  accounts: AccountUsage[];
  accountsLoaded: boolean;
  accountsLoading: boolean;
  accountsError: string | null;
  categories: CategoryUsage[];
  categoriesLoaded: boolean;
  categoriesLoading: boolean;
  categoriesError: string | null;
  destinations: DestinationSuggestion[];
  destinationsLoaded: boolean;
  destinationsLoading: boolean;
  destinationsError: string | null;
}

export interface ExpenseFlowErrors {
  step?: string;
  fields?: Record<string, string | undefined>;
}

export interface ExpenseFlowMeta {
  external_id?: string;
}

export interface ExpenseFlowStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

export interface ExpenseFlowState {
  step: ExpenseFlowStep;
  fields: Partial<ExpenseFlowFields>;
  cache: ExpenseFlowCache;
  errors: ExpenseFlowErrors;
  meta: ExpenseFlowMeta;
  status: ExpenseFlowStatus;
}

export type ExpenseFlowAction =
  | { type: 'START_EXPENSE_FLOW'; payload: { userName: string } }
  | { type: 'LOAD_ACCOUNTS_PENDING' }
  | { type: 'LOAD_ACCOUNTS_FULFILLED'; payload: AccountUsage[] }
  | { type: 'LOAD_ACCOUNTS_REJECTED'; payload: string }
  | { type: 'SELECT_ACCOUNT'; payload: AccountUsage }
  | { type: 'SET_AMOUNT'; payload: string }
  | { type: 'SET_AMOUNT_EUR'; payload: string }
  | { type: 'GO_TO_AMOUNT' }
  | { type: 'LOAD_CATEGORIES_PENDING' }
  | { type: 'LOAD_CATEGORIES_FULFILLED'; payload: CategoryUsage[] }
  | { type: 'LOAD_CATEGORIES_REJECTED'; payload: string }
  | { type: 'SELECT_CATEGORY'; payload: CategoryUsage }
  | { type: 'GO_TO_CATEGORY' }
  | { type: 'LOAD_DESTINATIONS_PENDING' }
  | { type: 'LOAD_DESTINATIONS_FULFILLED'; payload: DestinationSuggestion[] }
  | { type: 'LOAD_DESTINATIONS_REJECTED'; payload: string }
  | { type: 'SELECT_DESTINATION'; payload: { id: string; name: string } }
  | { type: 'GO_TO_DESTINATION' }
  | { type: 'SET_COMMENT'; payload: string }
  | { type: 'GO_TO_CONFIRM' }
  | { type: 'BACK_TO_HOME' }
  | { type: 'SET_EXTERNAL_ID'; payload: string }
  | { type: 'RESET_FLOW' };
