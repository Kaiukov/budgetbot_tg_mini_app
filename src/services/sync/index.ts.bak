/**
 * Unified Sync & Firefly Service Export Hub
 * Consolidates all sync and firefly-related exports for clean imports
 *
 * This module represents the full consolidation of:
 * - src/services/sync.ts (SyncService for API data fetching)
 * - src/services/firefly/* (Firefly III transaction operations)
 *
 * All operations use the unified apiClient with Firefly 3-tier auth system:
 * - Tier 2: Anonymous Authorized (Telegram Mini App users) - default for all operations
 * - Tier 1: Service Role (Bearer token) - for backend services
 * - Tier 3: Read-Only (public access) - fallback
 */

// ============================================================================
// Core Sync Service (from parent sync.ts file)
// Note: This is imported from the parent sync.ts file, not re-exported here
// to avoid circular dependencies. Import directly: import { syncService } from '../sync'
// ============================================================================

// ============================================================================
// Unified HTTP Client (Tier 2/1/3 auth support)
// ============================================================================
export { apiClient } from './apiClient';

// ============================================================================
// Firefly III Service - REMOVED
// ============================================================================
// Note: fireflyService was removed. All Firefly API calls now go directly through
// the unified apiClient with Tier 2 authentication. Use the functions below instead:
// - addTransaction() for creating transactions
// - fetchTransactions() for retrieving paginated transactions
// - fetchTransactionById() for getting a single transaction

// ============================================================================
// Transaction Operations (consolidated from src/services/firefly/transactions.ts)
// ============================================================================
export { addTransaction } from './transactions';

// ============================================================================
// Transaction Fetching (consolidated from src/services/firefly/transactionsFetch.ts)
// ============================================================================
export { fetchTransactions, fetchTransactionById, createTransactionsFetchService } from './transactionsFetch';

// ============================================================================
// Utility Functions (consolidated from src/services/firefly/utils.ts)
// ============================================================================
export {
  generateExternalId,
  removeNullValues,
  parseTransactionDate,
  formatAmount,
  extractCategoryName,
  extractBudgetName,
  buildWithdrawalDescription,
  buildIncomeDescription,
  buildTransferDescription,
  buildTransactionNotes,
  validateAmount,
  requiresConversion,
  logTransactionOperation,
  OperationTimer,
} from './utils';

// ============================================================================
// Type Definitions (consolidated from src/services/firefly/types.ts)
// ============================================================================
export {
  TransactionType,
  type BaseTransactionData,
  type WithdrawalTransactionData,
  type IncomeTransactionData,
  type TransferTransactionData,
  type FireflyTransactionPayload,
  type FireflyCreateTransactionRequest,
  type FireflyTransactionResponse,
  type TransactionResult,
  type VerificationResponse,
} from './types';
