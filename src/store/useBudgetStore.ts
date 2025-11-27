import { create } from 'zustand';
import { accountsCache, categoriesCache, destinationsCache } from '../utils/cache';
import { syncService, type AccountUsage, type CategoryUsage, type DestinationSuggestion } from '../services/sync';
import type { TransactionData } from '../hooks/useTransactionData';

export type Screen =
  | 'home'
  | 'expense-accounts'
  | 'expense-amount'
  | 'expense-category'
  | 'expense-comment'
  | 'expense-confirm'
  | 'income-accounts'
  | 'income-amount'
  | 'income-category'
  | 'income-comment'
  | 'income-confirm'
  | 'transfer-source-accounts'
  | 'transfer-dest-accounts'
  | 'transfer-amount'
  | 'transfer-fees'
  | 'transfer-comment'
  | 'transfer-confirm'
  | 'debug'
  | 'transactions'
  | 'transaction-detail'
  | 'transaction-edit';

interface NavigationSlice {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  commentResetKey: number;
  bumpCommentResetKey: () => void;
}

interface AccountsSlice {
  accounts: AccountUsage[];
  accountsLoading: boolean;
  accountsError: string | null;
  fetchAccounts: (userName?: string) => Promise<void>;
}

interface CategoriesSlice {
  expenseCategories: CategoryUsage[];
  expenseCategoriesLoading: boolean;
  expenseCategoriesError: string | null;
  fetchExpenseCategories: (userName?: string) => Promise<void>;
}

interface DestinationsSlice {
  destinations: DestinationSuggestion[];
  destinationsLoading: boolean;
  destinationsError: string | null;
  fetchDestinations: (userName: string, categoryId?: string | number) => Promise<void>;
  clearDestinations: () => void;
}

interface ExpenseFlowSlice {
  transaction: TransactionData;
  expenseCategoryId: number | null;
  expenseReview: TransactionData | null;
  expenseAmountRef: string;
  setTransaction: (patch: Partial<TransactionData>) => void;
  setExpenseCategoryId: (id: number | null) => void;
  setExpenseReview: (review: TransactionData | null) => void;
  setExpenseAmountRef: (amount: string) => void;
  resetExpenseFlow: () => void;
  buildExpenseReview: () => TransactionData;
}

type BudgetStore = NavigationSlice & AccountsSlice & CategoriesSlice & DestinationsSlice & ExpenseFlowSlice;

const initialTransaction: TransactionData = {
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

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  // Navigation
  currentScreen: 'home',
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  commentResetKey: 0,
  bumpCommentResetKey: () => set((state) => ({ commentResetKey: state.commentResetKey + 1 })),

  // Accounts
  accounts: [],
  accountsLoading: false,
  accountsError: null,
  fetchAccounts: async (userName) => {
    const cacheKey = userName || 'all';
    const cached = accountsCache.get(cacheKey);

    if (cached) {
      set({ accounts: cached });
      return;
    }

    set({ accountsLoading: true, accountsError: null });

    try {
      const isUnknownUser = userName === 'User' || userName === 'Guest';
      const data = await syncService.getAccountsUsage(isUnknownUser ? undefined : userName);

      const uniqueAccounts = data.get_accounts_usage.filter(
        (account, index, self) =>
          index === self.findIndex((a) => a.account_id === account.account_id)
      );

      accountsCache.set(cacheKey, uniqueAccounts);
      set({ accounts: uniqueAccounts });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch accounts';
      set({ accountsError: errorMessage });
    } finally {
      set({ accountsLoading: false });
    }
  },

  // Expense categories
  expenseCategories: [],
  expenseCategoriesLoading: false,
  expenseCategoriesError: null,
  fetchExpenseCategories: async (userName) => {
    const categoryType = 'withdrawal';
    const cacheKey = `${userName || 'all'}_${categoryType}`;
    const cached = categoriesCache.get(cacheKey);

    if (cached) {
      set({ expenseCategories: cached });
      return;
    }

    set({ expenseCategoriesLoading: true, expenseCategoriesError: null });

    try {
      const isUnknownUser = userName === 'User' || userName === 'Guest';
      const data = await syncService.getCategoriesUsage(
        isUnknownUser ? undefined : userName,
        categoryType
      );

      categoriesCache.set(cacheKey, data.get_categories_usage);
      set({ expenseCategories: data.get_categories_usage });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
      set({ expenseCategoriesError: errorMessage });
    } finally {
      set({ expenseCategoriesLoading: false });
    }
  },

  // Destinations
  destinations: [],
  destinationsLoading: false,
  destinationsError: null,
  fetchDestinations: async (userName, categoryId) => {
    const cacheKey = `${userName}_${categoryId || 'all'}`;
    const cached = destinationsCache.get(cacheKey);

    if (cached) {
      set({ destinations: cached });
      return;
    }

    set({ destinationsLoading: true, destinationsError: null });

    try {
      const data = await syncService.getDestinationNameUsage(userName, categoryId);

      destinationsCache.set(cacheKey, data.get_destination_name_usage);
      set({ destinations: data.get_destination_name_usage });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch destinations';
      set({ destinationsError: errorMessage });
    } finally {
      set({ destinationsLoading: false });
    }
  },
  clearDestinations: () => {
    set({ destinations: [], destinationsError: null });
    destinationsCache.clear();
  },

  // Expense flow
  transaction: initialTransaction,
  expenseCategoryId: null,
  expenseReview: null,
  expenseAmountRef: '',
  setTransaction: (patch) => set((state) => ({ transaction: { ...state.transaction, ...patch } })),
  setExpenseCategoryId: (id) => set({ expenseCategoryId: id }),
  setExpenseReview: (review) => set({ expenseReview: review }),
  setExpenseAmountRef: (amount) => set({ expenseAmountRef: amount }),
  resetExpenseFlow: () => set({
    transaction: initialTransaction,
    expenseCategoryId: null,
    expenseReview: null,
    expenseAmountRef: '',
  }),
  buildExpenseReview: () => {
    const { transaction } = get();
    return { ...transaction };
  },
}));
