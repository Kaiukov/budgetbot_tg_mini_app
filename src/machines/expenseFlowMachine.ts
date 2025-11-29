import { createMachine, assign } from 'xstate';

/** ============================================
 * TYPE DEFINITIONS
 * ============================================ */

export interface Account {
  id: string;
  name: string;
  currency: string;
  usage_count?: number;
}

export interface Category {
  id: string | number;
  name: string;
  budget_name?: string;
}

export interface Destination {
  id?: string;
  name: string;
}

export interface ExpenseFlowContext {
  // Draft transaction data (accumulates through screens)
  draft: {
    user_name: string;
    account_id: string;
    account_name: string;
    account_currency: string;
    amount: number;
    amount_eur: number;
    category_id: string | number;
    category_name: string;
    budget_name: string;
    destination_id?: string;
    destination_name: string;
    date: string;
    comment?: string;
  };

  // Caches (persist across back navigation)
  accountsCache: Account[];
  categoriesCache: Category[];
  destinationSuggestions: Destination[];

  // Previous account ID (for conditional amount reset logic)
  previousAccountId: string | null;

  // Error tracking
  error: string | null;
}

export type ExpenseFlowEvent =
  // Initialization
  | { type: 'LOAD_CACHES'; accounts: Account[]; categories: Category[] }
  | { type: 'START_EXPENSE_FLOW'; userName: string }

  // Accounts step
  | { type: 'SELECT_ACCOUNT'; account: Account }
  | { type: 'NEXT_FROM_ACCOUNTS' }
  | { type: 'BACK_TO_HOME' }

  // Amount step
  | { type: 'SET_AMOUNT'; amount: number; amountEur: number }
  | { type: 'NEXT_FROM_AMOUNT' }
  | { type: 'BACK_TO_ACCOUNTS' }

  // Category step
  | { type: 'SELECT_CATEGORY'; category: Category }
  | { type: 'NEXT_FROM_CATEGORIES' }
  | { type: 'BACK_TO_AMOUNT' }

  // Destination step
  | { type: 'SET_DESTINATION_SUGGESTIONS'; list: Destination[] }
  | { type: 'SET_DESTINATION'; id?: string; name: string }
  | { type: 'SET_COMMENT'; comment: string }
  | { type: 'NEXT_FROM_COMMENT' }
  | { type: 'BACK_TO_CATEGORIES' }

  // Confirmation
  | { type: 'BACK_TO_COMMENT' }
  | { type: 'SUBMIT' }

  // Submission
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_FAILURE'; error: string }
  | { type: 'RETRY_SUBMIT' }

  // Reset
  | { type: 'RESET_FLOW' };

/** ============================================
 * INITIAL CONTEXT
 * ============================================ */

const initialContext: ExpenseFlowContext = {
  draft: {
    user_name: '',
    account_id: '',
    account_name: '',
    account_currency: '',
    amount: 0,
    amount_eur: 0,
    category_id: '',
    category_name: '',
    budget_name: '',
    destination_id: undefined,
    destination_name: '',
    date: '',
    comment: '',
  },
  accountsCache: [],
  categoriesCache: [],
  destinationSuggestions: [],
  previousAccountId: null,
  error: null,
};

/** ============================================
 * MACHINE DEFINITION
 * ============================================ */

export const expenseFlowMachine = createMachine<
  ExpenseFlowContext,
  ExpenseFlowEvent
