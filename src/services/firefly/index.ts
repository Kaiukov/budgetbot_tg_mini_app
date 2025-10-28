/**
 * Firefly III Service Export Hub
 * Centralizes all Firefly-related exports for clean imports
 */

// Core service
export { fireflyService, type FireflyAboutResponse, type FireflyUserResponse } from './firefly';

// Transaction functionality
export { addTransaction } from './transactions';

// Types
export {
  TransactionType,
  type BaseTransactionData,
  type ExpenseTransactionData,
  type IncomeTransactionData,
  type TransferTransactionData,
  type FireflyTransactionPayload,
  type FireflyCreateTransactionRequest,
  type FireflyTransactionResponse,
  type TransactionResult,
  type VerificationResponse,
} from './types';

// Utilities
export {
  generateExternalId,
  removeNullValues,
  parseTransactionDate,
  formatAmount,
  extractCategoryName,
  buildExpenseDescription,
  buildTransferDescription,
  buildTransactionNotes,
  validateAmount,
  logTransactionOperation,
  OperationTimer,
} from './utils';
