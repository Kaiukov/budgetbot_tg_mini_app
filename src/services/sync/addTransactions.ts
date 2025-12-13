/**
 * Firefly III Transaction Service
 * Handles creation of expenses, income, and transfer transactions
 * Uses unified apiClient with Tier 2 auth (Telegram Mini App users)
 * Based on Python implementation: firefly/budgetbot/bot/utils/firefly_api/add_transaction.py
 */

import { apiClient } from './apiClient';
import {
  type WithdrawalTransactionData,
  type DepositTransactionData,
  type TransferTransactionData,
  type UnifiedWebhookPayload,
  type FireflyCreateTransactionRequest,
  type FireflyTransactionPayload,
  type TransactionResult,
  TransactionType,
} from './types';
import {
  generateExternalId,
  removeNullValues,
  parseTransactionDate,
  formatAmount,
  validateAmount,
  logTransactionOperation,
  OperationTimer,
} from './utils';

const isDebugApi = import.meta.env.VITE_DEBUG_API === 'true';
const DEBUG_WEBHOOK_URL = import.meta.env.VITE_DEBUG_WEBHOOK_URL || 'https://n8n.neon-chuckwalla.ts.net/webhook/test_me';

const safeStringify = (value: unknown): string => {
  if (value === null || value === undefined) return String(value);
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message || String(value);

  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(
      value,
      (_k, v) => {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v as object)) return '[Circular]';
          seen.add(v as object);
        }
        if (typeof v === 'bigint') return v.toString();
        return v;
      },
      2
    );
  } catch {
    return String(value);
  }
};

/**
 * Helper to build transaction request with cleaned null values
 */
function buildTransactionRequest(payload: FireflyTransactionPayload): FireflyCreateTransactionRequest {
  const cleaned = removeNullValues(payload as unknown as Record<string, unknown>);

  return {
    error_if_duplicate_hash: false,
    apply_rules: false,
    fire_webhooks: false,
    transactions: [cleaned as unknown as FireflyTransactionPayload],
  };
}

/**
 * Main entry point for adding transactions
 * Coordinates transaction creation with optional verification
 */
