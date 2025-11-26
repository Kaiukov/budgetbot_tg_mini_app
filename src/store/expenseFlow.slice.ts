import { StateCreator } from 'zustand';
import type { CategoryUsage } from '../services/sync';
import type { TransactionData } from '../hooks/useTransactionData';

export interface ExpenseFlowState {
  // Categories
  expenseCategories: CategoryUsage[];
  expenseCategoriesLoading: boolean;
  expenseCategoriesError: string | null;
  expenseCategoryId: number | null;

  // Transaction data for review
  expenseReview: TransactionData | null;

  // Amount preservation (for back navigation)
  expenseAmountRef: string;

  // Comment reset key (forces remount)
  commentResetKey: number;

  // Actions
  setExpenseCategories: (categories: CategoryUsage[]) => void;
  setExpenseCategoriesLoading: (loading: boolean) => void;
  setExpenseCategoriesError: (error: string | null) => void;
  setExpenseCategoryId: (id: number | null) => void;
  setExpenseReview: (review: TransactionData | null) => void;
  setExpenseAmountRef: (amount: string) => void;
  incrementCommentResetKey: () => void;

  // Complex actions
  resetExpenseFlow: () => void;
  buildExpenseReview: (transactionData: TransactionData) => void;
}

const initialState = {
  expenseCategories: [],
  expenseCategoriesLoading: false,
  expenseCategoriesError: null,
  expenseCategoryId: null,
  expenseReview: null,
  expenseAmountRef: '',
  commentResetKey: 0,
};

export const createExpenseFlowSlice: StateCreator<ExpenseFlowState> = (set) => ({
  ...initialState,

  // Basic setters
  setExpenseCategories: (categories) => set({ expenseCategories: categories }),

  setExpenseCategoriesLoading: (loading) => set({ expenseCategoriesLoading: loading }),

  setExpenseCategoriesError: (error) => set({ expenseCategoriesError: error }),

  setExpenseCategoryId: (id) => set({ expenseCategoryId: id }),

  setExpenseReview: (review) => set({ expenseReview: review }),

  setExpenseAmountRef: (amount) => set({ expenseAmountRef: amount }),

  incrementCommentResetKey: () =>
    set((state) => ({ commentResetKey: state.commentResetKey + 1 })),

  // Complex actions
  resetExpenseFlow: () => set(initialState),

  buildExpenseReview: (transactionData) =>
    set({ expenseReview: transactionData }),
});
