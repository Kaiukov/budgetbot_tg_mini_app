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
  selectAccount: (accountName: string, accountId: string, accountCurrency: string, userName: string) => void;
  updateCategory: (category: string) => void;
  updateComment: (comment: string) => void;
  setUserData: (user_id: number, username: string) => void;
  setCategoryId: (id: number | null) => void;
  setReview: (review: TransactionData | null) => void;
  setAmountRef: (amount: string) => void;
  fetchCategories: (userName?: string) => Promise<void>;
  resetFlow: () => void;
  buildReview: () => TransactionData;
  preserveOnBack: () => void;
  restoreAmountIfSameAccount: (previousAccountId: string) => void;
}

export interface ExpenseFlowAPI extends ExpenseFlowState, ExpenseFlowHandlers {}

export const useExpenseFlow = (): ExpenseFlowAPI => {
  // Select all expense-related state from Zustand
  const transaction = useBudgetStore((state) => state.transaction);
  const expenseCategoryId = useBudgetStore((state) => state.expenseCategoryId);
  const expenseReview = useBudgetStore((state) => state.expenseReview);
  const expenseAmountRef = useBudgetStore((state) => state.expenseAmountRef);
  const isExpenseFlowActive = useBudgetStore((state) => state.isExpenseFlowActive);
  const expenseCategories = useBudgetStore((state) => state.expenseCategories);
  const expenseCategoriesLoading = useBudgetStore((state) => state.expenseCategoriesLoading);
  const expenseCategoriesError = useBudgetStore((state) => state.expenseCategoriesError);

  // Select all expense-related setters from Zustand
  const setTransaction = useBudgetStore((state) => state.setTransaction);
  const setExpenseCategoryId = useBudgetStore((state) => state.setExpenseCategoryId);
  const setExpenseReview = useBudgetStore((state) => state.setExpenseReview);
  const setExpenseAmountRef = useBudgetStore((state) => state.setExpenseAmountRef);
  const setExpenseFlowActive = useBudgetStore((state) => state.setExpenseFlowActive);
  const preserveExpenseAmountRef = useBudgetStore((state) => state.preserveExpenseAmountRef);
  const selectExpenseAccountAction = useBudgetStore((state) => state.selectExpenseAccount);
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

  const selectAccount = useCallback(
    (accountName: string, accountId: string, accountCurrency: string, userName: string) =>
      selectExpenseAccountAction(accountName, accountId, accountCurrency, userName),
    [selectExpenseAccountAction]
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

  const preserveOnBack = useCallback(() => {
    // When user presses back from amount screen, mark flow as active and save amountRef
    console.log('🔙 preserveOnBack called, current amount:', transaction.amount);
    setExpenseFlowActive(true);
    if (transaction.amount) {
      preserveExpenseAmountRef(transaction.amount);
    }
  }, [transaction.amount, setExpenseFlowActive, preserveExpenseAmountRef]);

  const restoreAmountIfSameAccount = useCallback(
    (previousAccountId: string) => {
      // Smart restoration: restore amount ONLY if:
      // 1. Flow is marked active (user came back from amount screen)
      // 2. Same account is selected (newAccountId matches previousAccountId)
      // 3. Amount is not currently set (avoid overwriting)
      const currentAccountId = String(transaction.account_id || '');
      const isSameAccount = currentAccountId === previousAccountId;
      const hasAmountRef = !!expenseAmountRef;
      const shouldRestore = isExpenseFlowActive && isSameAccount && hasAmountRef && !transaction.amount;

      console.log('🔄 restoreAmountIfSameAccount check:', {
        isFlowActive: isExpenseFlowActive,
        isSameAccount,
        currentAccountId,
        previousAccountId,
        hasAmountRef,
        currentAmount: transaction.amount,
        willRestore: shouldRestore,
      });

      if (shouldRestore) {
        console.log('✅ RESTORING amount:', expenseAmountRef);
        updateAmount(expenseAmountRef);
      }
    },
    [isExpenseFlowActive, transaction.account_id, transaction.amount, expenseAmountRef, updateAmount]
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
    selectAccount,
    updateCategory,
    updateComment,
    setUserData,
    setCategoryId,
    setReview,
    setAmountRef,
    fetchCategories,
    resetFlow,
    buildReview,
    preserveOnBack,
    restoreAmountIfSameAccount,
  };
};
