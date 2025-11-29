/**
 * Budget Machine
 * xstate FSM for complete app state management
 * Simplified for easier integration and maintenance
 */

import { createMachine, assign } from 'xstate';
import type { BudgetMachineContext } from './types';
import { initialContext } from './types';

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

        states: {
          home: {
            on: {
              NAVIGATE_EXPENSE_ACCOUNTS: 'expenseFlow',
              NAVIGATE_INCOME_ACCOUNTS: 'incomeFlow',
              NAVIGATE_TRANSFER_SOURCE: 'transferFlow',
              NAVIGATE_TRANSACTIONS: 'transactions',
              NAVIGATE_DEBUG: 'debug',
            },
          },

          expenseFlow: {
            initial: 'accounts',
            on: {
              NAVIGATE_HOME: '#budget.ready.home',
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
                  UPDATE_AMOUNT_FOREIGN: {
                    actions: 'updateAmountForeign',
                  },
                  NAVIGATE_CATEGORY: 'category',
                  NAVIGATE_BACK: 'accounts',
                },
              },
              category: {
                on: {
                  UPDATE_CATEGORY: {
                    target: 'comment',
                    actions: 'updateCategory',
                  },
                  NAVIGATE_BACK: 'amount',
                },
              },
              comment: {
                on: {
                  UPDATE_COMMENT: {
                    actions: 'updateComment',
                  },
                  NAVIGATE_CONFIRM: 'confirm',
                  NAVIGATE_BACK: 'category',
                },
              },
              confirm: {
                on: {
                  SUBMIT_TRANSACTION: {
                    target: '#budget.ready.home',
                    actions: 'resetTransaction',
                  },
                  NAVIGATE_BACK: 'comment',
                },
              },
            },
          },

          incomeFlow: {
            initial: 'accounts',
            on: {
              NAVIGATE_HOME: '#budget.ready.home',
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
                  NAVIGATE_CATEGORY: 'category',
                  NAVIGATE_BACK: 'accounts',
                },
              },
              category: {
                on: {
                  UPDATE_CATEGORY: {
                    target: 'comment',
                    actions: 'updateCategory',
                  },
                  NAVIGATE_BACK: 'amount',
                },
              },
              comment: {
                on: {
                  UPDATE_COMMENT: {
                    actions: 'updateComment',
                  },
                  NAVIGATE_CONFIRM: 'confirm',
                  NAVIGATE_BACK: 'category',
                },
              },
              confirm: {
                on: {
                  SUBMIT_TRANSACTION: {
                    target: '#budget.ready.home',
                    actions: 'resetTransaction',
                  },
                  NAVIGATE_BACK: 'comment',
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
                    actions: 'setTransferSource',
                  },
                  NAVIGATE_BACK: '#budget.ready.home',
                },
              },
              destAccounts: {
                on: {
                  SET_TRANSFER_DEST: {
                    target: 'amount',
                    actions: 'setTransferDest',
                  },
                  NAVIGATE_BACK: 'sourceAccounts',
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
                  NAVIGATE_TRANSFER_FEES: 'fees',
                  NAVIGATE_BACK: 'destAccounts',
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
                  NAVIGATE_TRANSFER_COMMENT: 'comment',
                  NAVIGATE_BACK: 'amount',
                },
              },
              comment: {
                on: {
                  UPDATE_TRANSFER_COMMENT: {
                    actions: 'updateTransferComment',
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
                  NAVIGATE_BACK: 'comment',
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
          account: event.account,
          account_id: event.account_id,
          account_currency: event.account_currency,
          username: event.username || context.transaction.username,
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
          amount_foreign: event.amount_foreign,
        },
      })),

      updateCategory: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          category: event.category,
        },
      })),

      updateComment: assign(({ context, event }: any) => ({
        transaction: {
          ...context.transaction,
          comment: event.comment,
        },
      })),

      resetTransaction: assign({
        transaction: initialContext.transaction,
      }),

      setTransferSource: assign(({ context, event }: any) => ({
        transfer: {
          ...context.transfer,
          source: {
            account: event.account,
            id: event.account_id,
            currency: event.account_currency,
          },
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
          comment: event.comment,
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
          categories: event.categories || [],
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
    },
  }
);
