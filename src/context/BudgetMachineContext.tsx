/**
 * Budget Machine Context
 * Provides budget machine state to all components without prop drilling
 */

import React, { createContext, ReactNode, useEffect, useRef } from 'react';
import { useBudgetMachine } from '../hooks/useBudgetMachine';
import type { BudgetMachineContext as BudgetContext } from '../machines/types';

export interface BudgetMachineContextType {
  state: any;
  context: BudgetContext;
  navigateTo: (screen: string) => void;
  goHome: () => void;
  goBack: () => void;
  updateAccount: (account: string, account_id: string, account_currency: string, username: string) => void;
  updateAmount: (amount: string) => void;
  updateAmountForeign: (amount_foreign: string) => void;
  updateCategory: (category: string) => void;
  updateComment: (comment: string) => void;
  submitTransaction: () => void;
  resetTransaction: () => void;
  setTransferSource: (account: string, account_id: string, account_currency: string) => void;
  setTransferDest: (account: string, account_id: string, account_currency: string) => void;
  updateTransferExitAmount: (amount: string) => void;
  updateTransferEntryAmount: (amount: string) => void;
  updateTransferExitFee: (fee: string) => void;
  updateTransferEntryFee: (fee: string) => void;
  updateTransferComment: (comment: string) => void;
  submitTransfer: () => void;
  resetTransfer: () => void;
  fetchAccounts: () => void;
  fetchCategories: () => void;
  fetchTransactions: () => void;
  fetchAccountsSuccess: (accounts: any[]) => void;
  fetchCategoriesSuccess: (categories: any[]) => void;
  fetchTransactionsSuccess: (transactions: any[]) => void;
  fetchAccountsError: (error: string) => void;
  fetchCategoriesError: (error: string) => void;
  fetchTransactionsError: (error: string) => void;
  selectTransaction: (id: string, rawData?: any, editing?: any) => void;
  clearSelectedTransaction: () => void;
  editTransaction: () => void;
  deleteTransaction: () => void;
  setServiceStatus: (service: keyof BudgetContext['ui']['services'], status: any) => void;
  send: (event: any) => void;
}

const defaultContextValue: BudgetMachineContextType = {
  state: 'loading',
  context: {
    user: { id: 0, username: 'Guest', fullName: 'Guest', photoUrl: null, initials: 'G', bio: '', colorScheme: 'dark', rawUser: null },
    transaction: { account: '', amount: '', category: '', category_id: 0, budget_name: '', comment: '', destination_name: '', destination_id: 0, account_id: '', account_currency: '', user_id: undefined, username: '', amount_foreign: '', notes: '', conversionAmount: null, isLoadingConversion: false, suggestions: [], isLoadingSuggestions: false, suggestionsError: null, isSubmitting: false, submitMessage: null },
    transfer: { source: { account: '', id: '', currency: '' }, destination: { account: '', id: '', currency: '' }, exitAmount: '', entryAmount: '', exitFee: '', entryFee: '', comment: '' },
    data: { accounts: [], categories: [], transactions: [] },
    ui: { accounts: { loading: false, error: null }, categories: { loading: false, error: null }, transactions: { loading: false, error: null }, services: { telegram: { name: 'Telegram', status: 'checking', message: '' }, sync: { name: 'Sync', status: 'checking', message: '' }, firefly: { name: 'Firefly', status: 'checking', message: '' } } },
    selectedTransaction: { id: null, rawData: null, editing: null },
  },
  navigateTo: () => {},
  goHome: () => {},
  goBack: () => {},
  updateAccount: () => {},
  updateAmount: () => {},
  updateAmountForeign: () => {},
  updateCategory: () => {},
  updateComment: () => {},
  submitTransaction: () => {},
  resetTransaction: () => {},
  setTransferSource: () => {},
  setTransferDest: () => {},
  updateTransferExitAmount: () => {},
  updateTransferEntryAmount: () => {},
  updateTransferExitFee: () => {},
  updateTransferEntryFee: () => {},
  updateTransferComment: () => {},
  submitTransfer: () => {},
  resetTransfer: () => {},
  fetchAccounts: () => {},
  fetchCategories: () => {},
  fetchTransactions: () => {},
  fetchAccountsSuccess: () => {},
  fetchCategoriesSuccess: () => {},
  fetchTransactionsSuccess: () => {},
  fetchAccountsError: () => {},
  fetchCategoriesError: () => {},
  fetchTransactionsError: () => {},
  selectTransaction: () => {},
  clearSelectedTransaction: () => {},
  editTransaction: () => {},
  deleteTransaction: () => {},
  setServiceStatus: () => {},
  send: () => {},
};

export const budgetMachineContext = createContext<BudgetMachineContextType>(defaultContextValue);

export const useBudgetMachineContext = () => {
  const context = React.useContext(budgetMachineContext);
  if (!context) {
    throw new Error('useBudgetMachineContext must be used within BudgetMachineProvider');
  }
  return context;
};

export interface BudgetMachineProviderProps {
  children: ReactNode;
}

const MACHINE_STATE_KEY = 'budget-machine-state';

/**
 * Safe JSON stringifier that handles Unicode surrogate pairs correctly
 * Prevents "no low surrogate in string" errors by sanitizing strings
 */
function safeJsonStringify(obj: any): string {
  // Custom replacer function to sanitize strings with potential surrogate pair issues
  const replacer = (_key: string, value: any): any => {
    if (typeof value === 'string') {
      // Replace any unpaired surrogates with Unicode replacement character (U+FFFD)
      // This regex matches:
      // - High surrogate without low surrogate: /[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g
      // - Low surrogate without high surrogate: /(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g
      return value
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '\uFFFD')  // unpaired high surrogate
        .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD'); // unpaired low surrogate
    }
    return value;
  };

  return JSON.stringify(obj, replacer);
}

export const BudgetMachineProvider: React.FC<BudgetMachineProviderProps> = ({ children }) => {
  const machine = useBudgetMachine();
  const previousStateRef = useRef<any>(null);

  // Add event logging (dev only) - log only state values to avoid emoji serialization issues
  useEffect(() => {
    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
    if (isDev && machine.state !== previousStateRef.current) {
      const prevState = previousStateRef.current?.value || 'initial';
      const currentState = machine.state.value;
      console.log(`🔄 State transition: ${String(prevState)} → ${String(currentState)}`);
      previousStateRef.current = machine.state;
    }
  }, [machine.state]);

  // Add state persistence
  useEffect(() => {
    try {
      const machineState = {
        state: machine.state.value,
        context: {
          // Only persist safe data, skip sensitive info
          user: machine.context.user,
          // Don't persist form data during entry
          transaction: machine.context.transaction.amount
            ? machine.context.transaction
            : { account: '', amount: '', category: '', comment: '', account_id: '', account_currency: '', user_id: undefined, username: '', amount_foreign: '', conversionAmount: null, isLoadingConversion: false, suggestions: [], isLoadingSuggestions: false, suggestionsError: null, isSubmitting: false, submitMessage: null },
          transfer: machine.context.transfer,
          data: machine.context.data,
          ui: machine.context.ui,
          selectedTransaction: machine.context.selectedTransaction,
        },
      };
      localStorage.setItem(MACHINE_STATE_KEY, safeJsonStringify(machineState));
    } catch (error) {
      console.warn('Failed to persist machine state:', error);
    }
  }, [machine.state, machine.context]);

  return (
    <budgetMachineContext.Provider value={machine}>
      {children}
    </budgetMachineContext.Provider>
  );
};
