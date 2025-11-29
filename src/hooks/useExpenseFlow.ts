import { useMachine } from '@xstate/react';
import { useEffect, useCallback } from 'react';
import { expenseFlowMachine, type ExpenseFlowContext, type ExpenseFlowEvent, type Account, type Category, type Destination } from '../machines/expenseFlowMachine';
import { syncService } from '../services/sync';
import type { State } from 'xstate';

export interface UseExpenseFlowReturn {
  // FSM state and send for direct use
  state: State<ExpenseFlowContext, ExpenseFlowEvent>;
  send: (event: ExpenseFlowEvent) => any;

  // Context accessors
  context: ExpenseFlowContext;
  currentStep: string;

  // Selectors
  selectAccountsState: () => { accounts: Account[]; error: string | null };
  selectCategoriesState: () => { categories: Category[]; error: string | null };
  selectDestinationsState: () => { destinations: Destination[]; error: string | null };
  selectDraftState: () => ExpenseFlowContext['draft'];

  // Helper predicates
  canProceedFromAccounts: () => boolean;
  canProceedFromAmount: () => boolean;
  canProceedFromCategories: () => boolean;
  canProceedFromComment: () => boolean;
  shouldLoadAccounts: () => boolean;
  shouldLoadCategories: () => boolean;
  shouldLoadDestinations: () => boolean;
  isLoading: () => boolean;
  isSubmitting: () => boolean;
}

export const useExpenseFlow = (): UseExpenseFlowReturn => {
  const [state, send] = useMachine(expenseFlowMachine);
  const context = state.context;

  /** ============================================
   * EFFECT: Pre-load accounts and categories on home entry
   * ============================================ */
  useEffect(() => {
    if (state.matches('home')) {
      const loadCaches = async () => {
        try {
          const [accountsResponse, categoriesResponse] = await Promise.all([
            syncService.getAccountsUsage(),
            syncService.getCategoriesUsage('withdrawal'),
          ]);

          // Transform API responses to machine format
          const accounts: Account[] = Array.isArray(accountsResponse)
            ? accountsResponse.map((acc: any) => ({
                id: acc.account_id,
                name: acc.account_name,
                currency: acc.account_currency,
                usage_count: acc.usage_count,
              }))
            : (accountsResponse as any).accounts?.map((acc: any) => ({
                id: acc.account_id,
                name: acc.account_name,
                currency: acc.account_currency,
                usage_count: acc.usage_count,
              })) || [];

          const categories: Category[] = Array.isArray(categoriesResponse)
            ? categoriesResponse.map((cat: any) => ({
                id: cat.category_id,
                name: cat.category_name,
                budget_name: cat.budget_name,
              }))
            : (categoriesResponse as any).categories?.map((cat: any) => ({
                id: cat.category_id,
                name: cat.category_name,
                budget_name: cat.budget_name,
              })) || [];

          send({
            type: 'LOAD_CACHES',
            accounts,
            categories,
          });
        } catch (error) {
          console.error('Failed to load caches:', error);
        }
      };
      loadCaches();
    }
  }, [state, send]);

  /** ============================================
   * EFFECT: Pre-load destinations on comment entry
   * ============================================ */
  useEffect(() => {
    if (state.matches('comment')) {
      const loadDestinations = async () => {
        try {
          const destinationsResponse = await syncService.getDestinationNameUsage();

          // Transform API response to machine format
          const destinations: Destination[] = Array.isArray(destinationsResponse)
            ? destinationsResponse.map((dest: any) => ({
                id: dest.id,
                name: dest.name,
              }))
            : (destinationsResponse as any).destinations?.map((dest: any) => ({
                id: dest.id,
                name: dest.name,
              })) || [];

          send({
            type: 'SET_DESTINATION_SUGGESTIONS',
            list: destinations,
          });
        } catch (error) {
          console.error('Failed to load destinations:', error);
        }
      };
      loadDestinations();
    }
  }, [state, send]);

  /** ============================================
   * SELECTORS
   * ============================================ */

  const selectAccountsState = useCallback(
    () => ({
      accounts: context.accountsCache,
      error: null,
    }),
    [context.accountsCache]
  );

  const selectCategoriesState = useCallback(
    () => ({
      categories: context.categoriesCache,
      error: null,
    }),
    [context.categoriesCache]
  );

  const selectDestinationsState = useCallback(
    () => ({
      destinations: context.destinationSuggestions,
      error: null,
    }),
    [context.destinationSuggestions]
  );

  const selectDraftState = useCallback(
    () => context.draft,
    [context.draft]
  );

  /** ============================================
   * VALIDATION HELPERS
   * ============================================ */

  const canProceedFromAccounts = useCallback(
    () =>
      !!context.draft.user_name &&
      !!context.draft.account_id &&
      !!context.draft.account_currency,
    [context.draft]
  );

  const canProceedFromAmount = useCallback(
    () =>
      typeof context.draft.amount === 'number' &&
      context.draft.amount > 0 &&
      typeof context.draft.amount_eur === 'number' &&
      context.draft.amount_eur > 0,
    [context.draft]
  );

  const canProceedFromCategories = useCallback(
    () =>
      !!context.draft.category_id && !!context.draft.category_name,
    [context.draft]
  );

  const canProceedFromComment = useCallback(
    () => !!context.draft.destination_name,
    [context.draft]
  );

  const shouldLoadAccounts = useCallback(
    () => state.matches('home') && context.accountsCache.length === 0,
    [state, context.accountsCache]
  );

  const shouldLoadCategories = useCallback(
    () => state.matches('home') && context.categoriesCache.length === 0,
    [state, context.categoriesCache]
  );

  const shouldLoadDestinations = useCallback(
    () =>
      state.matches('comment') &&
      context.destinationSuggestions.length === 0,
    [state, context.destinationSuggestions]
  );

  const isLoading = useCallback(
    () => state.matches('home'),
    [state]
  );

  const isSubmitting = useCallback(
    () => state.matches('submitting'),
    [state]
  );

  return {
    // FSM state and send
    state: state as unknown as State<ExpenseFlowContext, ExpenseFlowEvent>,
    send,

    // Context accessors
    context,
    currentStep: state.value as string,

    // Selectors
    selectAccountsState,
    selectCategoriesState,
    selectDestinationsState,
    selectDraftState,

    // Helpers
    canProceedFromAccounts,
    canProceedFromAmount,
    canProceedFromCategories,
    canProceedFromComment,
    shouldLoadAccounts,
    shouldLoadCategories,
    shouldLoadDestinations,
    isLoading,
    isSubmitting,
  };
};
