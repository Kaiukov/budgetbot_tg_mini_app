/**
 * Expense Flow Reducer Hook
 * Centralizes all expense flow state management and business logic
 */

import { useReducer, useCallback } from 'react';
import { syncService } from '../services/sync';
import type { AccountUsage, CategoryUsage } from '../services/sync';
import type { ExpenseFlowState, ExpenseFlowAction } from '../types/expenseFlow';

const INITIAL_STATE: ExpenseFlowState = {
  step: 'home',
  fields: {
    user_name: '',
    account_name: '',
    account_id: '',
    account_currency: '',
    amount: '',
    amount_eur: '',
    category_id: '',
    category_name: '',
    destination_id: '',
    destination_name: '',
    date: new Date().toISOString().split('T')[0],
    comment: '',
  },
  cache: {
    accounts: [],
    accountsLoaded: false,
    accountsLoading: false,
    accountsError: null,
    categories: [],
    categoriesLoaded: false,
    categoriesLoading: false,
    categoriesError: null,
    destinations: [],
    destinationsLoaded: false,
    destinationsLoading: false,
    destinationsError: null,
  },
  errors: {},
  meta: {},
  status: { status: 'idle' },
};

function expenseFlowReducer(state: ExpenseFlowState, action: ExpenseFlowAction): ExpenseFlowState {
  switch (action.type) {
    case 'START_EXPENSE_FLOW': {
      return {
        ...state,
        step: 'expense-accounts',
        fields: {
          ...state.fields,
          user_name: action.payload.userName,
        },
        errors: {},
      };
    }

    case 'LOAD_ACCOUNTS_PENDING': {
      return {
        ...state,
        cache: {
          ...state.cache,
          accountsLoading: true,
          accountsError: null,
        },
      };
    }

    case 'LOAD_ACCOUNTS_FULFILLED': {
      return {
        ...state,
        cache: {
          ...state.cache,
          accounts: action.payload,
          accountsLoaded: true,
          accountsLoading: false,
          accountsError: null,
        },
      };
    }

    case 'LOAD_ACCOUNTS_REJECTED': {
      return {
        ...state,
        cache: {
          ...state.cache,
          accountsLoading: false,
          accountsError: action.payload,
        },
      };
    }

    case 'SELECT_ACCOUNT': {
      const account = action.payload;

      const prevKey = state.fields.account_id
        ? `${state.fields.account_id}:${(state.fields.account_currency || '').toUpperCase()}`
        : '';
      const nextKey = account.account_id
        ? `${String(account.account_id)}:${(account.account_currency || '').toUpperCase()}`
        : '';

      // Only clear when we have a previous selection and the key changes
      const accountChanged = prevKey !== '' && prevKey !== nextKey;

      return {
        ...state,
        fields: {
          ...state.fields,
          account_name: account.account_name,
          account_id: account.account_id ? String(account.account_id) : '',
          account_currency: account.account_currency,
          ...(accountChanged && {
            amount: '',
            amount_eur: '',
          }),
        },
        errors: {
          ...state.errors,
          fields: {
            ...state.errors.fields,
            account_name: undefined,
            account_id: undefined,
          },
        },
        meta: {
          ...state.meta,
          lastAccountKey: nextKey,
        },
      };
    }

    case 'SET_AMOUNT': {
      return {
        ...state,
        fields: {
          ...state.fields,
          amount: action.payload,
        },
        errors: {
          ...state.errors,
          fields: {
            ...state.errors.fields,
            amount: undefined,
          },
        },
      };
    }

    case 'SET_AMOUNT_EUR': {
      return {
        ...state,
        fields: {
          ...state.fields,
          amount_eur: action.payload,
        },
        errors: {
          ...state.errors,
          fields: {
            ...state.errors.fields,
            amount_eur: undefined,
          },
        },
      };
    }

    case 'GO_TO_AMOUNT': {
      const { user_name, account_name, account_id, account_currency } = state.fields;
      const newErrors: Record<string, string> = {};

      if (!user_name) newErrors.user_name = 'User name is required';
      if (!account_name) newErrors.account_name = 'Account is required';
      if (!account_id) newErrors.account_id = 'Account ID is required';
      if (!account_currency) newErrors.account_currency = 'Account currency is required';

      if (Object.keys(newErrors).length > 0) {
        return {
          ...state,
          errors: {
            ...state.errors,
            fields: newErrors,
          },
        };
      }

      return {
        ...state,
        step: 'expense-amount',
        errors: { fields: {} },
      };
    }

    case 'LOAD_CATEGORIES_PENDING': {
      return {
        ...state,
        cache: {
          ...state.cache,
          categoriesLoading: true,
          categoriesError: null,
        },
      };
    }

    case 'LOAD_CATEGORIES_FULFILLED': {
      return {
        ...state,
        cache: {
          ...state.cache,
          categories: action.payload,
          categoriesLoaded: true,
          categoriesLoading: false,
          categoriesError: null,
        },
      };
    }

    case 'LOAD_CATEGORIES_REJECTED': {
      return {
        ...state,
        cache: {
          ...state.cache,
          categoriesLoading: false,
          categoriesError: action.payload,
        },
      };
    }

    case 'SELECT_CATEGORY': {
      const category = action.payload;
      return {
        ...state,
        fields: {
          ...state.fields,
          category_id: String(category.category_id),
          category_name: category.category_name,
        },
        errors: {
          ...state.errors,
          fields: {
            ...state.errors.fields,
            category_id: undefined,
            category_name: undefined,
          },
        },
      };
    }

    case 'GO_TO_CATEGORY': {
      const { amount, account_currency, amount_eur } = state.fields;
      const newErrors: Record<string, string> = {};

      const parsedAmount = amount !== undefined ? Number(amount) : NaN;
      const isValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
      const currencyCode = account_currency?.toUpperCase();

      if (!isValidAmount) {
        newErrors.amount = 'Amount is required';
      }

      const requiresConversion = currencyCode && currencyCode !== 'EUR';
      if (requiresConversion) {
        const parsedAmountEur = amount_eur !== undefined ? Number(amount_eur) : NaN;
        const isValidAmountEur = Number.isFinite(parsedAmountEur) && parsedAmountEur > 0;
        if (!isValidAmountEur) {
          newErrors.amount_eur = 'EUR amount is required';
        }
      }

      if (Object.keys(newErrors).length > 0) {
        return {
          ...state,
          errors: {
            ...state.errors,
            fields: newErrors,
          },
        };
      }

      return {
        ...state,
        step: 'expense-category',
        errors: { fields: {} },
      };
    }

    case 'LOAD_DESTINATIONS_PENDING': {
      return {
        ...state,
        cache: {
          ...state.cache,
          destinationsLoading: true,
          destinationsError: null,
        },
      };
    }

    case 'LOAD_DESTINATIONS_FULFILLED': {
      return {
        ...state,
        cache: {
          ...state.cache,
          destinations: action.payload,
          destinationsLoaded: true,
          destinationsLoading: false,
          destinationsError: null,
        },
      };
    }

    case 'LOAD_DESTINATIONS_REJECTED': {
      return {
        ...state,
        cache: {
          ...state.cache,
          destinationsLoading: false,
          destinationsError: action.payload,
        },
      };
    }

    case 'SELECT_DESTINATION': {
      return {
        ...state,
        fields: {
          ...state.fields,
          destination_id: action.payload.id,
          destination_name: action.payload.name,
        },
        errors: {
          ...state.errors,
          fields: {
            ...state.errors.fields,
            destination_name: undefined,
          },
        },
      };
    }

    case 'GO_TO_DESTINATION': {
      return {
        ...state,
        step: 'expense-destination',
      };
    }

    case 'SET_COMMENT': {
      return {
        ...state,
        fields: {
          ...state.fields,
          comment: action.payload,
        },
      };
    }

    case 'GO_TO_CONFIRM': {
      return {
        ...state,
        step: 'expense-confirm',
      };
    }

    case 'BACK_TO_HOME': {
      return {
        ...state,
        step: 'home',
        fields: {
          ...state.fields,
          account_name: '',
          account_id: '',
          account_currency: '',
          amount: '',
          amount_eur: '',
          category_id: '',
          category_name: '',
          destination_id: '',
          destination_name: '',
          comment: '',
        },
        errors: {},
        meta: {
          external_id: state.meta.external_id,
          lastAccountKey: undefined,
        },
      };
    }

    case 'BACK_TO_ACCOUNTS': {
      return {
        ...state,
        step: 'expense-accounts',
        errors: { fields: {} },
      };
    }

    case 'SET_EXTERNAL_ID': {
      return {
        ...state,
        meta: {
          ...state.meta,
          external_id: action.payload,
        },
      };
    }

    case 'RESET_FLOW': {
      return INITIAL_STATE;
    }

    default:
      return state;
  }
}

