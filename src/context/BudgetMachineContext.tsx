/**
 * Budget Machine Context
 * Provides budget machine state to all components without prop drilling
 */

import React, { createContext, ReactNode } from 'react';
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
    transaction: { account: '', amount: '', category: '', comment: '', account_id: '', account_currency: '', user_id: undefined, username: '', amount_foreign: '' },
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

export const BudgetMachineProvider: React.FC<BudgetMachineProviderProps> = ({ children }) => {
  const machine = useBudgetMachine();

  return (
    <budgetMachineContext.Provider value={machine}>
      {children}
    </budgetMachineContext.Provider>
  );
};
