import { useState } from 'react';
import { extractBudgetName } from '../services/sync/utils';

export type TransactionType = 'withdrawal' | 'deposit' | 'transfer';

export interface TransactionData {
  // User identification
  user_name: string;

  // Account data
  account_name: string;
  account_id: number;
  account_currency: string;

  // Amount data
  amount: string;
  amount_eur: number;

  // Category data
  category_id: number;
  category_name: string;
  budget_name: string; // Category name without emoji (Unicode preserved)

  // Destination/Comment data
  destination_id: number;
  destination_name: string;

  // Notes (free-form memo)
  notes: string;

  // Metadata
  date: string; // ISO timestamp
}

const initialTransactionData: TransactionData = {
  user_name: '',
  account_name: '',
  account_id: 0,
  account_currency: '',
  amount: '',
  amount_eur: 0,
  category_id: 0,
  category_name: '',
  budget_name: '',
  destination_id: 0,
  destination_name: '',
  notes: '',
  date: '',
};

/**
 * Generic transaction data hook
 * Replaces useExpenseData with type-aware version
 * Supports withdrawal, deposit, and transfer transaction types
 */
export const useTransactionData = (type: TransactionType = 'withdrawal') => {
  const [transactionData, setTransactionData] = useState<TransactionData>(initialTransactionData);
  const [transactionType] = useState<TransactionType>(type);

  const setUserName = (user_name: string) => {
    setTransactionData(prev => ({ ...prev, user_name }));
  };

  const updateAccountWithDetails = (
    account_name: string,
    account_id: number,
    account_currency: string
  ) => {
    setTransactionData(prev => ({
      ...prev,
      account_name,
      account_id,
      account_currency,
    }));
  };

  const updateAmount = (amount: string) => {
    setTransactionData(prev => ({ ...prev, amount }));
  };

  const updateAmountEUR = (amount_eur: number) => {
    setTransactionData(prev => ({ ...prev, amount_eur }));
  };

  const updateCategory = (category_name: string, category_id: number, budget_name = '') => {
    const normalizedBudget = budget_name.trim().length > 0
      ? budget_name.trim()
      : extractBudgetName(category_name);

    setTransactionData(prev => ({ ...prev, category_name, category_id, budget_name: normalizedBudget }));
  };

  const updateDestination = (destination_id: number, destination_name: string) => {
    setTransactionData(prev => ({ ...prev, destination_id, destination_name }));
  };

  const updateNotes = (notes: string) => {
    setTransactionData(prev => ({ ...prev, notes }));
  };

  const setDate = (date: string) => {
    setTransactionData(prev => ({ ...prev, date }));
  };

  const resetTransactionData = () => {
    setTransactionData(initialTransactionData);
  };

  const isValid = () => {
    return transactionData.account_name !== '' &&
           transactionData.amount !== '' &&
           transactionData.category_name !== '' &&
           transactionData.destination_name !== '';
  };

  return {
    transactionData,
    transactionType,
    setUserName,
    updateAccountWithDetails,
    updateAmount,
    updateAmountEUR,
    updateCategory,
    updateDestination,
    updateNotes,
    setDate,
    resetTransactionData,
    isValid
  };
};
