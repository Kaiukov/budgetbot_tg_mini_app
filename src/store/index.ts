import { create } from 'zustand';
import { createExpenseFlowSlice, ExpenseFlowState } from './expenseFlow.slice';

// Combined store type
type StoreState = ExpenseFlowState;

// Create the store with all slices
export const useStore = create<StoreState>()((...args) => ({
  ...createExpenseFlowSlice(...args),
}));

// Export individual slice types for convenience
export type { ExpenseFlowState };
