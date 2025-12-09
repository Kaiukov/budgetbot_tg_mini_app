/**
 * Budget Machine Context
 * Provides budget machine state to all components without prop drilling
 */

import React, { createContext, ReactNode, useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { budgetMachine } from '../machines/budgetMachine';
import type { BudgetMachineContext as BudgetContext } from '../machines/types';

export interface BudgetMachineContextType {
  state: any;
  context: BudgetContext;
  send: (event: any) => void;
}

const defaultContextValue: BudgetMachineContextType = {
  state: 'loading',
  context: {
    user: { id: 0, user_name: 'Guest', fullName: 'Guest', photoUrl: null, initials: 'G', bio: '', colorScheme: 'dark', rawUser: null },
    transaction: { account: '', amount: '', category: '', category_id: 0, budget_name: '', notes: '', destination_name: '', destination_id: 0, source_name: '', source_id: 0, account_id: '', account_currency: '', user_id: undefined, user_name: '', amount_eur: '', date: '', conversionAmount: null, isLoadingConversion: false, suggestions: [], isLoadingSuggestions: false, suggestionsError: null, isSubmitting: false, submitMessage: null, errors: {} },
    transfer: { user_name: '', source_account_name: '', source_account_id: '', source_account_currency: '', destination_account_name: '', destination_account_id: '', destination_account_currency: '', source_amount: '', destination_amount: '', exchange_rate: null, source_fee: '0', destination_fee: '0', notes: '', date: '', isLoadingConversion: false, isSubmitting: false, errors: {} },
    data: { accounts: [], categories: [], transactions: [] },
    ui: { accounts: { loading: false, error: null }, categories: { loading: false, error: null }, transactions: { loading: false, error: null }, services: { telegram: { name: 'Telegram', status: 'checking', message: '' }, sync: { name: 'Sync', status: 'checking', message: '' }, firefly: { name: 'Firefly', status: 'checking', message: '' } } },
    selectedTransaction: { id: null, rawData: null, editing: null },
  },
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
  const [state, send] = useMachine(budgetMachine);
  const previousStateRef = useRef<any>(null);

  // Add event logging (dev only) - log only state values to avoid emoji serialization issues
  useEffect(() => {
    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
    if (isDev && state !== previousStateRef.current) {
      const prevState = previousStateRef.current?.value || 'initial';
      const currentState = state.value;
      console.log(`🔄 State transition: ${String(prevState)} → ${String(currentState)}`);
      previousStateRef.current = state;
    }
  }, [state]);

  // Add state persistence
  useEffect(() => {
    try {
      const machineState = {
        state: state.value,
        context: {
          // Only persist safe data, skip sensitive info
          user: state.context.user,
          // Don't persist form data during entry
          transaction: state.context.transaction.amount
            ? state.context.transaction
            : { account: '', amount: '', category: '', notes: '', account_id: '', account_currency: '', user_id: undefined, user_name: '', amount_eur: '', conversionAmount: null, isLoadingConversion: false, suggestions: [], isLoadingSuggestions: false, suggestionsError: null, isSubmitting: false, submitMessage: null },
          transfer: state.context.transfer,
          data: state.context.data,
          ui: state.context.ui,
          selectedTransaction: state.context.selectedTransaction,
        },
      };
      localStorage.setItem(MACHINE_STATE_KEY, safeJsonStringify(machineState));
    } catch (error) {
      console.warn('Failed to persist machine state:', error);
    }
  }, [state]);

  return (
    <budgetMachineContext.Provider value={{ state, context: state.context, send }}>
      {children}
    </budgetMachineContext.Provider>
  );
};