>(
  {
    id: 'expenseFlow',
    initial: 'home',
    context: initialContext,
    states: {
      /** 1. HOME (кнопка "расходы") */
      home: {
        on: {
          LOAD_CACHES: {
            actions: 'setCaches',
          },
          START_EXPENSE_FLOW: {
            target: 'accounts',
            actions: 'initDraftWithUserName',
          },
        },
      },

      /** 2. CHOOSE ACCOUNTS */
      accounts: {
        on: {
          SELECT_ACCOUNT: {
            actions: 'selectAccount',
          },
          NEXT_FROM_ACCOUNTS: {
            target: 'amount',
            cond: 'isAccountValid',
          },
          BACK_TO_HOME: {
            target: 'home',
            actions: 'resetDraftKeepCaches',
          },
        },
      },

      /** 3. AMOUNT */
      amount: {
        on: {
          SET_AMOUNT: {
            actions: 'setAmount',
          },
          NEXT_FROM_AMOUNT: {
            target: 'categories',
            cond: 'isAmountValid',
          },
          BACK_TO_ACCOUNTS: {
            target: 'accounts',
          },
        },
      },

      /** 4. CATEGORIES */
      categories: {
        on: {
          SELECT_CATEGORY: {
            actions: 'selectCategory',
          },
          NEXT_FROM_CATEGORIES: {
            target: 'comment',
            cond: 'isCategoryValid',
          },
          BACK_TO_AMOUNT: {
            target: 'amount',
          },
        },
      },

      /** 5. COMMENT / DESTINATION NAME */
      comment: {
        entry: 'clearError',
        on: {
          SET_DESTINATION_SUGGESTIONS: {
            actions: 'setDestinationSuggestions',
          },
          SET_DESTINATION: {
            actions: 'setDestination',
          },
          SET_COMMENT: {
            actions: 'setComment',
          },
          NEXT_FROM_COMMENT: {
            target: 'confirmation',
            cond: 'isDestinationValid',
          },
          BACK_TO_CATEGORIES: {
            target: 'categories',
            actions: 'clearDestinationSuggestions',
          },
        },
      },

      /** 6. CONFIRMATION */
      confirmation: {
        on: {
          BACK_TO_COMMENT: {
            target: 'comment',
          },
          SUBMIT: {
            target: 'submitting',
            cond: 'isAllDataValid',
            actions: ['setConfirmationDate', 'clearError'],
          },
        },
      },

      /** 7. SUBMITTING (safe to firefly) */
      submitting: {
        on: {
          SUBMIT_SUCCESS: {
            target: 'success',
          },
          SUBMIT_FAILURE: {
            target: 'error',
            actions: 'setError',
          },
        },
      },

      /** 8. SUCCESS */
      success: {
        on: {
          RESET_FLOW: {
            target: 'home',
            actions: 'resetDraftKeepCaches',
          },
        },
      },

      /** 9. ERROR */
      error: {
        on: {
          RETRY_SUBMIT: {
            target: 'submitting',
          },
          BACK_TO_COMMENT: {
            target: 'comment',
          },
          RESET_FLOW: {
            target: 'home',
            actions: 'resetDraftKeepCaches',
          },
        },
      },
    },
  },
  {
    /** GUARDS (валидаторы шагов) */
    guards: {
      // Choose Accounts: user_name + account_* обязательны
      isAccountValid: (ctx) =>
        !!ctx.draft.user_name &&
        !!ctx.draft.account_id &&
        !!ctx.draft.account_currency,

      // Amount: amount > 0 и есть amount_eur
      isAmountValid: (ctx) =>
        typeof ctx.draft.amount === 'number' &&
        ctx.draft.amount > 0 &&
        typeof ctx.draft.amount_eur === 'number' &&
        ctx.draft.amount_eur > 0,

      // Categories: должны быть category_id и category_name
      isCategoryValid: (ctx) =>
        !!ctx.draft.category_id && !!ctx.draft.category_name,

      // Comment: хотя бы destination_name (id может быть undefined для нового)
      isDestinationValid: (ctx) => !!ctx.draft.destination_name,

      // Confirmation: все обязательные поля + date (ставится при SUBMIT)
      isAllDataValid: (ctx) => {
        const d = ctx.draft;
        return !!(
          d.user_name &&
          d.account_id &&
          d.account_currency &&
          typeof d.amount === 'number' &&
          typeof d.amount_eur === 'number' &&
          d.category_id &&
          d.category_name &&
          d.budget_name &&
          d.destination_name &&
          d.date
        );
      },
    },

    /** ACTIONS (изменения контекста) */
    actions: {
      setCaches: assign((_ctx, event) => {
        if (event.type !== 'LOAD_CACHES') return {};
        return {
          accountsCache: event.accounts,
          categoriesCache: event.categories,
        };
      }),

      initDraftWithUserName: assign((ctx, event) => {
        if (event.type !== 'START_EXPENSE_FLOW') return {};
        return {
          draft: {
            ...ctx.draft,
            user_name: event.userName,
          },
        };
      }),

      resetDraftKeepCaches: assign(() => ({
        draft: initialContext.draft,
        previousAccountId: null,
        error: null,
        // caches остаются
      })),

      selectAccount: assign((ctx, event) => {
        if (event.type !== 'SELECT_ACCOUNT') return {};
        const account = event.account;
        const prev = ctx.draft;
        const accountChanged =
          prev.account_id && prev.account_id !== account.id;

        return {
          draft: {
            ...prev,
            account_id: account.id,
            account_name: account.name,
            account_currency: account.currency,
            ...(accountChanged
              ? { amount: 0, amount_eur: 0 }
              : {}),
          },
          previousAccountId: account.id,
        };
      }),

      setAmount: assign((ctx, event) => {
        if (event.type !== 'SET_AMOUNT') return {};
        return {
          draft: {
            ...ctx.draft,
            amount: event.amount,
            amount_eur: event.amountEur,
          },
        };
      }),

      selectCategory: assign((ctx, event) => {
        if (event.type !== 'SELECT_CATEGORY') return {};
        const cat = event.category;
        return {
          draft: {
            ...ctx.draft,
            category_id: cat.id,
            category_name: cat.name,
            budget_name: cat.budget_name || '',
          },
        };
      }),

      setDestinationSuggestions: assign((_ctx, event) => {
        if (event.type !== 'SET_DESTINATION_SUGGESTIONS') return {};
        return {
          destinationSuggestions: event.list,
        };
      }),

      clearDestinationSuggestions: assign(() => ({
        destinationSuggestions: [],
      })),

      setDestination: assign((ctx, event) => {
        if (event.type !== 'SET_DESTINATION') return {};
        return {
          draft: {
            ...ctx.draft,
            destination_id: event.id,
            destination_name: event.name,
          },
        };
      }),

      setComment: assign((ctx: ExpenseFlowContext, event) => {
        if (event.type !== 'SET_COMMENT') return {};
        return {
          draft: {
            ...ctx.draft,
            comment: event.comment,
          },
        };
      }),

      setConfirmationDate: assign((ctx) => ({
        draft: {
          ...ctx.draft,
          date: new Date().toISOString(),
        },
      })),

      setError: assign((_ctx, event) => {
        if (event.type !== 'SUBMIT_FAILURE') return {};
        return { error: event.error };
      }),

      clearError: assign(() => ({ error: null })),
    },
  }
);
