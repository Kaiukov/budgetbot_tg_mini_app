import { useState } from 'react';

export interface ExpenseData {
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
}

const initialExpenseData: ExpenseData = {
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

export const useExpenseData = () => {
  const [expenseData, setExpenseData] = useState<ExpenseData>(initialExpenseData);

  const updateAccount = (account: string) => {
    setExpenseData(prev => ({ ...prev, account }));
  };

  const updateAccountWithDetails = (
    account: string,
    account_id: string,
    account_currency: string,
    username: string
  ) => {
    setExpenseData(prev => ({
      ...prev,
      account,
      account_id,
      account_currency,
      username
    }));
  };

  const updateAmount = (amount: string) => {
    setExpenseData(prev => ({ ...prev, amount }));
  };

  const updateAmountForeign = (amount_foreign: string) => {
    setExpenseData(prev => ({ ...prev, amount_foreign }));
  };

  const updateCategory = (category: string) => {
    setExpenseData(prev => ({ ...prev, category }));
  };

  const updateComment = (comment: string) => {
    setExpenseData(prev => ({ ...prev, comment }));
  };

  const setUserData = (user_id: number, username: string) => {
    setExpenseData(prev => ({ ...prev, user_id, username }));
  };

  const resetExpenseData = () => {
    setExpenseData(initialExpenseData);
  };

  const isValid = () => {
    return expenseData.account !== '' &&
           expenseData.amount !== '' &&
           expenseData.category !== '';
  };

  return {
    expenseData,
    updateAccount,
    updateAccountWithDetails,
    updateAmount,
    updateAmountForeign,
    updateCategory,
    updateComment,
    setUserData,
    resetExpenseData,
    isValid
  };
};
