/**
 * Budget Machine Actors
 * Invoked actors for long-running services and side effects
 */

import { fromPromise } from 'xstate';
import type { BudgetUser } from './types';
import { initializeTelegramUser } from '../services/telegram';
import { syncService, type AccountUsage, type CategoryUsage, type SourceSuggestion } from '../services/sync';
import { apiClient, addTransaction, fetchTransactions, fetchTransactionById } from '../services/sync/index';
import type { DisplayTransaction, TransactionData } from '../types/transaction';
import { ACTOR_TIMEOUTS } from '../config/actorTimeouts';
import { createActorWithErrorHandling, withTimeout, logActorEvent } from './errorHandling';

// ============================================================================
// Telegram User Initialization Actor
// ============================================================================

export const telegramInitActor = createActorWithErrorHandling<BudgetUser, {}>({
  name: 'telegramInit',
  timeout: ACTOR_TIMEOUTS.TELEGRAM_INIT,

  operation: async () => {
    // Use shared initialization function with timeout protection
    return await initializeTelegramUser({
      timeout: ACTOR_TIMEOUTS.TELEGRAM_INIT,
    });
  },

  // Graceful fallback to Guest user
  fallback: () => {
    console.warn('⚠️ Telegram initialization failed. Running in browser mode.');
    return {
      id: 0,
      user_name: 'User',
      fullName: 'User',
      photoUrl: null,
      initials: 'U',
      bio: 'Manage finances and create reports',
      colorScheme: 'dark' as const,
      rawUser: null,
    };
  }
});

// ============================================================================
// Accounts Fetch Actor
// ============================================================================

export const accountsFetchActor = createActorWithErrorHandling<
  AccountUsage[],
  { user_name?: string }
>({
  name: 'accountsFetch',
  timeout: ACTOR_TIMEOUTS.DATA_FETCH,
  operation: async (input) => {
    const response = await syncService.getAccountsUsage(input.user_name);
    return response.get_accounts_usage;
  },
});

// ============================================================================
// Categories Fetch Actor
// ============================================================================

export const categoriesFetchActor = createActorWithErrorHandling<
  CategoryUsage[],
  { user_name?: string; type?: 'withdrawal' | 'deposit' }
>({
  name: 'categoriesFetch',
  timeout: ACTOR_TIMEOUTS.DATA_FETCH,
  operation: async (input) => {
    const response = await syncService.getCategoriesUsage(input.user_name, input.type);
    return response.get_categories_usage;
  },
});

// ============================================================================
// Deposit Source Name Fetch Actor
// ============================================================================

export const depositSourceNameFetchActor = createActorWithErrorHandling<
  SourceSuggestion[],
  { user_name?: string; category_id: number }
>({
  name: 'depositSourceNameFetch',
  timeout: ACTOR_TIMEOUTS.DATA_FETCH,
  operation: async (input) => {
    const response = await syncService.getSourceNameUsage(input.user_name, input.category_id);
    return response.get_source_name_usage;
  },
});

// ============================================================================
// Transactions Fetch Actor
// ============================================================================

export const transactionsFetchActor = createActorWithErrorHandling<
  DisplayTransaction[],
  { page?: number }
>({
  name: 'transactionsFetch',
  timeout: ACTOR_TIMEOUTS.DATA_FETCH,
  operation: async (input) => {
    const response = await fetchTransactions(input.page || 1);
    return response.transactions;
  },
});

// ============================================================================
// Transaction Detail Fetch Actor
// ============================================================================

export const transactionDetailFetchActor = createActorWithErrorHandling<
  TransactionData,
  { transactionId: string }
>({
  name: 'transactionDetailFetch',
  timeout: ACTOR_TIMEOUTS.CRUD_OPERATION,
  operation: async (input) => {
    const response = await fetchTransactionById(input.transactionId);
    if (!response.rawData) {
      throw new Error('Transaction not found');
    }
    return response.rawData;
  },
});

// ============================================================================
// Transaction Creation Actor
// ============================================================================

export const transactionCreateActor = createActorWithErrorHandling<
  void,
  {
    type: 'expense' | 'deposit' | 'transfer';
    data: any;
  }
>({
  name: 'transactionCreate',
  timeout: ACTOR_TIMEOUTS.CRUD_OPERATION,
  operation: async (input) => {
    await addTransaction(input.data, input.type, true);
  },
});

// ============================================================================
// Transaction Edit Actor
// ============================================================================

