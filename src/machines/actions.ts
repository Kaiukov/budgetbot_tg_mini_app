/**
 * Budget Machine Actions
 * Assign actions and guard conditions for xstate
 */

import { assign } from 'xstate';
import type {
  BudgetMachineContext,
  BudgetUser,
  WithdrawalForm,
  DepositForm,
  TransferForm,
} from './types';
import { initialTransactionForm as transactionFormDefault, initialTransferForm as transferFormDefault } from './types';
import { extractBudgetName } from '../services/sync/utils';

const enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

// ============================================================================
// Update Actions
// ============================================================================

export const actions = {
  // User & Auth
  setUser: assign({
    user: (_, params: { data: BudgetUser }) => params.data,
  }),

  setUserData: assign({
    user: ({ context }, params: { user_id: number; username: string }) => ({
      ...context.user,
      id: params.user_id,
      username: params.username,
    }),
  }),

  // Transaction Form
  updateAccount: assign({
    transaction: ({ context }, params: { account: string; account_id: string; account_currency: string; username: string }) => ({
      ...context.transaction,
      account: params.account,
      account_id: params.account_id,
      account_currency: params.account_currency,
      username: params.username,
    }),
  }),

  updateAmount: assign({
    transaction: ({ context }, params: { amount: string }) => ({
      ...context.transaction,
      amount: params.amount,
    }),
  }),

  updateAmountForeign: assign({
    transaction: ({ context }, params: { amount_foreign: string }) => ({
      ...context.transaction,
      amount_foreign: params.amount_foreign,
    }),
  }),

  updateCategory: assign({
    transaction: ({ context }, params: { category: string; category_id?: number; budget_name?: string }) => {
      const normalizedBudget = params.budget_name && params.budget_name.trim().length > 0
        ? params.budget_name.trim()
        : extractBudgetName(params.category);

      return {
        ...context.transaction,
        category: params.category,
        category_id: params.category_id ?? context.transaction.category_id,
        budget_name: normalizedBudget,
      };
    },
  }),

  updateComment: assign({
    transaction: ({ context }, params: { comment: string; destination_id?: number; destination_name?: string }) => ({
      ...context.transaction,
      comment: params.comment,
      destination_name: params.destination_name ?? params.comment ?? context.transaction.destination_name,
      destination_id: params.destination_id ?? context.transaction.destination_id,
    }),
  }),

  resetTransaction: assign({
    transaction: () => ({ ...transactionFormDefault }),
  }),

  // Validation & Date Updates for Transaction/Withdrawal/Deposit
  setWithdrawalValidationError: assign({
    transaction: ({ context }, params: { error: string | null }) => ({
      ...context.transaction,
      errors: params.error ? { validation: params.error } : {},
    }),
  }),

  setDepositValidationError: assign({
    transaction: ({ context }, params: { error: string | null }) => ({
      ...context.transaction,
      errors: params.error ? { validation: params.error } : {},
    }),
  }),

  clearTransactionValidationError: assign({
    transaction: ({ context }) => ({
      ...context.transaction,
      errors: {},
    }),
  }),

  updateTransactionDate: assign({
    transaction: ({ context }, params: { date: string }) => ({
      ...context.transaction,
      date: params.date,
    }),
  }),

  // Transfer Form
  setTransferSource: assign({
    transfer: ({ context }, params: { account: string; id: string; currency: string; user_name?: string }) => ({
      ...context.transfer,
      source: {
        account: params.account,
        id: params.id,
        currency: params.currency,
      },
      source_user_name: params.user_name ?? context.transfer.source_user_name,
    }),
  }),

  setTransferDest: assign({
    transfer: ({ context }, params: { account: string; id: string; currency: string; user_name?: string }) => ({
      ...context.transfer,
      destination: {
        account: params.account,
        id: params.id,
        currency: params.currency,
      },
      dest_user_name: params.user_name ?? context.transfer.dest_user_name,
    }),
  }),

  updateTransferExitAmount: assign({
    transfer: ({ context }, params: { amount: string }) => ({
      ...context.transfer,
      exitAmount: params.amount,
    }),
  }),

  updateTransferEntryAmount: assign({
    transfer: ({ context }, params: { amount: string }) => ({
      ...context.transfer,
      entryAmount: params.amount,
    }),
  }),

  updateTransferExitFee: assign({
    transfer: ({ context }, params: { fee: string }) => ({
      ...context.transfer,
      exitFee: params.fee,
    }),
  }),

  updateTransferEntryFee: assign({
    transfer: ({ context }, params: { fee: string }) => ({
      ...context.transfer,
      entryFee: params.fee,
    }),
  }),

  updateTransferComment: assign({
    transfer: ({ context }, params: { comment: string }) => ({
      ...context.transfer,
      comment: params.comment,
    }),
  }),

  updateTransferDate: assign({
    transfer: ({ context }, params: { date: string }) => ({
      ...context.transfer,
      date: params.date,
    }),
  }),

  resetTransfer: assign({
    transfer: () => ({ ...transferFormDefault }),
  }),

  setTransferValidationError: assign({
    transfer: ({ context }, params: { error: string | null }) => ({
      ...context.transfer,
      errors: params.error ? { validation: params.error } : {},
    }),
  }),

  clearTransferValidationError: assign({
    transfer: ({ context }) => ({
      ...context.transfer,
      errors: {},
    }),
  }),

  // Data Management
  setAccounts: assign({
    data: ({ context }, params: { accounts: any[] }) => ({
      ...context.data,
      accounts: params.accounts,
    }),
    ui: ({ context }) => ({
      ...context.ui,
      accounts: { loading: false, error: null },
    }),
  }),

  setAccountsLoading: assign({
    ui: ({ context }) => ({
      ...context.ui,
      accounts: { loading: true, error: null },
    }),
  }),

  setAccountsError: assign({
    ui: ({ context }, params: { error: string }) => ({
      ...context.ui,
      accounts: { loading: false, error: params.error },
    }),
  }),

  setCategories: assign({
    data: ({ context }, params: { categories: any[] }) => ({
      ...context.data,
      categories: params.categories,
    }),
    ui: ({ context }) => ({
      ...context.ui,
      categories: { loading: false, error: null },
    }),
  }),

  setCategoriesLoading: assign({
    ui: ({ context }) => ({
      ...context.ui,
      categories: { loading: true, error: null },
    }),
  }),

  setCategoriesError: assign({
    ui: ({ context }, params: { error: string }) => ({
      ...context.ui,
      categories: { loading: false, error: params.error },
    }),
  }),

  setTransactions: assign({
    data: ({ context }, params: { transactions: any[] }) => ({
      ...context.data,
      transactions: params.transactions,
    }),
    ui: ({ context }) => ({
      ...context.ui,
      transactions: { loading: false, error: null },
    }),
  }),

  setTransactionsLoading: assign({
    ui: ({ context }) => ({
      ...context.ui,
      transactions: { loading: true, error: null },
    }),
  }),

  setTransactionsError: assign({
    ui: ({ context }, params: { error: string }) => ({
      ...context.ui,
      transactions: { loading: false, error: params.error },
    }),
  }),

  // Service Status
  setServiceStatus: assign({
    ui: ({ context }, params: { service: keyof typeof context.ui.services; status: any }) => ({
      ...context.ui,
      services: {
        ...context.ui.services,
        [params.service]: params.status,
      },
    }),
  }),

  // Selected Transaction
  selectTransaction: assign({
    selectedTransaction: ({ context }, params: { id: string; rawData: any; editing?: any }) => ({
      ...context.selectedTransaction,
      id: params.id,
      rawData: params.rawData,
      editing: params.editing || null,
    }),
  }),

  clearSelectedTransaction: assign({
    selectedTransaction: () => ({
      id: null,
      rawData: null,
      editing: null,
    }),
  }),

  setEditingTransaction: assign({
    selectedTransaction: ({ context }, params: { editing: any }) => ({
      ...context.selectedTransaction,
      editing: params.editing,
    }),
  }),
};

