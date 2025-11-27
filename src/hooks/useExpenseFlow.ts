import { useCallback } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';
import type { TransactionData } from './useTransactionData';
import type { CategoryUsage } from '../services/sync';

export interface ExpenseFlowState {
  transaction: TransactionData;
  categoryId: number | null;
  review: TransactionData | null;
  amountRef: string;
  categories: CategoryUsage[];
  categoriesLoading: boolean;
  categoriesError: string | null;
}

export interface ExpenseFlowHandlers {
  updateTransaction: (patch: Partial<TransactionData>) => void;
  updateAmount: (value: string) => void;
  updateAmountForeign: (value: string) => void;
  updateAccount: (account: string) => void;
  updateAccountWithDetails: (
    account: string,
    account_id: string,
    account_currency: string,
    username: string
  ) => void;
  updateCategory: (category: string) => void;
  updateComment: (comment: string) => void;
  setUserData: (user_id: number, username: string) => void;
  setCategoryId: (id: number | null) => void;
  setReview: (review: TransactionData | null) => void;
  setAmountRef: (amount: string) => void;
  fetchCategories: (userName?: string) => Promise<void>;
  resetFlow: () => void;
  buildReview: () => TransactionData;
}

export interface ExpenseFlowAPI extends ExpenseFlowState, ExpenseFlowHandlers {}

export const useExpenseFlow = (): ExpenseFlowAPI => {
  // Select all expense-related state from Zustand
  const transaction = useBudgetStore((state) => state.transaction);
  const expenseCategoryId = useBudgetStore((state) => state.expenseCategoryId);
  const expenseReview = useBudgetStore((state) => state.expenseReview);
  const expenseAmountRef = useBudgetStore((state) => state.expenseAmountRef);
  const expenseCategories = useBudgetStore((state) => state.expenseCategories);
  const expenseCategoriesLoading = useBudgetStore((state) => state.expenseCategoriesLoading);
  const expenseCategoriesError = useBudgetStore((state) => state.expenseCategoriesError);

  // Select all expense-related setters from Zustand
  const setTransaction = useBudgetStore((state) => state.setTransaction);
  const setExpenseCategoryId = useBudgetStore((state) => state.setExpenseCategoryId);
  const setExpenseReview = useBudgetStore((state) => state.setExpenseReview);
  const setExpenseAmountRef = useBudgetStore((state) => state.setExpenseAmountRef);
  const fetchExpenseCategories = useBudgetStore((state) => state.fetchExpenseCategories);
  const resetExpenseFlowState = useBudgetStore((state) => state.resetExpenseFlow);
  const buildExpenseReview = useBudgetStore((state) => state.buildExpenseReview);

  // Create memoized handlers to prevent unnecessary re-renders
  const updateTransaction = useCallback(
    (patch: Partial<TransactionData>) => setTransaction(patch),
    [setTransaction]
  );

  const updateAmount = useCallback(
    (value: string) => setTransaction({ amount: value }),
    [setTransaction]
  );

  const updateAmountForeign = useCallback(
    (value: string) => setTransaction({ amount_foreign: value }),
    [setTransaction]
  );

  const updateAccount = useCallback(
    (account: string) => setTransaction({ account }),
    [setTransaction]
  );

  const updateAccountWithDetails = useCallback(
    (account: string, account_id: string, account_currency: string, username: string) =>
      setTransaction({ account, account_id, account_currency, username }),
    [setTransaction]
  );

  const updateCategory = useCallback(
    (category: string) => setTransaction({ category }),
    [setTransaction]
  );

  const updateComment = useCallback(
    (comment: string) => setTransaction({ comment }),
    [setTransaction]
  );

  const setUserData = useCallback(
    (user_id: number, username: string) => setTransaction({ user_id, username }),
    [setTransaction]
  );

  const setCategoryId = useCallback(
    (id: number | null) => setExpenseCategoryId(id),
    [setExpenseCategoryId]
  );

  const setReview = useCallback(
    (review: TransactionData | null) => setExpenseReview(review),
    [setExpenseReview]
  );

  const setAmountRef = useCallback(
    (amount: string) => setExpenseAmountRef(amount),
    [setExpenseAmountRef]
  );

  const fetchCategories = useCallback(
    (userName?: string) => fetchExpenseCategories(userName),
    [fetchExpenseCategories]
  );

  const resetFlow = useCallback(
    () => resetExpenseFlowState(),
    [resetExpenseFlowState]
  );

  const buildReview = useCallback(
    () => buildExpenseReview(),
    [buildExpenseReview]
  );

  return {
    // State
    transaction,
    categoryId: expenseCategoryId,
    review: expenseReview,
    amountRef: expenseAmountRef,
    categories: expenseCategories,
    categoriesLoading: expenseCategoriesLoading,
    categoriesError: expenseCategoriesError,
    // Handlers
    updateTransaction,
    updateAmount,
    updateAmountForeign,
    updateAccount,
    updateAccountWithDetails,
    updateCategory,
    updateComment,
    setUserData,
    setCategoryId,
    setReview,
    setAmountRef,
    fetchCategories,
    resetFlow,
    buildReview,
  };
};