export const transactionEditActor = createActorWithErrorHandling<
  void,
  {
    transactionId: string;
    data: any;
  }
>({
  name: 'transactionEdit',
  timeout: ACTOR_TIMEOUTS.CRUD_OPERATION,
  operation: async (input) => {
    await apiClient.request<Record<string, unknown>>(
      `/api/v1/transactions/${input.transactionId}`,
      {
        method: 'PUT',
        body: { transactions: [input.data] },
        auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
      }
    );
  },
});

// ============================================================================
// Transaction Delete Actor
// ============================================================================

export const transactionDeleteActor = createActorWithErrorHandling<
  void,
  { transactionId: string }
>({
  name: 'transactionDelete',
  timeout: ACTOR_TIMEOUTS.CRUD_OPERATION,
  operation: async (input) => {
    await apiClient.request<Record<string, unknown>>(
      `/api/v1/transactions/${input.transactionId}`,
      {
        method: 'DELETE',
        auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
      }
    );
  },
});

// ============================================================================
// Service Health Check Actors
// ============================================================================

export const syncServiceHealthActor = createActorWithErrorHandling<
  { success: boolean; message: string },
  { user_name?: string }
>({
  name: 'syncServiceHealth',
  timeout: ACTOR_TIMEOUTS.HEALTH_CHECK,
  operation: async () => syncService.checkConnection(),
});

export const fireflyServiceHealthActor = createActorWithErrorHandling<
  { success: boolean; message: string },
  {}
>({
  name: 'fireflyServiceHealth',
  timeout: ACTOR_TIMEOUTS.HEALTH_CHECK,
  operation: async () => {
    await apiClient.request<{ data: unknown }>(
      '/api/v1/transactions?limit=1',
      {
        method: 'GET',
        auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
      }
    );
    return { success: true, message: 'Firefly API is accessible' };
  },
  fallback: (error) => {
    return {
      success: false,
      message: error.message
    };
  }
});

// ============================================================================
// Sequential Data Loading Orchestrator Actor
// ============================================================================
// Loads accounts first, then categories and transactions in parallel
// This improves perceived performance by unblocking UI with accounts data sooner

export interface DataLoadingResult {
  accounts: AccountUsage[];
  categories: CategoryUsage[];
  transactions: DisplayTransaction[];
}

export const dataLoadingOrchestratorActor = fromPromise<
  DataLoadingResult,
  { user_name?: string; timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.ORCHESTRATOR;
  const startTime = Date.now();
  const isUnknown = input?.user_name === 'User' || input?.user_name === 'Guest' || !input?.user_name;

  try {
    logActorEvent('start', 'dataLoadingOrchestrator', { user_name: input?.user_name });

    if (isUnknown) {
      logActorEvent('success', 'dataLoadingOrchestrator', {
        accounts: 0,
        categories: 0,
        transactions: 0,
        totalTime: `${Date.now() - startTime}ms`,
      });
      return { accounts: [], categories: [], transactions: [] };
    }

    // Step 1: Load accounts first (blocking step)
    const accountsResponse = await withTimeout(
      syncService.getAccountsUsage(input?.user_name),
      timeout,
      'dataLoadingOrchestrator - accounts'
    );

    const accounts = accountsResponse.get_accounts_usage || [];
    const accountsTime = Date.now() - startTime;

    // Step 2: Load categories and transactions in parallel
    const remainingTimeout = Math.max(timeout - accountsTime, 5000);
    const [categoriesResponse, transactionsResponse] = await Promise.all([
      withTimeout(
        syncService.getCategoriesUsage(
          isUnknown ? undefined : input?.user_name,
          'withdrawal'
        ),
        remainingTimeout,
        'dataLoadingOrchestrator - categories'
      ),
      withTimeout(
        fetchTransactions(1),
        remainingTimeout,
        'dataLoadingOrchestrator - transactions'
      ),
    ]);

    const categories = categoriesResponse.get_categories_usage || [];
    const transactions = transactionsResponse.transactions || [];
    const totalTime = Date.now() - startTime;

    logActorEvent('success', 'dataLoadingOrchestrator', {
      accounts: accounts.length,
      categories: categories.length,
      transactions: transactions.length,
      totalTime: `${totalTime}ms`
    });

    return { accounts, categories, transactions };
  } catch (error) {
    console.error('❌ dataLoadingOrchestrator: Error in sequential data loading:', error);
    throw error;
  }
});