// ============================================================================
// Guard Conditions
// ============================================================================

export const guards = {
  hasValidTransaction: (context: BudgetMachineContext) => {
    return (
      context.transaction.account !== '' &&
      context.transaction.amount !== '' &&
      context.transaction.category !== ''
    );
  },

  hasValidTransfer: (context: BudgetMachineContext) => {
    return (
      context.transfer.source.account !== '' &&
      context.transfer.destination.account !== '' &&
      context.transfer.exitAmount !== '' &&
      context.transfer.entryAmount !== ''
    );
  },

  hasSelectedTransaction: (context: BudgetMachineContext) => {
    return context.selectedTransaction.id !== null;
  },

  hasAccounts: (context: BudgetMachineContext) => {
    return context.data.accounts.length > 0;
  },

  hasCategories: (context: BudgetMachineContext) => {
    return context.data.categories.length > 0;
  },

  hasTransactions: (context: BudgetMachineContext) => {
    return context.data.transactions.length > 0;
  },

  isUnknownUser: (context: BudgetMachineContext) => {
    return context.user.user_name === 'User' || context.user.user_name === 'Guest';
  },
};

// ============================================================================
// Validation Functions (Return error message or null)
// ============================================================================

/**
 * Validates account selection page
 * Required fields: user_name, account_name, account_id, account_currency
 */
export const validateAccountPage = (form: WithdrawalForm | DepositForm): string | null => {
  if (!form.user_name?.trim()) return 'User name is required';
  if (!form.account_name?.trim()) return 'Account name is required';
  if (!form.account_id) return 'Account ID is required';
  if (!form.account_currency?.trim()) return 'Account currency is required';
  return null;
};

/**
 * Validates amount page
 * Required fields: amount (positive number)
 */