export function useExpenseFlow() {
  const [state, dispatch] = useReducer(expenseFlowReducer, INITIAL_STATE);

  // Selectors
  const selectAccountsState = useCallback(
    () => ({
      accounts: state.cache.accounts,
      accountsLoading: state.cache.accountsLoading,
      accountsError: state.cache.accountsError,
    }),
    [state.cache.accounts, state.cache.accountsLoading, state.cache.accountsError]
  );

  const selectAccountFields = useCallback(
    () => ({
      user_name: state.fields.user_name,
      account_name: state.fields.account_name,
      account_id: state.fields.account_id,
      account_currency: state.fields.account_currency,
    }),
    [state.fields]
  );

  const canProceedFromAccounts = useCallback(() => {
    const { user_name, account_name, account_id, account_currency } = state.fields;
    return Boolean(user_name && account_name && account_id && account_currency);
  }, [state.fields]);

  const shouldLoadAccounts = useCallback(
    () => !state.cache.accountsLoaded && !state.cache.accountsLoading,
    [state.cache.accountsLoaded, state.cache.accountsLoading]
  );

  const selectCategoriesState = useCallback(
    () => ({
      categories: state.cache.categories,
      categoriesLoading: state.cache.categoriesLoading,
      categoriesError: state.cache.categoriesError,
    }),
    [state.cache.categories, state.cache.categoriesLoading, state.cache.categoriesError]
  );

  const shouldLoadCategories = useCallback(
    () => !state.cache.categoriesLoaded && !state.cache.categoriesLoading,
    [state.cache.categoriesLoaded, state.cache.categoriesLoading]
  );

  const selectDestinationsState = useCallback(
    () => ({
      destinations: state.cache.destinations,
      destinationsLoading: state.cache.destinationsLoading,
      destinationsError: state.cache.destinationsError,
    }),
    [state.cache.destinations, state.cache.destinationsLoading, state.cache.destinationsError]
  );

  const shouldLoadDestinations = useCallback(
    () => !state.cache.destinationsLoaded && !state.cache.destinationsLoading,
    [state.cache.destinationsLoaded, state.cache.destinationsLoading]
  );

  // Actions
  const startExpenseFlow = useCallback(
    (userName: string) => {
      dispatch({ type: 'START_EXPENSE_FLOW', payload: { userName } });
    },
    []
  );

  const loadAccounts = useCallback(async () => {
    dispatch({ type: 'LOAD_ACCOUNTS_PENDING' });
    try {
      const response = await syncService.getAccountsUsage(state.fields.user_name);
      dispatch({
        type: 'LOAD_ACCOUNTS_FULFILLED',
        payload: response.get_accounts_usage,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load accounts';
      dispatch({
        type: 'LOAD_ACCOUNTS_REJECTED',
        payload: message,
      });
    }
  }, [state.fields.user_name]);

  const selectAccount = useCallback((account: AccountUsage) => {
    dispatch({ type: 'SELECT_ACCOUNT', payload: account });
  }, []);

  const setAmount = useCallback((amount: string) => {
    dispatch({ type: 'SET_AMOUNT', payload: amount });
  }, []);

  const setAmountEur = useCallback((amount: string) => {
    dispatch({ type: 'SET_AMOUNT_EUR', payload: amount });
  }, []);

  const goToAmount = useCallback(() => {
    dispatch({ type: 'GO_TO_AMOUNT' });
  }, []);

  const loadCategories = useCallback(async () => {
    dispatch({ type: 'LOAD_CATEGORIES_PENDING' });
    try {
      const response = await syncService.getCategoriesUsage(state.fields.user_name);
      dispatch({
        type: 'LOAD_CATEGORIES_FULFILLED',
        payload: response.get_categories_usage,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load categories';
      dispatch({
        type: 'LOAD_CATEGORIES_REJECTED',
        payload: message,
      });
    }
  }, [state.fields.user_name]);

  const selectCategory = useCallback((category: CategoryUsage) => {
    dispatch({ type: 'SELECT_CATEGORY', payload: category });
  }, []);

  const goToCategory = useCallback(() => {
    dispatch({ type: 'GO_TO_CATEGORY' });
  }, []);

  const loadDestinations = useCallback(async () => {
    dispatch({ type: 'LOAD_DESTINATIONS_PENDING' });
    try {
      const response = await syncService.getDestinationNameUsage();
      dispatch({
        type: 'LOAD_DESTINATIONS_FULFILLED',
        payload: response.get_destination_name_usage,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load destinations';
      dispatch({
        type: 'LOAD_DESTINATIONS_REJECTED',
        payload: message,
      });
    }
  }, []);

  const selectDestination = useCallback((id: string, name: string) => {
    dispatch({
      type: 'SELECT_DESTINATION',
      payload: { id, name },
    });
  }, []);

  const goToDestination = useCallback(() => {
    dispatch({ type: 'GO_TO_DESTINATION' });
  }, []);

  const setComment = useCallback((comment: string) => {
    dispatch({ type: 'SET_COMMENT', payload: comment });
  }, []);

  const goToConfirm = useCallback(() => {
    dispatch({ type: 'GO_TO_CONFIRM' });
  }, []);

  const backToHome = useCallback(() => {
    dispatch({ type: 'BACK_TO_HOME' });
  }, []);

  const setExternalId = useCallback((id: string) => {
    dispatch({ type: 'SET_EXTERNAL_ID', payload: id });
  }, []);

  const backToAccounts = useCallback(() => {
    dispatch({ type: 'BACK_TO_ACCOUNTS' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET_FLOW' });
  }, []);

  return {
    // State
    state,

    // Selectors
    selectAccountsState,
    selectAccountFields,
    canProceedFromAccounts,
    shouldLoadAccounts,
    selectCategoriesState,
    shouldLoadCategories,
    selectDestinationsState,
    shouldLoadDestinations,

    // Actions
    startExpenseFlow,
    loadAccounts,
    selectAccount,
    setAmount,
    setAmountEur,
    goToAmount,
    loadCategories,
    selectCategory,
    goToCategory,
    loadDestinations,
    selectDestination,
    goToDestination,
    setComment,
    goToConfirm,
    backToHome,
    backToAccounts,
    setExternalId,
    reset,
  };
}
