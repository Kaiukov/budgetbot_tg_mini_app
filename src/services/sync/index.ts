/**
 * Sync API Service - Main Export
 * Exports singleton instance and all types
 */

import { SyncServiceUser } from './user';
import type { ExpenseTransactionData, IncomeTransactionData, TransferTransactionData } from './types';

// Re-export all types for consumers
export * from './types';
export * from './transaction-utils';

// Export class for type checking if needed
export { SyncServiceUser };

// Create singleton instance
export const syncService = new SyncServiceUser();

// Convenience wrapper for transaction creation
export async function addTransaction(
  body: ExpenseTransactionData | IncomeTransactionData | TransferTransactionData,
  transactionType: string,
  enableVerification: boolean = true
) {
  return syncService.addTransaction(body, transactionType, enableVerification);
}

// Default export for convenience
export default syncService;
