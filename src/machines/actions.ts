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
import { needsConversion, normalizeCurrency } from '../utils/currency';

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

  // Transfer Form - Standardized field naming
  setTransferSource: assign({
    transfer: ({ context }, params: { user_name: string; source_account_name: string; source_account_id: string; source_account_currency: string }) => ({
      ...context.transfer,
      user_name: params.user_name,
      source_account_name: params.source_account_name,
      source_account_id: params.source_account_id,
      source_account_currency: params.source_account_currency,
    }),
  }),

  setTransferDest: assign({
    transfer: ({ context }, params: { destination_account_name: string; destination_account_id: string; destination_account_currency: string }) => ({
      ...context.transfer,
      destination_account_name: params.destination_account_name,
      destination_account_id: params.destination_account_id,
      destination_account_currency: params.destination_account_currency,
    }),
  }),

  updateTransferSourceAmount: assign({
    transfer: ({ context }, params: { source_amount: string }) => ({
      ...context.transfer,
      source_amount: params.source_amount,
    }),
  }),

  updateTransferDestAmount: assign({
    transfer: ({ context }, params: { destination_amount: string }) => ({
      ...context.transfer,
      destination_amount: params.destination_amount,
    }),
  }),

  updateTransferExchangeRate: assign({
    transfer: ({ context }, params: { exchange_rate: number }) => ({
      ...context.transfer,
      exchange_rate: params.exchange_rate,
    }),
  }),

  updateTransferSourceFee: assign({
    transfer: ({ context }, params: { source_fee: string }) => ({
      ...context.transfer,
      source_fee: params.source_fee || '0',
    }),
  }),

  updateTransferDestFee: assign({
    transfer: ({ context }, params: { destination_fee: string }) => ({
      ...context.transfer,
      destination_fee: params.destination_fee || '0',
    }),
  }),

  updateTransferNotes: assign({
    transfer: ({ context }, params: { notes: string }) => ({
      ...context.transfer,
      notes: params.notes,
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

  // Smart Clearing Actions (Phase 5: State clearing on navigation)
  trackDestinationChange: assign({
    transfer: ({ context }) => ({
      ...context.transfer,
      prevDestinationAccountId: context.transfer.destination_account_id,
    }),
  }),

  clearTransferAmounts: assign({
    transfer: ({ context }) => ({
      ...context.transfer,
      source_amount: '',
      destination_amount: '',
      exchange_rate: null,
    }),
  }),

  clearTransferFees: assign({
    transfer: ({ context }) => ({
      ...context.transfer,
      source_fee: '0',
      destination_fee: '0',
    }),
  }),

  clearTransferAmountsAndFees: assign({
    transfer: ({ context }) => ({
      ...context.transfer,
      source_amount: '',
      destination_amount: '',
      exchange_rate: null,
      source_fee: '0',
      destination_fee: '0',
    }),
  }),

  smartClearOnAmountBack: assign({
    transfer: ({ context }) => {
      // If destination changed, clear amounts (they're invalid for new currency)
      const destChanged = context.transfer.destination_account_id !== context.transfer.prevDestinationAccountId;
      if (destChanged) {
        return {
          ...context.transfer,
          source_amount: '',
          destination_amount: '',
          exchange_rate: null,
          prevDestinationAccountId: context.transfer.destination_account_id,
        };
      }
      // If destination unchanged, keep amounts (they're still valid)
      return context.transfer;
    },
  }),

  smartClearOnFeeBack: assign({
    transfer: ({ context }) => {
      // If destination changed, clear destination fee only (source currency unchanged)
      const destChanged = context.transfer.destination_account_id !== context.transfer.prevDestinationAccountId;
      if (destChanged) {
        return {
          ...context.transfer,
          destination_fee: '0',
          prevDestinationAccountId: context.transfer.destination_account_id,
        };
      }
      // If destination unchanged, keep all fees
      return context.transfer;
    },
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
      context.transfer.source_account_id !== '' &&
      context.transfer.destination_account_id !== '' &&
      context.transfer.source_amount !== '' &&
      context.transfer.destination_amount !== ''
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
 * Required fields: user_name, source_account_id, source_account_name, source_account_currency
 */
export const validateTransferSourcePage = (form: TransferForm): string | null => {
  if (!form.user_name?.trim()) return 'User name is required';
  if (!form.source_account_id?.trim()) return 'Source account ID is required';
  if (!form.source_account_name?.trim()) return 'Source account name is required';
  if (!form.source_account_currency?.trim()) return 'Source account currency is required';
  return null;
};

/**
 * Validates transfer destination page
 * Required fields: destination_account_id, destination_account_name, destination_account_currency
 * Also validates that source and destination accounts are different
 */
export const validateTransferDestPage = (form: TransferForm): string | null => {
  if (!form.destination_account_id?.trim()) return 'Destination account ID is required';
  if (!form.destination_account_name?.trim()) return 'Destination account name is required';
  if (!form.destination_account_currency?.trim()) return 'Destination account currency is required';

  // Validate that source and destination are different
  if (form.source_account_id === form.destination_account_id) {
    return 'Source and destination accounts must be different';
  }

  return null;
};

/**
 * Validates transfer amount page
 * Required fields: source_amount, destination_amount, exchange_rate (if multi-currency)
 */
export const validateTransferAmountPage = (form: TransferForm): string | null => {
  if (!form.source_amount?.trim()) return 'Source amount is required';
  const sourceNum = parseFloat(form.source_amount);
  if (isNaN(sourceNum) || sourceNum <= 0) return 'Source amount must be greater than 0';

  if (!form.destination_amount?.trim()) return 'Destination amount is required';
  const destNum = parseFloat(form.destination_amount);
  if (isNaN(destNum) || destNum <= 0) return 'Destination amount must be greater than 0';

  // If currencies differ, exchange rate must be present and not zero
  if (form.source_account_currency !== form.destination_account_currency) {
    if (form.exchange_rate === null || form.exchange_rate === undefined || form.exchange_rate === 0) {
      return 'Exchange rate is required for multi-currency transfers';
    }
  }

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
    // First validate basic amount requirements
    if (validateAmountPage(form) !== null) return false;

    // For non-EUR currencies, require currency conversion to be complete
    const currencyCode = normalizeCurrency(form?.account_currency);
    if (needsConversion(currencyCode)) {
      // Check that conversion is done (not loading) and has a result
      // conversionAmount stores the actual conversion result from the API
      const hasConversion = form?.conversionAmount !== null && form?.conversionAmount !== undefined && form?.conversionAmount !== 0;
      const isStillLoading = form?.isLoadingConversion === true;
      if (!hasConversion || isStillLoading) return false;
    }

    return true;
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
