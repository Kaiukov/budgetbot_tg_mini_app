/**
 * Budget Machine Actors
 * Invoked actors for long-running services and side effects
 */

import { fromPromise } from 'xstate';
import type { BudgetUser } from './types';
import telegramService from '../services/telegram';
import { syncService, type AccountUsage, type CategoryUsage } from '../services/sync';
import { fireflyService, addTransaction } from '../services/firefly';
import { fetchTransactions, fetchTransactionById } from '../services/firefly/transactionsFetch';
import type { DisplayTransaction, TransactionData } from '../types/transaction';
import { fetchUserData } from '../utils/fetchUserData';

// ============================================================================
// Telegram User Initialization Actor
// ============================================================================

export const telegramInitActor = fromPromise<
  BudgetUser,
  { timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || 5000;

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
          username: 'User',
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
      const userName = telegramService.getUserName();
      const userPhotoUrl = telegramService.getUserPhotoUrl();
      const userInitials = telegramService.getUserInitials();
      const colorScheme = telegramService.getColorScheme();
      const userBio = telegramService.getUserBio() || 'Manage finances and create reports';

      console.log('🔍 Telegram User Data:', { userName, userInitials });

      // Fetch additional user data from backend
      if (user?.id) {
        console.log('📸 Fetching comprehensive user data from backend...');
        fetchUserData(user.id)
          .then((backendData) => {
            clearTimeout(timer);
            if (backendData?.success && backendData.userData) {
              resolve({
                id: user.id,
                username: backendData.userData.username || userName,
                fullName: backendData.userData.name || userName,
                photoUrl: userPhotoUrl,
                initials: userInitials,
                bio: backendData.userData.bio || userBio,
                colorScheme,
                rawUser: user,
              });
            } else {
              resolve({
                id: user.id,
                username: userName,
                fullName: userName,
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
              username: userName,
              fullName: userName,
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
          username: userName,
          fullName: userName,
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
  { userName?: string; timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || 30000; // 30s timeout

  return new Promise<AccountUsage[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Fetch accounts timeout after 30 seconds'));
    }, timeout);

    try {
      console.log('🔄 Fetching accounts for user:', input?.userName);
      syncService.getAccountsUsage(input?.userName)
        .then((response) => {
          clearTimeout(timer);
          console.log('✅ Accounts fetched:', response.get_accounts_usage.length);
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
  { userName?: string; timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || 30000; // 30s timeout

  return new Promise<CategoryUsage[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Fetch categories timeout after 30 seconds'));
    }, timeout);

    try {
      console.log('🔄 Fetching categories for user:', input?.userName);
      syncService.getCategoriesUsage(input?.userName)
        .then((response) => {
          clearTimeout(timer);
          console.log('✅ Categories fetched:', response.get_categories_usage.length);
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
// Transactions Fetch Actor
// ============================================================================

export const transactionsFetchActor = fromPromise<
  DisplayTransaction[],
  { page?: number; timeout?: number }
>(async ({ input }) => {
  const timeout = input?.timeout || 30000; // 30s timeout

  return new Promise<DisplayTransaction[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Fetch transactions timeout after 30 seconds'));
    }, timeout);

    try {
      console.log('🔄 Fetching transactions, page:', input?.page || 1);
      fetchTransactions(input?.page || 1)
        .then((response) => {
          clearTimeout(timer);
          console.log('✅ Transactions fetched:', response.transactions.length);
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
  { transactionId: string }
>(async ({ input }) => {
  try {
    console.log('🔄 Fetching transaction detail:', input.transactionId);
    const response = await fetchTransactionById(input.transactionId);
    if (!response.rawData) {
      throw new Error('Transaction not found');
    }
    console.log('✅ Transaction detail fetched');
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
    type: 'expense' | 'income' | 'transfer';
    data: any;
  }
>(async ({ input }) => {
  try {
    console.log(`🔄 Creating ${input.type} transaction...`);
    await addTransaction(input.data, input.type, true);
    console.log(`✅ ${input.type} transaction created`);
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
  }
>(async ({ input }) => {
  try {
    console.log('🔄 Editing transaction:', input.transactionId);
    const response = await fireflyService.putRequest(
      `/api/v1/transactions/${input.transactionId}`,
      { transactions: [input.data] }
    );
    if (!response.success) {
      throw new Error(response.error);
    }
    console.log('✅ Transaction edited');
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
  { transactionId: string }
>(async ({ input }) => {
  try {
    console.log('🔄 Deleting transaction:', input.transactionId);
    await fireflyService.deleteRequest(`/api/v1/transactions/${input.transactionId}`);
    console.log('✅ Transaction deleted');
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
  { userName?: string }
>(async () => {
  try {
    console.log('🔄 Checking Sync API connection...');
    const result = await syncService.checkConnection();
    console.log('✅ Sync API status:', result);
    return result;
  } catch (error) {
    console.error('❌ Sync API health check failed:', error);
    throw error;
  }
});

export const fireflyServiceHealthActor = fromPromise<
  { success: boolean; message: string },
  {}
>(async () => {
  try {
    console.log('🔄 Checking Firefly API connection...');
    const result = await fireflyService.checkConnection();
    console.log('✅ Firefly API status:', result);
    return result;
  } catch (error) {
    console.error('❌ Firefly API health check failed:', error);
    throw error;
  }
});
