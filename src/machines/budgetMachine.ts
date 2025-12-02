/**
 * Budget Machine
 * xstate FSM for complete app state management
 * Simplified for easier integration and maintenance
 */

import { createMachine, assign } from 'xstate';
import type { BudgetMachineContext } from './types';
import { initialContext } from './types';
import { extractBudgetName } from '../services/sync/utils';
import {
  telegramInitActor,
  dataLoadingOrchestratorActor,
  categoriesFetchActor,
  depositSourceNameFetchActor,
} from './actors';
import { validationGuards } from './actions';

export const budgetMachine = createMachine(
  {
    id: 'budget',
    initial: 'loading',
    context: initialContext,
    types: {
      context: {} as BudgetMachineContext,
      events: {} as any,
    },

    states: {
      // Loading / Initialization
      loading: {
        invoke: {
          id: 'telegramInit',
          src: telegramInitActor,
          onDone: {
            target: 'ready',
            actions: assign(({ event }) => ({
              user: event.output,
            })),
          },
          onError: {
            target: 'ready',
          },
        },
        on: {
          INIT_DONE: {
            target: 'ready',
            actions: 'setUser',
          },
          INIT_ERROR: {
            target: 'ready',
          },
        },
      },

      // Main App Ready State
      ready: {
        initial: 'home',

        invoke: [
          {
            id: 'loadData',
            src: dataLoadingOrchestratorActor,
            input: ({ context }) => ({ user_name: context.user.user_name }),
            onDone: {
              actions: assign(({ event, context }) => ({
                data: {
                  ...context.data,
                  accounts: event.output.accounts || [],
                  categories: event.output.categories || [],
                  transactions: event.output.transactions || [],
                },
                ui: {
                  ...context.ui,
                  accounts: { loading: false, error: null },
                  categories: { loading: false, error: null },
                  transactions: { loading: false, error: null },
                },
              })),
            },
            onError: {
              actions: assign(({ event, context }) => {
                const errorMsg = String(event.error);
                return {
                  ui: {
                    ...context.ui,
                    accounts: { loading: false, error: errorMsg },
                    categories: { loading: false, error: errorMsg },
                    transactions: { loading: false, error: errorMsg },
                  },
                };
              }),
            },
          },
        ],

        states: {
          home: {
            on: {
              NAVIGATE_WITHDRAWAL_ACCOUNTS: {
                target: 'withdrawalFlow',
                actions: 'resetTransaction',
              },
              NAVIGATE_DEPOSIT_ACCOUNTS: {
                target: 'depositFlow',
                actions: 'resetTransaction',
              },
              NAVIGATE_TRANSFER_SOURCE: 'transferFlow',
              NAVIGATE_TRANSACTIONS: 'transactions',
              NAVIGATE_DEBUG: 'debug',
            },
          },

          withdrawalFlow: {
            initial: 'accounts',
            on: {
              NAVIGATE_HOME: {
                target: '#budget.ready.home',
                actions: 'resetTransaction',
              },
            },
            states: {
              accounts: {
                on: {
                  UPDATE_ACCOUNT: {
                    target: 'amount',
                    actions: 'updateAccount',
                  },
                  NAVIGATE_BACK: '#budget.ready.home',
                },
              },
              amount: {
                on: {
                  UPDATE_AMOUNT: {
                    actions: 'updateAmount',
                  },
                  UPDATE_AMOUNT_EUR: {
                    actions: 'updateAmountForeign',
                  },
                  SET_CONVERSION_AMOUNT: {
                    actions: 'setConversionAmount',
                  },
                  SET_IS_LOADING_CONVERSION: {
                    actions: 'setIsLoadingConversion',
                  },
                  NAVIGATE_CATEGORY: {
                    target: 'category',
                    guard: ({ context }) => validationGuards.canProceedFromAmountPage(context.transaction as any),
                  },
                  NAVIGATE_BACK: 'accounts',
                  SET_VALIDATION_ERROR: {
                    actions: 'setWithdrawalValidationError',
                  },
                },
              },
              category: {
                entry: 'setCategoriesLoading',
                invoke: {
                  id: 'fetchWithdrawalCategoriesOnNavigate',
                  src: categoriesFetchActor,
                  input: ({ context }) => {
                    const maybeUser = context.user.user_name;
                    const isUnknown = maybeUser === 'User' || maybeUser === 'Guest';
                    return {
                      user_name: isUnknown ? undefined : maybeUser,
                      type: 'withdrawal',
                    };
                  },
                  onDone: {
                    actions: 'setCategories',
                  },
                  onError: {
                    actions: 'setCategoriesError',
                  },
                },
                on: {
                  UPDATE_CATEGORY: {
                    target: 'notes',
                    guard: ({ context }) => validationGuards.canProceedFromCategoryPage(context.transaction as any),
                  },
                  NAVIGATE_BACK: 'amount',
                  SET_VALIDATION_ERROR: {
                    actions: 'setWithdrawalValidationError',
                  },
                },
              },
              notes: {
                on: {
                  UPDATE_NOTES: {
                    actions: 'updateComment',
                  },
                  SET_SUGGESTIONS: {
                    actions: 'setSuggestions',
                  },
                  SET_IS_LOADING_SUGGESTIONS: {
                    actions: 'setIsLoadingSuggestions',
                  },
                  SET_SUGGESTIONS_ERROR: {
                    actions: 'setSuggestionsError',
                  },
                  NAVIGATE_CONFIRM: {
                    target: 'confirm',
                    guard: ({ context }) => validationGuards.canProceedFromDestinationPage(context.transaction as any),
                  },
                  NAVIGATE_BACK: 'category',
                  SET_VALIDATION_ERROR: {
                    actions: 'setWithdrawalValidationError',
                  },
                },
              },
              confirm: {
                on: {
                  SUBMIT_TRANSACTION: {
                    target: '#budget.ready.home',
                    actions: 'resetTransaction',
                  },
                  UPDATE_DATE: {
                    actions: 'updateTransactionDate',
                  },
                  SET_IS_SUBMITTING: {
                    actions: 'setIsSubmitting',
                  },
                  SET_SUBMIT_MESSAGE: {
                    actions: 'setSubmitMessage',
                  },
                  NAVIGATE_BACK: 'notes',
                },
              },
            },
          },

          depositFlow: {
            initial: 'accounts',
            on: {
              NAVIGATE_HOME: {
                target: '#budget.ready.home',
                actions: 'resetTransaction',
              },
            },
            states: {
              accounts: {
                on: {
                  UPDATE_ACCOUNT: {
                    target: 'amount',
                    actions: 'updateAccount',
                  },
                  NAVIGATE_BACK: '#budget.ready.home',
                },
              },
              amount: {
                on: {
                  UPDATE_AMOUNT: {
                    actions: 'updateAmount',
                  },
                  UPDATE_AMOUNT_EUR: {
                    actions: 'updateAmountForeign',
                  },
                  SET_CONVERSION_AMOUNT: {
                    actions: 'setConversionAmount',
                  },
                  SET_IS_LOADING_CONVERSION: {
                    actions: 'setIsLoadingConversion',
                  },
                  NAVIGATE_CATEGORY: {
                    target: 'category',
                    guard: ({ context }) => validationGuards.canProceedFromAmountPage(context.transaction as any),
                  },
                  NAVIGATE_BACK: 'accounts',
                  SET_VALIDATION_ERROR: {
                    actions: 'setDepositValidationError',
                  },
                },
              },
              category: {
                entry: 'setCategoriesLoading',
                invoke: {
                  id: 'fetchDepositCategoriesOnNavigate',
                  src: categoriesFetchActor,
                  input: ({ context }) => {
                    const maybeUser = context.user.user_name;
                    const isUnknown = maybeUser === 'User' || maybeUser === 'Guest';
                    return {
                      user_name: isUnknown ? undefined : maybeUser,
                      type: 'deposit',
                    };
                  },
                  onDone: {
                    actions: 'setCategories',
                  },
                  onError: {
                    actions: 'setCategoriesError',
                  },
                },
                on: {
                  UPDATE_CATEGORY: {
                    target: 'notes',
                    guard: ({ context }) => validationGuards.canProceedFromCategoryPage(context.transaction as any),
                  },
                  NAVIGATE_BACK: 'amount',
                  SET_VALIDATION_ERROR: {
                    actions: 'setDepositValidationError',
                  },
                },
              },
              notes: {
                entry: 'setSuggestionsLoading',
                invoke: {
                  id: 'fetchDepositSourceSuggestionsOnNavigate',
                  src: depositSourceNameFetchActor,
                  input: ({ context }) => {
                    const maybeUser = context.user.user_name;
                    const isUnknown = maybeUser === 'User' || maybeUser === 'Guest';
                    return {
                      user_name: isUnknown ? undefined : maybeUser,
                      category_id: context.transaction.category_id || 0,
                    };
                  },
                  onDone: {
                    actions: 'setSuggestions',
                  },
                  onError: {
                    actions: 'setSuggestionsError',
                  },
                },
                on: {
                  UPDATE_NOTES: {
                    actions: 'updateComment',
                  },
                  UPDATE_SOURCE_NAME: {
                    actions: 'updateSourceName',
                  },
                  SET_SUGGESTIONS: {
                    actions: 'setSuggestions',
                  },
                  SET_IS_LOADING_SUGGESTIONS: {
                    actions: 'setIsLoadingSuggestions',
                  },
                  SET_SUGGESTIONS_ERROR: {
                    actions: 'setSuggestionsError',
                  },
                  NAVIGATE_CONFIRM: {
                    target: 'confirm',
                    guard: ({ context }) => validationGuards.canProceedFromSourcePage(context.transaction as any),
                  },
                  NAVIGATE_BACK: 'category',
                  SET_VALIDATION_ERROR: {
                    actions: 'setDepositValidationError',
                  },
                },
              },
              confirm: {
                on: {
                  SUBMIT_TRANSACTION: {
                    target: '#budget.ready.home',
                    actions: 'resetTransaction',
                  },
                  UPDATE_DATE: {
                    actions: 'updateTransactionDate',
                  },
                  SET_IS_SUBMITTING: {
                    actions: 'setIsSubmitting',
                  },
                  SET_SUBMIT_MESSAGE: {
                    actions: 'setSubmitMessage',
                  },
                  NAVIGATE_BACK: 'notes',
                },
              },
            },
          },

          transferFlow: {
            initial: 'sourceAccounts',
            on: {
              NAVIGATE_HOME: '#budget.ready.home',
            },
            states: {
              sourceAccounts: {
                on: {
                  SET_TRANSFER_SOURCE: {
                    target: 'destAccounts',
                    guard: ({ context }) => validationGuards.canProceedFromTransferSourcePage(context.transfer as any),
                    actions: 'setTransferSource',
                  },
                  NAVIGATE_BACK: '#budget.ready.home',
                  SET_TRANSFER_VALIDATION_ERROR: {
                    actions: 'setTransferValidationError',
                  },
                },
              },
              destAccounts: {
                on: {
                  SET_TRANSFER_DEST: {
                    target: 'amount',
                    guard: ({ context }) => validationGuards.canProceedFromTransferDestPage(context.transfer as any),
                    actions: 'setTransferDest',
                  },
                  NAVIGATE_BACK: 'sourceAccounts',
                  SET_TRANSFER_VALIDATION_ERROR: {
                    actions: 'setTransferValidationError',
                  },
                },
              },
              amount: {
                on: {
                  UPDATE_TRANSFER_EXIT_AMOUNT: {
                    actions: 'updateTransferExitAmount',
                  },
                  UPDATE_TRANSFER_ENTRY_AMOUNT: {
                    actions: 'updateTransferEntryAmount',
                  },
                  NAVIGATE_TRANSFER_FEES: {
                    target: 'fees',
                    guard: ({ context }) => validationGuards.canProceedFromTransferAmountPage(context.transfer as any),
                  },
                  NAVIGATE_BACK: 'destAccounts',
                  SET_TRANSFER_VALIDATION_ERROR: {
                    actions: 'setTransferValidationError',
                  },
                },
              },
              fees: {
                on: {
                  UPDATE_TRANSFER_EXIT_FEE: {
                    actions: 'updateTransferExitFee',
                  },
                  UPDATE_TRANSFER_ENTRY_FEE: {
                    actions: 'updateTransferEntryFee',
                  },
                  NAVIGATE_TRANSFER_COMMENT: 'notes',
                  NAVIGATE_BACK: 'amount',
                },
              },
              notes: {
                on: {
                  UPDATE_TRANSFER_NOTES: {
                    actions: 'updateTransferComment',
                  },
                  UPDATE_TRANSFER_DATE: {
                    actions: 'updateTransferDate',
                  },
                  NAVIGATE_TRANSFER_CONFIRM: 'confirm',
                  NAVIGATE_BACK: 'fees',
                },
              },
              confirm: {
                on: {
                  SUBMIT_TRANSFER: {
                    target: '#budget.ready.home',
                    actions: 'resetTransfer',
                  },
                  NAVIGATE_BACK: 'notes',
                },
              },
            },
          },

          transactions: {
            initial: 'list',
            on: {
              NAVIGATE_HOME: '#budget.ready.home',
            },
            states: {
              list: {
                on: {
                  SELECT_TRANSACTION: {
                    target: 'detail',
                    actions: 'selectTransaction',
                  },
                  NAVIGATE_BACK: '#budget.ready.home',
                },
              },
              detail: {
                on: {
                  NAVIGATE_TRANSACTION_EDIT: 'edit',
                  DELETE_TRANSACTION: 'list',
                  NAVIGATE_BACK: 'list',
                },
              },
              edit: {
                on: {
                  SUBMIT_TRANSACTION: 'detail',
                  NAVIGATE_BACK: 'detail',
                },
              },
            },
          },

          debug: {
            on: {
              NAVIGATE_HOME: 'home',
              NAVIGATE_BACK: 'home',
            },
          },
        },

        on: {
          NAVIGATE_BACK: {
            target: '#budget.ready.home',
          },
          FETCH_ACCOUNTS: {
            actions: 'setAccountsLoading',
          },
          FETCH_ACCOUNTS_SUCCESS: {
            actions: 'setAccounts',
          },
          FETCH_ACCOUNTS_ERROR: {
            actions: 'setAccountsError',
          },
          FETCH_CATEGORIES: {
            actions: 'setCategoriesLoading',
          },
          FETCH_CATEGORIES_SUCCESS: {
            actions: 'setCategories',
          },
          FETCH_CATEGORIES_ERROR: {
            actions: 'setCategoriesError',
          },
          FETCH_TRANSACTIONS_SUCCESS: {
            actions: 'setTransactions',
          },
          FETCH_TRANSACTIONS_ERROR: {
            actions: 'setTransactionsError',
          },
          SERVICE_STATUS_CHANGED: {
            actions: 'setServiceStatus',
          },
        },
      },
    },
  },
  {
    actions: {
      setUser: assign(({ context, event }: any) => ({
        user: event.user || context.user,
      })),

      updateAccount: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          ...(context.transaction.account_id === event.account_id
            ? {}
            : {
                amount: '',
                amount_eur: '',
                // Don't reset conversionAmount - preserve it across account changes
                // User can re-enter amount which will trigger new conversion if needed
              }),
          account: event.account,
          account_id: event.account_id,
          account_currency: event.account_currency,
          user_name: event.user_name || context.transaction.user_name,
        },
      })),

      updateAmount: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          amount: event.amount,
        },
      })),

      updateAmountForeign: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          // Support both amount_foreign (legacy) and amount_eur (current) payload shapes
          amount_eur: event.amount_foreign ?? event.amount_eur,
        },
      })),

      updateCategory: assign(({ context, event }: any) => {
        const normalizedBudget = event.budget_name && String(event.budget_name).trim().length > 0
          ? String(event.budget_name).trim()
          : extractBudgetName(event.category);

        return {
          transaction: {
            ...context.transaction,
            category: event.category,
            category_id: event.category_id ?? context.transaction.category_id,
            budget_name: normalizedBudget,
          },
        };
      }),

      updateComment: assign(({ context, event }: any) => {
        const nextNotes = event.notes ?? event.comment ?? event.destination_name;

        return {
          transaction: {
            ...context.transaction,
            notes: nextNotes ?? '',
            destination_name: nextNotes ?? '',
            destination_id: event.destination_id ?? context.transaction.destination_id,
          },
        };
      }),

      updateSourceName: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          source_name: event.source_name ?? context.transaction.source_name,
          source_id: event.source_id ?? context.transaction.source_id,
        },
      })),

      resetTransaction: assign({
        transaction: {
          ...initialContext.transaction,
          user_name: initialContext.transaction.user_name,
        },
      }),

      setTransferSource: assign(({ context, event }: any) => ({
        transfer: {
          ...context.transfer,
          source: {
            account: event.account,
            id: event.account_id,
            currency: event.account_currency,
          },
          source_user_name: event.user_name || context.transfer.source_user_name,
        },
      })),

      setTransferDest: assign(({ context, event }: any) => ({
        transfer: {
          ...context.transfer,
          destination: {
            account: event.account,
            id: event.account_id,
            currency: event.account_currency,
          },
          dest_user_name: event.user_name || context.transfer.dest_user_name,
        },
      })),

      updateTransferExitAmount: assign(({ context, event }: any) => ({
        transfer: {
          ...context.transfer,
          exitAmount: event.amount,
        },
      })),

      updateTransferEntryAmount: assign(({ context, event }: any) => ({
        transfer: {
          ...context.transfer,
          entryAmount: event.amount,
        },
      })),

      updateTransferExitFee: assign(({ context, event }: any) => ({
        transfer: {
          ...context.transfer,
          exitFee: event.fee,
        },
      })),

      updateTransferEntryFee: assign(({ context, event }: any) => ({
        transfer: {
          ...context.transfer,
          entryFee: event.fee,
        },
      })),

      updateTransferComment: assign(({ context, event }: any) => ({
        transfer: {
          ...context.transfer,
          notes: event.notes,
        },
      })),

      updateTransactionDate: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          date: event.date,
        },
      })),

      updateTransferDate: assign(({ context, event }: any) => ({
        transfer: {
          ...context.transfer,
          date: event.date,
        },
      })),

      setWithdrawalValidationError: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          errors: event.error ? { validation: event.error } : {},
        },
      })),

      setDepositValidationError: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          errors: event.error ? { validation: event.error } : {},
        },
      })),

      setTransferValidationError: assign(({ context, event }: any) => ({
        transfer: {
          ...context.transfer,
          errors: event.error ? { validation: event.error } : {},
        },
      })),

      resetTransfer: assign({
        transfer: initialContext.transfer,
      }),

      setAccounts: assign(({ context, event }: any) => ({
        data: {
          ...context.data,
          accounts: event.accounts || [],
        },
        ui: {
          ...context.ui,
          accounts: { loading: false, error: null },
        },
      })),

      setAccountsLoading: assign(({ context }) => ({
        ui: {
          ...context.ui,
          accounts: { loading: true, error: null },
        },
      })),

      setAccountsError: assign(({ context, event }: any) => ({
        ui: {
          ...context.ui,
          accounts: { loading: false, error: event.error },
        },
      })),

      setCategories: assign(({ context, event }: any) => ({
        data: {
          ...context.data,
          categories: event.categories || event.output || [],
        },
        ui: {
          ...context.ui,
          categories: { loading: false, error: null },
        },
      })),

      setCategoriesLoading: assign(({ context }) => ({
        ui: {
          ...context.ui,
          categories: { loading: true, error: null },
        },
      })),

      setCategoriesError: assign(({ context, event }: any) => ({
        ui: {
          ...context.ui,
          categories: { loading: false, error: event.error },
        },
      })),

      setTransactions: assign(({ context, event }: any) => ({
        data: {
          ...context.data,
          transactions: event.transactions || [],
        },
        ui: {
          ...context.ui,
          transactions: { loading: false, error: null },
        },
      })),

      setTransactionsError: assign(({ context, event }: any) => ({
        ui: {
          ...context.ui,
          transactions: { loading: false, error: event.error },
        },
      })),

      selectTransaction: assign(({ event }: any) => ({
        selectedTransaction: {
          id: event.id,
          rawData: event.rawData || null,
          editing: event.editing || null,
        },
      })),

      setServiceStatus: assign(({ context, event }: any) => ({
        ui: {
          ...context.ui,
          services: {
            ...context.ui.services,
            [event.service]: event.status,
          },
        },
      })),

      // UI State actions for withdrawal flow
      setConversionAmount: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          conversionAmount: event.amount_eur,
        },
      })),

      setIsLoadingConversion: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          isLoadingConversion: event.isLoading,
        },
      })),

      setSuggestions: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          suggestions: event.suggestions || [],
        },
      })),

      setSuggestionsLoading: assign(({ context }) => ({
        transaction: {
          ...context.transaction,
          isLoadingSuggestions: true,
          suggestionsError: null,
        },
      })),

      setIsLoadingSuggestions: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          isLoadingSuggestions: event.isLoading,
        },
      })),

      setSuggestionsError: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          suggestionsError: event.error,
        },
      })),

      setIsSubmitting: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          isSubmitting: event.isSubmitting,
        },
      })),

      setSubmitMessage: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          submitMessage: event.message,
        },
      })),
    },
  }
);
