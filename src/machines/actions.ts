/**
 * Budget Machine Actions
 * Assign actions and guard conditions for xstate
 */

import { assign } from 'xstate';
import type {
  BudgetMachineContext,
  BudgetUser,
} from './types';
import { initialTransactionForm as transactionFormDefault, initialTransferForm as transferFormDefault } from './types';

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
    transaction: ({ context }, params: { category: string; category_id?: number; budget_name?: string }) => ({
      ...context.transaction,
      category: params.category,
      category_id: params.category_id ?? context.transaction.category_id,
      budget_name: params.budget_name ?? context.transaction.budget_name,
    }),
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

  // Transfer Form
  setTransferSource: assign({
    transfer: ({ context }, params: { account: string; id: string; currency: string }) => ({
      ...context.transfer,
      source: {
        account: params.account,
        id: params.id,
        currency: params.currency,
      },
    }),
  }),

  setTransferDest: assign({
    transfer: ({ context }, params: { account: string; id: string; currency: string }) => ({
      ...context.transfer,
      destination: {
        account: params.account,
        id: params.id,
        currency: params.currency,
      },
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

  resetTransfer: assign({
    transfer: () => ({ ...transferFormDefault }),
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
    return context.user.username === 'User' || context.user.username === 'Guest';
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
