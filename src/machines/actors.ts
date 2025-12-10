/**
 * Budget Machine Actors
 * Invoked actors for long-running services and side effects
 */

import { fromPromise } from 'xstate';
import type { BudgetUser } from './types';
import telegramService from '../services/telegram';
import { syncService, type AccountUsage, type CategoryUsage, type SourceSuggestion } from '../services/sync';
import { apiClient, addTransaction, fetchTransactions, fetchTransactionById } from '../services/sync/index';
import type { DisplayTransaction, TransactionData } from '../types/transaction';
import { fetchUserData } from '../utils/fetchUserData';
import { ACTOR_TIMEOUTS } from '../config/actorTimeouts';

const enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';
const debugLog = (...args: any[]) => {
  if (enableDebugLogs) {
    console.log(...args);
  }
};

// ============================================================================
// Telegram User Initialization Actor
// ============================================================================

export const telegramInitActor = fromPromise<
  BudgetUser,
  { timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.TELEGRAM_INIT;

  return new Promise<BudgetUser>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Telegram initialization timeout'));
    }, timeout);

    try {
      // Check if Telegram WebApp is available
      const isAvailable = telegramService.isAvailable();

      if (!isAvailable) {
        clearTimeout(timer);
        console.warn('Telegram WebApp not available. Running in browser mode.');
        resolve({
          id: 0,
          user_name: 'User',
          fullName: 'User',
          photoUrl: null,
          initials: 'U',
          bio: 'Manage finances and create reports',
          colorScheme: 'dark',
          rawUser: null,
        });
        return;
      }

      const user = telegramService.getUser();
      const user_name = telegramService.getUserName();
      const userPhotoUrl = telegramService.getUserPhotoUrl();
      const userInitials = telegramService.getUserInitials();
      const colorScheme = telegramService.getColorScheme();
      const userBio = telegramService.getUserBio() || 'Manage finances and create reports';

      debugLog('🔍 Telegram User Data:', { user_name, userInitials });

      // Fetch additional user data from backend
      if (user?.id) {
        debugLog('📸 Fetching comprehensive user data from backend...');
        fetchUserData(user.id)
          .then((backendData) => {
            clearTimeout(timer);
            if (backendData?.success && backendData.userData) {
              resolve({
                id: user.id,
                user_name: backendData.userData.username || user_name,
                fullName: backendData.userData.name || user_name,
                photoUrl: userPhotoUrl,
                initials: userInitials,
                bio: backendData.userData.bio || userBio,
                colorScheme,
                rawUser: user,
              });
            } else {
              resolve({
                id: user.id,
                user_name: user_name,
                fullName: user_name,
                photoUrl: userPhotoUrl,
                initials: userInitials,
                bio: userBio,
                colorScheme,
                rawUser: user,
              });
            }
          })
          .catch((error) => {
            clearTimeout(timer);
            console.error('❌ Failed to fetch comprehensive user data:', error);
            resolve({
              id: user.id,
              user_name: user_name,
              fullName: user_name,
              photoUrl: userPhotoUrl,
              initials: userInitials,
              bio: userBio,
              colorScheme,
              rawUser: user,
            });
          });
      } else {
        clearTimeout(timer);
        resolve({
          id: user?.id || 0,
          user_name: user_name,
          fullName: user_name,
          photoUrl: userPhotoUrl,
          initials: userInitials,
          bio: userBio,
          colorScheme,
          rawUser: user || null,
        });
      }
    } catch (error) {
      clearTimeout(timer);
      console.error('❌ Telegram initialization error:', error);
      reject(error);
    }
  });
});

// ============================================================================
// Accounts Fetch Actor
// ============================================================================

export const accountsFetchActor = fromPromise<
  AccountUsage[],
  { user_name?: string; timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.DATA_FETCH;

  return new Promise<AccountUsage[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Fetch accounts timeout after 30 seconds'));
    }, timeout);

    try {
      debugLog('🔄 Fetching accounts for user:', input?.user_name);
      syncService.getAccountsUsage(input?.user_name)
        .then((response) => {
          clearTimeout(timer);
          debugLog('✅ Accounts fetched:', response.get_accounts_usage.length);
          resolve(response.get_accounts_usage);
        })
        .catch((error) => {
          clearTimeout(timer);
          console.error('❌ Failed to fetch accounts:', error);
          reject(error);
        });
    } catch (error) {
      clearTimeout(timer);
      console.error('❌ Error in accounts fetch:', error);
      reject(error);
    }
  });
});

// ============================================================================
// Categories Fetch Actor
// ============================================================================

