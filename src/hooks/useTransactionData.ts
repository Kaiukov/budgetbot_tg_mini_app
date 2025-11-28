import { useState } from 'react';

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface TransactionData {
  account: string;
  amount: string;
  category: string;
  comment: string;
  // Additional fields for Firefly transaction submission
  account_id?: string;
  account_currency?: string;
  user_id?: number;
  username?: string;
  amount_foreign?: string;
  // New fields for expense flow refinement
  destination_id?: string;        // Set at Comment screen
  date?: string;                  // ISO timestamp, set at Confirmation
  budget_name?: string;           // Category name without emoji, set at Categories
  category_id?: string | number;  // Set at Categories screen
}

const initialTransactionData: TransactionData = {
  account: '',
  amount: '',
  category: '',
  comment: '',
  account_id: '',
  account_currency: '',
  user_id: undefined,
  username: '',
  amount_foreign: '',
};

/**
 * Generic transaction data hook
 * Replaces useExpenseData with type-aware version
 * Supports expense, income, and transfer transaction types
 */
export const useTransactionData = (type: TransactionType = 'expense') => {
  const [transactionData, setTransactionData] = useState<TransactionData>(initialTransactionData);
  const [transactionType] = useState<TransactionType>(type);

  const updateAccount = (account: string) => {
    setTransactionData(prev => ({ ...prev, account }));
  };

  const updateAccountWithDetails = (
    account: string,
    account_id: string,
    account_currency: string,
    username: string
  ) => {
    setTransactionData(prev => ({
      ...prev,
      account,
      account_id,
      account_currency,
      username
    }));
  };

  const updateAmount = (amount: string) => {
    setTransactionData(prev => ({ ...prev, amount }));
  };

  const updateAmountForeign = (amount_foreign: string) => {
    setTransactionData(prev => ({ ...prev, amount_foreign }));
  };

  const updateCategory = (category: string) => {
    setTransactionData(prev => ({ ...prev, category }));
  };

  const updateComment = (comment: string) => {
    setTransactionData(prev => ({ ...prev, comment }));
  };

  const setUserData = (user_id: number, username: string) => {
    setTransactionData(prev => ({ ...prev, user_id, username }));
  };

  const resetTransactionData = () => {
    setTransactionData(initialTransactionData);
  };

  const isValid = () => {
    return transactionData.account !== '' &&
           transactionData.amount !== '' &&
           transactionData.category !== '';
  };

  return {
    transactionData,
    transactionType,
    updateAccount,
    updateAccountWithDetails,
    updateAmount,
    updateAmountForeign,
    updateCategory,
    updateComment,
    setUserData,
    resetTransactionData,
    isValid
  };
};
