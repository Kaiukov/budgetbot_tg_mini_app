import { useState } from 'react';

export interface ExpenseData {
  account: string;
  amount: string;
  category: string;
  comment: string;
}

const initialExpenseData: ExpenseData = {
  account: '',
  amount: '',
  category: '',
  comment: ''
};

export const useExpenseData = () => {
  const [expenseData, setExpenseData] = useState<ExpenseData>(initialExpenseData);

  const updateAccount = (account: string) => {
    setExpenseData(prev => ({ ...prev, account }));
  };

  const updateAmount = (amount: string) => {
    setExpenseData(prev => ({ ...prev, amount }));
  };

  const updateCategory = (category: string) => {
    setExpenseData(prev => ({ ...prev, category }));
  };

  const updateComment = (comment: string) => {
    setExpenseData(prev => ({ ...prev, comment }));
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
    updateAmount,
    updateCategory,
    updateComment,
    resetExpenseData,
    isValid
  };
};
