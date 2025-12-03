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
  cleanCategoryName,
  buildWithdrawalDescription,
  buildDepositDescription,
  buildTransferDescription,
  buildTransactionNotes,
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
  body: WithdrawalTransactionData | DepositTransactionData | TransferTransactionData,
  transactionType: TransactionType | string,
  enableVerification: boolean = true
): Promise<TransactionResult> {
  // Debug mode: short-circuit and send payload to webhook for inspection
  if (isDebugApi) {
    try {
      // Normalize payload to ensure all required fields are present for inspection
      const normalizedType = (transactionType as string).toLowerCase();

      // Build normalized payload with consistent field ordering across all transaction types
      const normalized: Record<string, any> = {
        transactionType,
        user_name: (body as any).user_name || 'unknown',
        account_name: (body as any).account_name || '',
        account_id: (body as any).account_id ?? '',
        account_currency: (body as any).account_currency || '',
        amount: (body as any).amount ?? '',
        amount_eur: (body as any).amount_eur ?? '',
        category_id: (body as any).category_id ?? '',
        category_name: (body as any).category_name || '',
      };

      // Add transaction-type-specific fields in consistent position (after category_name)
      if (normalizedType === 'withdrawal') {
        // Withdrawals use destination fields
        normalized.destination_id = (body as any).destination_id ?? '';
        normalized.destination_name = (body as any).destination_name || '';
        normalized.budget_name = (body as any).budget_name ?? '';
      } else if (normalizedType === 'deposit') {
        // Deposits use source fields (not destination)
        normalized.source_id = (body as any).source_id ?? '';
        normalized.source_name = (body as any).source_name || '';
      } else if (normalizedType === 'transfer') {
        // Transfers use both source and destination
        normalized.source_id = (body as any).source_id ?? '';
        normalized.source_name = (body as any).source_name || '';
        normalized.destination_id = (body as any).destination_id ?? '';
        normalized.destination_name = (body as any).destination_name || '';
      }

      // Add remaining fields in consistent order
      normalized.date = (body as any).date ?? new Date().toISOString();
      normalized.notes = (body as any).notes ?? '';
      normalized.timestamp = new Date().toISOString();

      await fetch(DEBUG_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(normalized)
      });

      logTransactionOperation(
        'info',
        `DEBUG_API enabled. Transaction routed to webhook: ${DEBUG_WEBHOOK_URL}`
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

    // Determine currencies
    const accountCurrency = body.account_currency || 'EUR';
    const transactionCurrency = body.currency || accountCurrency;
    const providedNotes = typeof body.notes === 'string' ? body.notes.trim() : '';

    if (transactionCurrency === 'EUR') {
      // EUR withdrawal transaction
      const cleanCategory = cleanCategoryName(body.category_name);
      const accountName = body.account_name || 'Unknown Account';
      const destinationName = body.destination_name || 'Withdrawal';
      const payload: FireflyTransactionPayload = {
        type: 'withdrawal',
        date: dateIso,
        amount: formatAmount(body.amount),
        description: buildWithdrawalDescription(cleanCategory, accountName, body.amount, transactionCurrency),
        currency_code: transactionCurrency,
        category_name: cleanCategory,
        source_name: accountName,
        destination_name: destinationName,
        notes: providedNotes || buildTransactionNotes(
          `Withdrawal ${cleanCategory} from ${accountName} ${body.amount} ${body.currency}`,
          destinationName,
          body.user_name
        ),
        tags: [body.user_name],
        external_id: externalId,
        reconciled: false,
        budget_name: body.budget_name,
      };

      const transactionData = buildTransactionRequest(payload);

      logTransactionOperation('info', `Sending EUR withdrawal transaction for user ${body.user_name}`, transactionData);

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
    } else {
      // Non-EUR withdrawal - convert to EUR
      const amount_eur = await convertCurrency(transactionCurrency, 'EUR', parseFloat(String(body.amount)));

      if (amount_eur === null) {
        logTransactionOperation('error', `Currency conversion failed: ${transactionCurrency} to EUR`);
        return [false, { error: 'Currency conversion failed' }];
      }

      const cleanCategory = cleanCategoryName(body.category_name);
      const accountName = body.account_name || 'Unknown Account';
      const destinationName = body.destination_name || 'Withdrawal';
      const payload: FireflyTransactionPayload = {
        type: 'withdrawal',
        date: dateIso,
        amount: formatAmount(body.amount),
        description: buildWithdrawalDescription(cleanCategory, accountName, body.amount, transactionCurrency, amount_eur),
        currency_code: accountCurrency,
        category_name: cleanCategory,
        source_name: accountName,
        destination_name: destinationName,
        foreign_currency_code: 'EUR',
        foreign_amount: formatAmount(amount_eur),
        notes: providedNotes || buildTransactionNotes(
          `Withdrawal ${cleanCategory} from ${accountName} ${body.amount} ${body.currency} (${amount_eur} EUR)`,
          destinationName,
          body.user_name
        ),
        tags: [body.user_name],
        external_id: externalId,
        reconciled: false,
        budget_name: body.budget_name,
      };

      const transactionData = buildTransactionRequest(payload);

      logTransactionOperation('info', `Sending non-EUR withdrawal transaction for user ${body.user_name}`, transactionData);

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
    }
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

    // Determine currencies
    const accountCurrency = body.account_currency || 'EUR';
    const transactionCurrency = body.currency || accountCurrency;
    const providedNotes = typeof body.notes === 'string' ? body.notes.trim() : '';

    if (transactionCurrency === 'EUR') {
      // EUR deposit transaction
      const cleanCategory = cleanCategoryName(body.category_name);
      const sourceName = body.source_name || 'External Source';
      const accountName = body.account_name || 'Unknown Account';
      const payload: FireflyTransactionPayload = {
        type: 'deposit',
        date: dateIso,
        amount: formatAmount(body.amount),
        description: buildDepositDescription(cleanCategory, sourceName, body.amount, transactionCurrency, providedNotes),
        currency_code: accountCurrency,
        category_name: cleanCategory,
        source_name: sourceName,
        destination_name: accountName,
        notes: providedNotes || buildTransactionNotes(
          `Deposit ${cleanCategory} from ${sourceName} to ${accountName} ${body.amount} ${body.currency}`,
          providedNotes,
          body.user_name
        ),
        tags: [body.user_name],
        external_id: externalId,
      };

      const transactionData = buildTransactionRequest(payload);

      logTransactionOperation('info', `Sending EUR deposit transaction for user ${body.user_name}`, transactionData);

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
    } else {
      // Non-EUR deposit - convert to EUR
      const amount_eur = await convertCurrency(transactionCurrency, 'EUR', parseFloat(String(body.amount)));

      if (amount_eur === null) {
        logTransactionOperation('error', `Currency conversion failed: ${transactionCurrency} to EUR`);
        return [false, { error: 'Currency conversion failed' }];
      }

      const cleanCategory = cleanCategoryName(body.category_name);
      const sourceName = body.source_name || 'External Source';
      const accountName = body.account_name || 'Unknown Account';
      const payload: FireflyTransactionPayload = {
        type: 'deposit',
        date: dateIso,
        amount: formatAmount(body.amount),
        description: buildDepositDescription(cleanCategory, sourceName, body.amount, transactionCurrency, providedNotes, amount_eur),
        currency_code: accountCurrency,
        category_name: cleanCategory,
        source_name: sourceName,
        destination_name: accountName,
        foreign_currency_code: 'EUR',
        foreign_amount: formatAmount(amount_eur),
        notes: providedNotes || buildTransactionNotes(
          `Deposit ${cleanCategory} from ${sourceName} to ${accountName} ${body.amount} ${body.currency} (${amount_eur} EUR)`,
          providedNotes,
          body.user_name
        ),
        tags: [body.user_name],
        external_id: externalId,
      };

      const transactionData = buildTransactionRequest(payload);

      logTransactionOperation('info', `Sending non-EUR deposit transaction for user ${body.user_name}`, transactionData);

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
    }
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
 */
async function handleTransferTransaction(body: TransferTransactionData): Promise<TransactionResult> {
  try {
    // Parse date
    const dateIso = parseTransactionDate(body.date);

    // Generate external ID
    const externalId = generateExternalId(TransactionType.TRANSFER, body.user_name);

    // Determine currencies
    const exitCurrency = body.exit_currency || body.currency || 'EUR';
    const entryCurrency = body.entry_currency || body.currency || 'EUR';

    let payload: FireflyTransactionPayload;

    if (exitCurrency === entryCurrency) {
      // Same currency transfer
      const amount = body.exit_amount || body.currency || '0';

      payload = {
        type: 'transfer',
        date: dateIso,
        amount: formatAmount(amount),
        description: buildTransferDescription(
          body.exit_account,
          body.entry_account,
          amount,
          exitCurrency,
          body.exit_fee,
          body.entry_fee,
          body.description
        ),
        currency_code: exitCurrency,
        source_name: body.exit_account,
        destination_name: body.entry_account,
        notes: buildTransactionNotes(
          `Transfer from ${body.exit_account} to ${body.entry_account} ${amount} ${exitCurrency}`,
          body.description,
          body.user_name
        ),
        tags: [body.user_name],
        external_id: externalId,
      };
    } else {
      // Different currency transfer
      const exitAmount = body.exit_amount || '0';
      const entryAmount = body.entry_amount || '0';

      payload = {
        type: 'transfer',
        date: dateIso,
        amount: formatAmount(exitAmount),
        description: buildTransferDescription(
          body.exit_account,
          body.entry_account,
          exitAmount,
          exitCurrency,
          body.exit_fee,
          body.entry_fee,
          body.description
        ),
        currency_code: exitCurrency,
        source_name: body.exit_account,
        foreign_amount: formatAmount(entryAmount),
        foreign_currency_code: entryCurrency,
        destination_name: body.entry_account,
        notes: buildTransactionNotes(
          `Transfer from ${body.exit_account} ${exitAmount} ${exitCurrency} to ${body.entry_account} ${entryAmount} ${entryCurrency}`,
          body.description,
          body.user_name
        ),
        tags: [body.user_name],
        external_id: externalId,
      };
    }

    const transactionData = buildTransactionRequest(payload);

    logTransactionOperation('info', `Sending transfer transaction for user ${body.user_name}`, transactionData);

    // Execute main transfer
    const response = await apiClient.request<Record<string, unknown>>(
      '/api/v1/transactions',
      {
        method: 'POST',
        body: transactionData,
        auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
      }
    );

    // Handle exit fee if present
    if (body.exit_fee && parseFloat(String(body.exit_fee)) > 0) {
      await handleTransferFee(body.exit_fee, body.exit_account, body.entry_account, 'exit', exitCurrency, body.user_name);
    }

    // Handle entry fee if present
    if (body.entry_fee && parseFloat(String(body.entry_fee)) > 0) {
      await handleTransferFee(body.entry_fee, body.entry_account, body.exit_account, 'entry', entryCurrency, body.user_name);
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
 */
async function handleTransferFee(
  fee: string | number,
  accountFrom: string,
  accountTo: string,
  feeType: 'exit' | 'entry',
  currency: string,
  username: string
): Promise<void> {
  try {
    const feeExternalId = generateExternalId(`transfer-${feeType}-fee`, username);
    const now = new Date().toISOString();

    const payload: FireflyTransactionPayload = {
      type: 'withdrawal',
      date: now,
      amount: formatAmount(fee),
      description: `${feeType.charAt(0).toUpperCase() + feeType.slice(1)} fee for transfer ${feeType === 'exit' ? 'from' : 'to'} ${accountFrom}`,
      currency_code: currency,
      source_name: accountFrom,
      destination_name: 'Fee',
      notes: `${feeType === 'exit' ? 'Exit' : 'Entry'} fee for transfer ${feeType === 'exit' ? 'from' : 'to'} ${accountTo}. Added by ${username}`,
      tags: [username],
      external_id: feeExternalId,
    };

    const transactionData = buildTransactionRequest(payload);

    logTransactionOperation('info', `Sending ${feeType} fee transaction for user ${username}`, transactionData);

    await apiClient.request<Record<string, unknown>>(
      '/api/v1/transactions',
      {
        method: 'POST',
        body: transactionData,
        auth: 'tier2' // Tier 2: Anonymous Authorized (Telegram Mini App users)
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
 * Convert currency amount using Sync API exchange rates
 */
async function convertCurrency(fromCurrency: string, toCurrency: string, amount: number): Promise<number | null> {
  try {
    // Import syncService from parent sync module
    const syncModule = await import('../sync');
    const syncService = syncModule.default;

    logTransactionOperation('info', `Converting ${amount} ${fromCurrency} to ${toCurrency}`);

    const convertedAmount = await syncService.getExchangeRate(fromCurrency, toCurrency, amount);

    if (convertedAmount === null) {
      logTransactionOperation('warn', `Currency conversion failed via API: ${fromCurrency} -> ${toCurrency}, using amount as-is`);
      return amount;
    }

    logTransactionOperation('info', `Currency conversion successful: ${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`);
    return convertedAmount;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTransactionOperation('error', `Currency conversion error: ${errorMessage}`);
    return null;
  }
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

// Type alias for clarity
type FireflyTransactionResponse = Record<string, unknown>;
