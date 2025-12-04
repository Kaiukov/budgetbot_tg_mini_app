/**
 * useBudgetMachine Hook
 * Wrapper around xstate useMachine for the budget app
 */

import { useMachine } from '@xstate/react';
import { budgetMachine } from '../machines/budgetMachine';
import type { BudgetMachineContext } from '../machines/types';

export function useBudgetMachine() {
  const [state, send] = useMachine(budgetMachine);

  return {
    // State
    state: state,
    context: state.context,

    // Navigation
    navigateTo: (screen: string) => send({ type: `NAVIGATE_${screen.toUpperCase()}` }),
    goHome: () => send({ type: 'NAVIGATE_HOME' }),
    goBack: () => send({ type: 'NAVIGATE_BACK' }),

    // Transaction Form
    updateAccount: (account: string, account_id: string, account_currency: string, user_name: string) => {
      send({
        type: 'UPDATE_ACCOUNT',
        account,
        account_id,
        account_currency,
        user_name,
      });
    },
    updateAmount: (amount: string) => {
      send({ type: 'UPDATE_AMOUNT', amount });
    },
    updateAmountEur: (amount_eur: string) => {
      send({ type: 'UPDATE_AMOUNT_EUR', amount_foreign: amount_eur });
    },
    updateCategory: (category: string) => {
      send({ type: 'UPDATE_CATEGORY', category });
    },
    updateNotes: (notes: string) => {
      send({ type: 'UPDATE_NOTES', notes });
    },
    submitTransaction: () => {
      send({ type: 'SUBMIT_TRANSACTION' });
    },
    resetTransaction: () => {
      send({ type: 'RESET_TRANSACTION' });
    },

    // Transfer Form
    setTransferSource: (account: string, account_id: string, account_currency: string, user_name: string = '') => {
      send({
        type: 'SET_TRANSFER_SOURCE',
        account,
        id: account_id,
        currency: account_currency,
        user_name,
      });
    },
    setTransferDest: (account: string, account_id: string, account_currency: string, user_name: string = '') => {
      send({
        type: 'SET_TRANSFER_DEST',
        account,
        id: account_id,
        currency: account_currency,
        user_name,
      });
    },
    updateTransferExitAmount: (amount: string) => {
      send({ type: 'UPDATE_TRANSFER_EXIT_AMOUNT', amount });
    },
    updateTransferEntryAmount: (amount: string) => {
      send({ type: 'UPDATE_TRANSFER_ENTRY_AMOUNT', amount });
    },
    updateTransferExitFee: (fee: string) => {
      send({ type: 'UPDATE_TRANSFER_EXIT_FEE', fee });
    },
    updateTransferEntryFee: (fee: string) => {
      send({ type: 'UPDATE_TRANSFER_ENTRY_FEE', fee });
    },
    updateTransferNotes: (notes: string) => {
      send({ type: 'UPDATE_TRANSFER_NOTES', notes });
    },
    submitTransfer: () => {
      send({ type: 'SUBMIT_TRANSFER' });
    },
    resetTransfer: () => {
      send({ type: 'RESET_TRANSFER' });
    },

    // Data Fetching
    fetchAccounts: () => {
      send({ type: 'FETCH_ACCOUNTS' });
    },
    fetchCategories: () => {
      send({ type: 'FETCH_CATEGORIES' });
    },
    fetchTransactions: () => {
      send({ type: 'FETCH_TRANSACTIONS' });
    },
    fetchAccountsSuccess: (accounts: any[]) => {
      send({ type: 'FETCH_ACCOUNTS_SUCCESS', accounts });
    },
    fetchCategoriesSuccess: (categories: any[]) => {
      send({ type: 'FETCH_CATEGORIES_SUCCESS', categories });
    },
    fetchTransactionsSuccess: (transactions: any[]) => {
      send({ type: 'FETCH_TRANSACTIONS_SUCCESS', transactions });
    },
    fetchAccountsError: (error: string) => {
      send({ type: 'FETCH_ACCOUNTS_ERROR', error });
    },
    fetchCategoriesError: (error: string) => {
      send({ type: 'FETCH_CATEGORIES_ERROR', error });
    },
    fetchTransactionsError: (error: string) => {
      send({ type: 'FETCH_TRANSACTIONS_ERROR', error });
    },

    // Transaction Selection
    selectTransaction: (id: string, rawData?: any, editing?: any) => {
      send({ type: 'SELECT_TRANSACTION', id, rawData, editing });
    },
    clearSelectedTransaction: () => {
      send({ type: 'CLEAR_SELECTED_TRANSACTION' });
    },

    // Transaction Operations
    editTransaction: () => {
      send({ type: 'NAVIGATE_TRANSACTION_EDIT' });
    },
    deleteTransaction: () => {
      send({ type: 'DELETE_TRANSACTION' });
    },

    // Service Status
    setServiceStatus: (service: keyof BudgetMachineContext['ui']['services'], status: any) => {
      send({ type: 'SERVICE_STATUS_CHANGED', service, status });
    },

    // Raw send for advanced usage
    send,
  };
}