export const validateAmountPage = (form: WithdrawalForm | DepositForm): string | null => {
  if (!form.amount?.trim()) return 'Amount is required';
  const num = parseFloat(form.amount);
  if (isNaN(num)) return 'Amount must be a valid number';
  if (num <= 0) return 'Amount must be greater than 0';
  return null;
};

/**
 * Validates category page
 * Required fields: category_id, category_name
 */
export const validateCategoryPage = (form: WithdrawalForm | DepositForm): string | null => {
  if (!form.category_id) return 'Category is required';
  if (!form.category_name?.trim()) return 'Category name is required';
  return null;
};

/**
 * Validates destination name page (withdrawal)
 * Required fields: destination_name
 */
export const validateDestinationPage = (form: WithdrawalForm): string | null => {
  if (!form.destination_name?.trim()) return 'Destination name is required';
  return null;
};

/**
 * Validates source name page (deposit)
 * Required fields: source_name
 */
export const validateSourcePage = (form: DepositForm): string | null => {
  if (!form.source_name?.trim()) return 'Source name is required';
  return null;
};

/**
 * Validates confirmation page
 * Required fields: date (notes can be empty)
 */
export const validateConfirmationPage = (form: WithdrawalForm | DepositForm | TransferForm): string | null => {
  if (!form.date?.trim()) return 'Date is required';
  return null;
};

/**
 * Validates transfer source page
 * Required fields: source account, source_user_name
 */
export const validateTransferSourcePage = (form: TransferForm): string | null => {
  if (!form.source.account?.trim()) return 'Source account is required';
  if (!form.source_user_name?.trim()) return 'User name is required';
  return null;
};

/**
 * Validates transfer destination page
 * Required fields: destination account, dest_user_name
 */
export const validateTransferDestPage = (form: TransferForm): string | null => {
  if (!form.destination.account?.trim()) return 'Destination account is required';
  if (!form.dest_user_name?.trim()) return 'User name is required';
  return null;
};

/**
 * Validates transfer amount page
 * Required fields: exitAmount, entryAmount
 */
export const validateTransferAmountPage = (form: TransferForm): string | null => {
  if (!form.exitAmount?.trim()) return 'Exit amount is required';
  const exitNum = parseFloat(form.exitAmount);
  if (isNaN(exitNum) || exitNum <= 0) return 'Exit amount must be greater than 0';

  if (!form.entryAmount?.trim()) return 'Entry amount is required';
  const entryNum = parseFloat(form.entryAmount);
  if (isNaN(entryNum) || entryNum <= 0) return 'Entry amount must be greater than 0';

  return null;
};

// ============================================================================
// Validation Guards (Used in state transitions)
// ============================================================================

/**
 * Guards - Check if page validates before allowing navigation
 * These are exported to be used in state machine transitions
 */
export const validationGuards = {
  canProceedFromAccountPage: (form: WithdrawalForm | DepositForm): boolean => {
    return validateAccountPage(form) === null;
  },

  canProceedFromAmountPage: (form: WithdrawalForm | DepositForm): boolean => {
    return validateAmountPage(form) === null;
  },

  canProceedFromCategoryPage: (form: WithdrawalForm | DepositForm): boolean => {
    return validateCategoryPage(form) === null;
  },

  canProceedFromDestinationPage: (form: WithdrawalForm): boolean => {
    return validateDestinationPage(form) === null;
  },

  canProceedFromSourcePage: (form: DepositForm): boolean => {
    return validateSourcePage(form) === null;
  },

  canProceedFromConfirmationPage: (form: WithdrawalForm | DepositForm | TransferForm): boolean => {
    return validateConfirmationPage(form) === null;
  },

  canProceedFromTransferSourcePage: (form: TransferForm): boolean => {
    return validateTransferSourcePage(form) === null;
  },

  canProceedFromTransferDestPage: (form: TransferForm): boolean => {
    return validateTransferDestPage(form) === null;
  },

  canProceedFromTransferAmountPage: (form: TransferForm): boolean => {
    return validateTransferAmountPage(form) === null;
  },
};

// ============================================================================
// Logging Actions
// ============================================================================

export const logActions = {
  logStateTransition: (_: { context: BudgetMachineContext }, params: { from: string; to: string }) => {
    if (enableDebugLogs) {
      console.log(`🔄 State transition: ${params.from} → ${params.to}`);
    }
  },

  logNavigate: (_: { context: BudgetMachineContext }, params: { screen: string }) => {
    if (enableDebugLogs) {
      console.log(`📱 Navigating to: ${params.screen}`);
    }
  },

  logError: (_: { context: BudgetMachineContext }, params: { error: string; context: string }) => {
    console.error(`❌ ${params.context}: ${params.error}`);
  },

  logFetch: (_: { context: BudgetMachineContext }, params: { resource: string }) => {
    if (enableDebugLogs) {
      console.log(`🔄 Fetching: ${params.resource}`);
    }
  },

  logSuccess: (_: { context: BudgetMachineContext }, params: { message: string }) => {
    if (enableDebugLogs) {
      console.log(`✅ ${params.message}`);
    }
  },
};