export const categoriesFetchActor = fromPromise<
  CategoryUsage[],
  { user_name?: string; type?: 'withdrawal' | 'deposit'; timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.DATA_FETCH;

  return new Promise<CategoryUsage[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Fetch categories timeout after 30 seconds'));
    }, timeout);

    try {
      debugLog('🔄 Fetching categories for user:', input?.user_name, 'type:', input?.type);
      syncService.getCategoriesUsage(input?.user_name, input?.type)
        .then((response) => {
          clearTimeout(timer);
          debugLog('✅ Categories fetched:', response.get_categories_usage.length);
          resolve(response.get_categories_usage);
        })
        .catch((error) => {
          clearTimeout(timer);
          console.error('❌ Failed to fetch categories:', error);
          reject(error);
        });
    } catch (error) {
      clearTimeout(timer);
      console.error('❌ Error in categories fetch:', error);
      reject(error);
    }
  });
});

// ============================================================================
// Deposit Source Name Fetch Actor
// ============================================================================

export const depositSourceNameFetchActor = fromPromise<
  SourceSuggestion[],
  { user_name?: string; category_id: number; timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.DATA_FETCH;

  return new Promise<SourceSuggestion[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Fetch source names timeout after 30 seconds'));
    }, timeout);

    try {
      debugLog('🔄 Fetching source names for user:', input?.user_name, 'category_id:', input?.category_id);
      syncService.getSourceNameUsage(input?.user_name, input?.category_id)
        .then((response) => {
          clearTimeout(timer);
          debugLog('✅ Source names fetched:', response.get_source_name_usage.length);
          resolve(response.get_source_name_usage);
        })
        .catch((error) => {
          clearTimeout(timer);
          console.error('❌ Failed to fetch source names:', error);
          reject(error);
        });
    } catch (error) {
      clearTimeout(timer);
      console.error('❌ Error in source names fetch:', error);
      reject(error);
    }
  });
});

// ============================================================================
// Transactions Fetch Actor
// ============================================================================

export const transactionsFetchActor = fromPromise<
  DisplayTransaction[],
  { page?: number; timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.DATA_FETCH;

  return new Promise<DisplayTransaction[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Fetch transactions timeout after 30 seconds'));
    }, timeout);

    try {
      debugLog('🔄 Fetching transactions, page:', input?.page || 1);
      fetchTransactions(input?.page || 1)
        .then((response) => {
          clearTimeout(timer);
          debugLog('✅ Transactions fetched:', response.transactions.length);
          resolve(response.transactions);
        })
        .catch((error) => {
          clearTimeout(timer);
          console.error('❌ Failed to fetch transactions:', error);
          reject(error);
        });
    } catch (error) {
      clearTimeout(timer);
      console.error('❌ Error in transactions fetch:', error);
      reject(error);
    }
  });
});

// ============================================================================
// Transaction Detail Fetch Actor
// ============================================================================

export const transactionDetailFetchActor = fromPromise<
  TransactionData,
  { transactionId: string; timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.CRUD_OPERATION;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Transaction detail fetch timeout after ${timeout}ms`));
    }, timeout);
  });

  try {
    debugLog('🔄 Fetching transaction detail:', input.transactionId);
    const response = await Promise.race([
      timeoutPromise,
      fetchTransactionById(input.transactionId),
    ]);
    if (!response.rawData) {
      throw new Error('Transaction not found');
    }
    debugLog('✅ Transaction detail fetched');
    return response.rawData;
  } catch (error) {
    console.error('❌ Failed to fetch transaction detail:', error);
    throw error;
  }
});

// ============================================================================
// Transaction Creation Actor
// ============================================================================

export const transactionCreateActor = fromPromise<
  void,
  {
    type: 'expense' | 'deposit' | 'transfer';
    data: any;
    timeout?: number;
  }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.CRUD_OPERATION;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Transaction create timeout after ${timeout}ms`));
    }, timeout);
  });

  try {
    debugLog(`🔄 Creating ${input.type} transaction...`);
    await Promise.race([
      timeoutPromise,
      addTransaction(input.data, input.type, true),
    ]);
    debugLog(`✅ ${input.type} transaction created`);
  } catch (error) {
    console.error(`❌ Failed to create ${input.type} transaction:`, error);
    throw error;
  }
});

// ============================================================================
// Transaction Edit Actor
// ============================================================================