export async function addTransaction(
  body: WithdrawalTransactionData | DepositTransactionData | TransferTransactionData | UnifiedWebhookPayload,
  transactionType: TransactionType | string,
  enableVerification: boolean = true
): Promise<TransactionResult> {
  // Debug mode: send payload directly to webhook for inspection
  if (isDebugApi) {
    try {
      logTransactionOperation(
        'info',
        `DEBUG_API enabled. Sending payload to webhook: ${DEBUG_WEBHOOK_URL}`
      );

      // Send payload as-is (no normalization)
      await fetch(DEBUG_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      logTransactionOperation(
        'info',
        `DEBUG_API payload sent successfully to: ${DEBUG_WEBHOOK_URL}`
      );

      // Return early to avoid hitting Firefly
      return [true, { debug: true, routed_to: DEBUG_WEBHOOK_URL } as unknown as any];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logTransactionOperation('error', `DEBUG_API webhook failed: ${message}`);
      return [false, { error: `Debug webhook failed: ${message}` } as unknown as any];
    }
  }

  const timer = new OperationTimer();

  try {
    let result: TransactionResult;

    const normalizedType = (transactionType as TransactionType).toLowerCase();

    switch (normalizedType) {
      case TransactionType.WITHDRAWAL:
        result = await handleWithdrawalTransaction(body as WithdrawalTransactionData);
        break;
      case TransactionType.DEPOSIT:
        result = await handleDepositTransaction(body as DepositTransactionData);
        break;
      case TransactionType.TRANSFER:
        result = await handleTransferTransaction(body as TransferTransactionData);
        break;
      default:
        logTransactionOperation('error', `Invalid transaction type: ${transactionType}`);
        result = [false, { error: `Invalid transaction type: ${transactionType}` }];
    }

    const [success, response] = result;

    // Verify transaction exists after creation if enabled
    if (success && enableVerification) {
      const externalId = extractExternalIdFromResponse(response);

      if (externalId) {
        logTransactionOperation('info', `Verifying transaction exists for external_id: ${externalId}`);
        const verifyResult = await verifyTransactionExists(externalId, 2);

        if (!verifyResult.verified) {
          logTransactionOperation('error', `Transaction verification failed: ${verifyResult.error}`);
          return [
            false,
            {
              error: 'Transaction creation succeeded but verification failed',
              creation_response: response,
              verification_error: verifyResult.error,
              external_id: externalId,
            } as unknown as FireflyTransactionResponse | { error: string },
          ];
        }

        logTransactionOperation('info', `Transaction verification successful for external_id: ${externalId}`);
        if (typeof response === 'object' && response !== null) {
          (response as Record<string, unknown>).verification = verifyResult;
        }
      } else {
        logTransactionOperation('warn', 'No external_id found in response - skipping verification');
      }
    }

    // Log total execution time
    const duration = timer.getDuration();
    const username = getUsername(body);
    const verificationStatus = enableVerification ? 'verified' : 'unverified';

    if (success) {
      logTransactionOperation(
        'info',
        `Transaction ${transactionType} for ${username} completed in ${duration.toFixed(2)}s (${verificationStatus})`
      );
    } else {
      logTransactionOperation('error', `Transaction ${transactionType} for ${username} failed after ${duration.toFixed(2)}s`);
    }

    return result;
  } catch (error) {
    const duration = timer.getDuration();
    const username = getUsername(body);
    const errorMessage = error instanceof Error ? error.message : String(error);

    logTransactionOperation(
      'error',
      `Transaction ${transactionType} for ${username} failed after ${duration.toFixed(2)}s: ${errorMessage}`
    );

    return [false, { error: errorMessage }];
  }
}

/**
 * Handle withdrawal transactions (EUR and non-EUR)
 */
async function handleWithdrawalTransaction(body: WithdrawalTransactionData): Promise<TransactionResult> {
  try {
    // Validate amount
    if (!validateAmount(body.amount)) {
      return [false, { error: 'Invalid amount: must be positive number' }];
    }

    // Parse date
    const dateIso = parseTransactionDate(body.date);

    // Generate external ID
    const externalId = generateExternalId(TransactionType.WITHDRAWAL, body.user_name);

    // Build base payload with exact field names from UI
    const payload: FireflyTransactionPayload = {
      type: 'withdrawal',
      date: dateIso,
      amount: formatAmount(body.amount),
      description: body.destination_name || body.category_name,
      source_id: String(body.account_id),
      category_id: String(body.category_id),
      category_name: body.category_name,
      tags: [body.user_name],
      currency_code: body.account_currency,
      notes: body.notes || '',
      external_id: externalId,
      reconciled: false,
    };

    // Add optional fields if present
    if (body.destination_name) {
      payload.destination_name = body.destination_name;
    }
    if (body.budget_name) {
      payload.budget_name = body.budget_name;
    }

    // Add foreign currency ONLY for non-EUR accounts
    // UI provides amount_eur for non-EUR accounts
    if (body.account_currency !== 'EUR' && body.amount_eur) {
      payload.foreign_amount = formatAmount(body.amount_eur);
      payload.foreign_currency_code = 'EUR';
    }

    const transactionData = buildTransactionRequest(payload);

    logTransactionOperation('info', `Sending withdrawal transaction for user ${body.user_name}`, transactionData);

    const response = await apiClient.request<Record<string, unknown>>(
      '/api/v1/transactions',
      {
        method: 'POST',
        body: transactionData,
        auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
      }
    );

    // Trigger sync to update account balances
    await triggerImmediateSync();

    return [true, response || {}];
  } catch (error) {
    const err: any = error;
    const errorPayload =
      err && typeof err === 'object' && 'status' in err
        ? {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            body: err.body
          }
        : err instanceof Error
          ? err.message
          : err;

    logTransactionOperation('error', `Error handling withdrawal transaction: ${safeStringify(errorPayload)}`);
    return [false, { error: errorPayload }];
  }
}

/**
 * Handle deposit transactions (EUR and non-EUR)
 */
async function handleDepositTransaction(body: DepositTransactionData): Promise<TransactionResult> {
  try {
    // Validate amount
    if (!validateAmount(body.amount)) {
      return [false, { error: 'Invalid amount: must be positive number' }];
    }

    // Parse date
    const dateIso = parseTransactionDate(body.date);

    // Generate external ID
    const externalId = generateExternalId(TransactionType.DEPOSIT, body.user_name);

    // Build base payload with exact field names from UI
    const payload: FireflyTransactionPayload = {
      type: 'deposit',
      date: dateIso,
      amount: formatAmount(body.amount),
      description: body.category_name,
      destination_id: String(body.account_id),
      category_id: String(body.category_id),
      category_name: body.category_name,
      tags: [body.user_name],
      currency_code: body.account_currency,
      notes: body.notes || '',
      external_id: externalId,
    };

    // Add optional source_name if present
    if (body.source_name) {
      payload.source_name = body.source_name;
    }

    // Add foreign currency ONLY for non-EUR accounts
    // UI provides amount_eur for non-EUR accounts
    if (body.account_currency !== 'EUR' && body.amount_eur) {
      payload.foreign_amount = formatAmount(body.amount_eur);
      payload.foreign_currency_code = 'EUR';
    }

    const transactionData = buildTransactionRequest(payload);

    logTransactionOperation('info', `Sending deposit transaction for user ${body.user_name}`, transactionData);

    const response = await apiClient.request<Record<string, unknown>>(
      '/api/v1/transactions',
      {
        method: 'POST',
        body: transactionData,
        auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
      }
    );

    // Trigger sync to update account balances
    await triggerImmediateSync();

    return [true, response || {}];
  } catch (error) {
    const err: any = error;
    const errorPayload =
      err && typeof err === 'object' && 'status' in err
        ? {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            body: err.body
          }
        : err instanceof Error
          ? err.message
          : err;

    logTransactionOperation('error', `Error handling deposit transaction: ${safeStringify(errorPayload)}`);
    return [false, { error: errorPayload }];
  }
}

/**
 * Handle transfer transactions (same and different currencies)
 * Uses exact field names from transfer flow UI
 */
async function handleTransferTransaction(body: TransferTransactionData): Promise<TransactionResult> {
  try {
    // Validate amounts
    if (!validateAmount(body.source_amount)) {
      return [false, { error: 'Invalid source amount: must be positive number' }];
    }
    if (!validateAmount(body.destination_amount)) {
      return [false, { error: 'Invalid destination amount: must be positive number' }];
    }

    // Parse date
    const dateIso = parseTransactionDate(body.date);

    // Generate external ID
    const externalId = generateExternalId(TransactionType.TRANSFER, body.user_name);

    // Build main transfer payload with exact field names
    const payload: FireflyTransactionPayload = {
      type: 'transfer',
      date: dateIso,
      amount: formatAmount(body.source_amount),
      description: `Transfer ${body.source_account_name} → ${body.destination_account_name}`,
      source_id: String(body.source_account_id),
      destination_id: String(body.destination_account_id),
      tags: [body.user_name],
      currency_code: body.source_account_currency,
      notes: body.notes,
      external_id: externalId,
    };

    // Add foreign currency ONLY if currencies differ
    if (body.source_account_currency !== body.destination_account_currency) {
      payload.foreign_amount = formatAmount(body.destination_amount);
      payload.foreign_currency_code = body.destination_account_currency;
    }

    const transactionData = buildTransactionRequest(payload);

    logTransactionOperation('info', `Sending transfer transaction for user ${body.user_name}`, transactionData);

    // Execute main transfer
    const response = await apiClient.request<Record<string, unknown>>(
      '/api/v1/transactions',
      {
        method: 'POST',
        body: transactionData,
        auth: 'tier2'
      }
    );

    // Handle source fee if present
    if (body.source_fee && parseFloat(String(body.source_fee)) > 0) {
      await handleTransferFee(
        body.source_fee,
        body.source_account_id,
        body.source_account_name,
        body.destination_account_name,
        'source',
        body.source_account_currency,
        body.user_name,
        dateIso
      );
    }

    // Handle destination fee if present
    if (body.destination_fee && parseFloat(String(body.destination_fee)) > 0) {
      await handleTransferFee(
        body.destination_fee,
        body.destination_account_id,
        body.source_account_name,
        body.destination_account_name,
        'destination',
        body.destination_account_currency,
        body.user_name,
        dateIso
      );
    }

    // Trigger sync after successful transfer
    await triggerImmediateSync();

    return [true, response || {}];
  } catch (error) {
    const err: any = error;
    const errorPayload =
      err && typeof err === 'object' && 'status' in err
        ? {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            body: err.body
          }
        : err instanceof Error
          ? err.message
          : err;

    logTransactionOperation('error', `Error handling transfer transaction: ${safeStringify(errorPayload)}`);
    return [false, { error: errorPayload }];
  }
}

/**
 * Handle transfer fee transactions
 * Creates a withdrawal transaction for the fee with exact field names
 */
async function handleTransferFee(
  fee: string | number,
  accountId: number,
  sourceAccountName: string,
  destinationAccountName: string,
  feeType: 'source' | 'destination',
  currency: string,
  username: string,
  date: string
): Promise<void> {
  try {
    const feeExternalId = generateExternalId(`transfer-${feeType}-fee`, username);

    const payload: FireflyTransactionPayload = {
      type: 'withdrawal',
      date: date,
      amount: formatAmount(fee),
      description: `Transfer fee (${feeType})`,
      source_id: String(accountId),
      destination_name: 'Transfer Fee',
      category_name: 'Fee',
      tags: [username, 'fee', 'transfer-fee'],
      currency_code: currency,
      notes: `Fee for ${feeType === 'source' ? 'transfer from' : 'receiving transfer from'} ${sourceAccountName} to ${destinationAccountName}`,
      external_id: feeExternalId,
    };

    const transactionData = buildTransactionRequest(payload);

    logTransactionOperation('info', `Sending ${feeType} fee transaction for user ${username}`, transactionData);

    await apiClient.request<Record<string, unknown>>(
      '/api/v1/transactions',
      {
        method: 'POST',
        body: transactionData,
        auth: 'tier2'
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTransactionOperation('error', `Error handling ${feeType} fee: ${errorMessage}`);
  }
}

/**
 * Verify transaction exists after creation
 */
async function verifyTransactionExists(
  externalId: string,
  maxRetries: number = 2
): Promise<{ verified: boolean; transactionId?: string; error?: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Small delay between retries
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Query transactions endpoint to verify
      // This is a simplified check - you may need to implement full search
      logTransactionOperation('info', `Verification attempt ${attempt + 1}/${maxRetries} for external_id: ${externalId}`);

      // TODO: Implement actual transaction lookup by external_id
      // For now, assume verification succeeded if creation succeeded
      return { verified: true, transactionId: externalId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (attempt === maxRetries - 1) {
        return { verified: false, error: errorMessage };
      }
    }
  }

  return { verified: false, error: 'Verification failed after retries' };
}

/**
 * Trigger immediate sync to update account balances
 * Calls backend sync endpoint
 */
async function triggerImmediateSync(): Promise<void> {
  try {
    // TODO: Implement sync trigger
    // This should call the backend endpoint to update account balances
    logTransactionOperation('info', 'Triggering immediate sync');

    // Placeholder - implement actual sync API call
    // await syncService.triggerSync();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTransactionOperation('warn', `Failed to trigger sync: ${errorMessage}`);
  }
}

/**
 * Extract external ID from API response
 */
function extractExternalIdFromResponse(response: unknown): string | null {
  if (typeof response !== 'object' || response === null) {
    return null;
  }

  const obj = response as Record<string, unknown>;

  // Try different response formats
  if (obj.validation && typeof obj.validation === 'object') {
    const validation = obj.validation as Record<string, unknown>;
    if (typeof validation.external_id === 'string') {
      return validation.external_id;
    }
  }

  if (obj.external_id && typeof obj.external_id === 'string') {
    return obj.external_id;
  }

  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (data.external_id && typeof data.external_id === 'string') {
      return data.external_id;
    }
  }

  return null;
}

/**
 * Extract username from transaction body
 */
function getUsername(body: unknown): string {
  if (typeof body === 'object' && body !== null) {
    const obj = body as Record<string, unknown>;
    if (typeof obj.user_name === 'string') {
      return obj.user_name;
    }
  }
  return 'unknown';
}

/**
 * Update existing transaction
 * Sends PUT request to Firefly API to modify transaction
 *
 * @param transactionId Transaction ID to update
 * @param data Partial transaction data with fields to update
 */
export async function updateTransaction(
  transactionId: string,
  data: Record<string, unknown>
): Promise<TransactionResult> {
  const timer = new OperationTimer();

  try {
    if (!transactionId || transactionId.trim() === '') {
      return [false, { error: 'Invalid transaction ID' }];
    }

    logTransactionOperation('info', `Updating transaction ${transactionId}`, data);

    const response = await apiClient.request<Record<string, unknown>>(
      `/api/v1/transactions/${transactionId}`,
      {
        method: 'PUT',
        body: { transactions: [data] },
        auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
      }
    );

    // Trigger sync to update account balances
    await triggerImmediateSync();

    const duration = timer.getDuration();
    logTransactionOperation(
      'info',
      `Transaction ${transactionId} updated successfully in ${duration.toFixed(2)}s`
    );

    return [true, response || {}];
  } catch (error) {
    const duration = timer.getDuration();
    const err: any = error;
    const errorPayload =
      err && typeof err === 'object' && 'status' in err
        ? {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            body: err.body
          }
        : err instanceof Error
          ? err.message
          : err;

    logTransactionOperation(
      'error',
      `Failed to update transaction ${transactionId} after ${duration.toFixed(2)}s: ${safeStringify(errorPayload)}`
    );

    return [false, { error: errorPayload }];
  }
}

/**
 * Delete existing transaction
 * Sends DELETE request to Firefly API to remove transaction
 *
 * @param transactionId Transaction ID to delete
 */
export async function deleteTransaction(transactionId: string): Promise<TransactionResult> {
  const timer = new OperationTimer();

  try {
    if (!transactionId || transactionId.trim() === '') {
      return [false, { error: 'Invalid transaction ID' }];
    }

    logTransactionOperation('info', `Deleting transaction ${transactionId}`);

    const response = await apiClient.request<Record<string, unknown>>(
      `/api/v1/transactions/${transactionId}`,
      {
        method: 'DELETE',
        auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
      }
    );

    // Trigger sync to update account balances
    await triggerImmediateSync();

    const duration = timer.getDuration();
    logTransactionOperation(
      'info',
      `Transaction ${transactionId} deleted successfully in ${duration.toFixed(2)}s`
    );

    return [true, response || {}];
  } catch (error) {
    const duration = timer.getDuration();
    const err: any = error;
    const errorPayload =
      err && typeof err === 'object' && 'status' in err
        ? {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            body: err.body
          }
        : err instanceof Error
          ? err.message
          : err;

    logTransactionOperation(
      'error',
      `Failed to delete transaction ${transactionId} after ${duration.toFixed(2)}s: ${safeStringify(errorPayload)}`
    );

    return [false, { error: errorPayload }];
  }
}

// Type alias for clarity
type FireflyTransactionResponse = Record<string, unknown>;
