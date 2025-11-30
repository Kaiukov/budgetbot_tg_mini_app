/**
 * Firefly III Transactions Fetch Service
 * Handles GET operations for fetching transactions with pagination
 * Also handles single transaction retrieval
 * Uses unified apiClient with Tier 2 auth (Telegram Mini App users)
 */

import { apiClient } from './apiClient';
import type {
  FireflyTransactionResponse,
  DisplayTransaction,
  TransactionData,
  PaginationMeta,
} from '../../types/transaction';

/**
 * Fetch paginated transactions from Firefly III
 * @param page - Page number (1-indexed)
 * @param limit - Number of transactions per page
 * @returns Transactions data with pagination metadata
 */
export async function fetchTransactions(
  page: number = 1,
  limit: number = 10
): Promise<{
  transactions: DisplayTransaction[];
  pagination: PaginationMeta;
  error?: string;
}> {
  try {
    const endpoint = `/api/v1/transactions?page=${page}&limit=${limit}`;

    const response = await apiClient.request<FireflyTransactionResponse>(
      endpoint,
      {
        method: 'GET',
        auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
      }
    );

    if (!response) {
      return {
        transactions: [],
        pagination: {
          total: 0,
          count: 0,
          per_page: limit,
          current_page: page,
          total_pages: 0,
        },
        error: 'Failed to fetch transactions',
      };
    }

    // Transform API response to display format
    const transactions = transformTransactionsForDisplay(response);

    return {
      transactions,
      pagination: response.meta.pagination,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
    console.error('❌ Failed to fetch transactions:', errorMessage);

    return {
      transactions: [],
      pagination: {
        total: 0,
        count: 0,
        per_page: limit,
        current_page: page,
        total_pages: 0,
      },
      error: errorMessage,
    };
  }
}

/**
 * Fetch single transaction by ID
 * @param id - Transaction journal ID
 * @returns Single transaction data
 */
export async function fetchTransactionById(id: string | number): Promise<{
  transaction?: DisplayTransaction;
  rawData?: TransactionData;
  error?: string;
}> {
  try {
    const endpoint = `/api/v1/transactions/${id}`;

    const response = await apiClient.request<FireflyTransactionResponse>(
      endpoint,
      {
        method: 'GET',
        auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
      }
    );

    if (!response) {
      return {
        error: 'No response from server',
      };
    }

    // Handle both array and single object responses
    let transactionData: TransactionData | null = null;

    if (Array.isArray(response.data) && response.data.length > 0) {
      // Response is an array (list endpoint behavior)
      const firstItem = response.data[0];
      if (firstItem.attributes?.transactions?.[0]) {
        transactionData = firstItem.attributes.transactions[0];
      }
    } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      // Response might be a single object
      const dataObj = response.data as unknown as {
        attributes?: {
          transactions?: TransactionData[];
        };
      };
      if (dataObj.attributes?.transactions?.[0]) {
        transactionData = dataObj.attributes.transactions[0];
      }
    }

    if (!transactionData) {
      return {
        error: 'Transaction not found or invalid response structure',
      };
    }

    const transaction = transformTransactionForDisplay(transactionData);

    return {
      transaction,
      rawData: transactionData,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transaction';
    console.error('❌ Failed to fetch transaction:', errorMessage);

    return {
      error: errorMessage,
    };
  }
}

/**
 * Transform API transaction data to display-friendly format
 * Handles all three transaction types: income, expense, transfer
 */
function transformTransactionForDisplay(data: TransactionData): DisplayTransaction {
  const isIncome = data.type === 'deposit';
  const isExpense = data.type === 'withdrawal';
  const isTransfer = data.type === 'transfer';

  // Determine transaction type for display
  let displayType: 'income' | 'expense' | 'transfer' = 'expense';
  if (isIncome) displayType = 'income';
  else if (isTransfer) displayType = 'transfer';

  // Parse amounts
  const amount = parseFloat(data.amount || '0');
  const foreignAmount = data.foreign_amount ? parseFloat(data.foreign_amount) : undefined;

  // Get category name
  let categoryName = data.category_name || 'Uncategorized';

  // Get source/destination names
  let sourceName = data.source_name || 'Unknown Account';
  let destinationName = data.destination_name || 'Unknown Account';

  // Build description - remove duplicate info that's in category/account names
  let description = data.description || '';
  // Clean up description if it's too long or contains repeated information
  if (description.length > 100) {
    description = description.substring(0, 100) + '...';
  }

  return {
    id: String(data.transaction_journal_id),
    type: displayType,
    date: data.date,
    amount,
    currency: data.currency_code,
    currencySymbol: data.currency_symbol,
    foreignAmount,
    foreignCurrency: data.foreign_currency_code,
    foreignCurrencySymbol: data.foreign_currency_symbol,
    categoryName: isTransfer ? undefined : categoryName,
    sourceName: isExpense || isTransfer ? sourceName : undefined,
    destinationName: isIncome || isTransfer ? destinationName : undefined,
    description,
    username: data.tags?.[0] || 'Unknown User',
    journalId: data.transaction_journal_id,
  };
}

/**
 * Transform multiple transactions for display
 */
function transformTransactionsForDisplay(response: FireflyTransactionResponse): DisplayTransaction[] {
  return response.data.flatMap((item) => {
    return item.attributes.transactions.map((tx) => transformTransactionForDisplay(tx));
  });
}

/**
 * Public wrapper for apiClient with typed response
 * This is used internally by the service
 */
export function createTransactionsFetchService() {
  return {
    fetchTransactions,
    fetchTransactionById,
  };
}