export const transactionEditActor = fromPromise<
  void,
  {
    transactionId: string;
    data: any;
    timeout?: number;
  }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.CRUD_OPERATION;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Transaction edit timeout after ${timeout}ms`));
    }, timeout);
  });

  try {
    debugLog('🔄 Editing transaction:', input.transactionId);
    await Promise.race([
      timeoutPromise,
      apiClient.request<Record<string, unknown>>(
        `/api/v1/transactions/${input.transactionId}`,
        {
          method: 'PUT',
          body: { transactions: [input.data] },
          auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
        }
      ),
    ]);
    debugLog('✅ Transaction edited');
  } catch (error) {
    console.error('❌ Failed to edit transaction:', error);
    throw error;
  }
});

// ============================================================================
// Transaction Delete Actor
// ============================================================================

export const transactionDeleteActor = fromPromise<
  void,
  { transactionId: string; timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.CRUD_OPERATION;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Transaction delete timeout after ${timeout}ms`));
    }, timeout);
  });

  try {
    debugLog('🔄 Deleting transaction:', input.transactionId);
    await Promise.race([
      timeoutPromise,
      apiClient.request<Record<string, unknown>>(
        `/api/v1/transactions/${input.transactionId}`,
        {
          method: 'DELETE',
          auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
        }
      ),
    ]);
    debugLog('✅ Transaction deleted');
  } catch (error) {
    console.error('❌ Failed to delete transaction:', error);
    throw error;
  }
});

// ============================================================================
// Service Health Check Actors
// ============================================================================

export const syncServiceHealthActor = fromPromise<
  { success: boolean; message: string },
  { user_name?: string; timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.HEALTH_CHECK;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Sync service health check timeout after ${timeout}ms`));
    }, timeout);
  });

  try {
    debugLog('🔄 Checking Sync API connection...');
    const result = await Promise.race([
      timeoutPromise,
      syncService.checkConnection(),
    ]);
    debugLog('✅ Sync API status:', result);
    return result;
  } catch (error) {
    console.error('❌ Sync API health check failed:', error);
    throw error;
  }
});

export const fireflyServiceHealthActor = fromPromise<
  { success: boolean; message: string },
  { timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || ACTOR_TIMEOUTS.HEALTH_CHECK;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Firefly service health check timeout after ${timeout}ms`));
    }, timeout);
  });

  try {
    debugLog('🔄 Checking Firefly API connection...');
    // Test connection by making a simple request to the API
    await Promise.race([
      timeoutPromise,
      apiClient.request<{ data: unknown }>(
        '/api/v1/transactions?limit=1',
        {
          method: 'GET',
          auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
        }
      ),
    ]);
    const result = { success: true, message: 'Firefly API is accessible' };
    debugLog('✅ Firefly API status:', result);
    return result;
  } catch (error) {
    console.error('❌ Firefly API health check failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to connect to Firefly API'
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

  try {
    debugLog('🔄 Sequential data loading: Starting accounts fetch...');

    // Step 1: Load accounts first (blocking step)
    const accountsResponse = await Promise.race([
      syncService.getAccountsUsage(input?.user_name),
      new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Accounts fetch timeout')), timeout)
      ),
    ]);

    const accounts = accountsResponse.get_accounts_usage || [];
    const accountsTime = Date.now() - startTime;
    debugLog(`✅ Accounts loaded in ${accountsTime}ms, starting parallel loads...`);

    // Step 2: Load categories and transactions in parallel (non-blocking step)
    const isUnknown = input?.user_name === 'User' || input?.user_name === 'Guest';
    const [categoriesResponse, transactionsResponse] = await Promise.all([
      Promise.race([
        syncService.getCategoriesUsage(
          isUnknown ? undefined : input?.user_name,
          'withdrawal'
        ),
        new Promise<any>((_, reject) =>
          setTimeout(
            () => reject(new Error('Categories fetch timeout')),
            Math.max(timeout - accountsTime, 5000)
          )
        ),
      ]),
      Promise.race([
        fetchTransactions(1),
        new Promise<any>((_, reject) =>
          setTimeout(
            () => reject(new Error('Transactions fetch timeout')),
            Math.max(timeout - accountsTime, 5000)
          )
        ),
      ]),
    ]);

    const categories = categoriesResponse.get_categories_usage || [];
    const transactions = transactionsResponse.transactions || [];
    const totalTime = Date.now() - startTime;

    debugLog(`✅ All data loaded in ${totalTime}ms:`, {
      accounts: accounts.length,
      categories: categories.length,
      transactions: transactions.length,
    });

    return { accounts, categories, transactions };
  } catch (error) {
    console.error('❌ Error in sequential data loading:', error);
    throw error;
  }
});
