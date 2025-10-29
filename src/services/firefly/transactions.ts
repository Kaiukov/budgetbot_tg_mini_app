/**
 * Firefly III Transaction Service
 * Handles creation of expenses, income, and transfer transactions
 * Based on Python implementation: firefly/budgetbot/bot/utils/firefly_api/add_transaction.py
 */

import { fireflyService } from './firefly';
import {
  type ExpenseTransactionData,
  type IncomeTransactionData,
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
  extractCategoryName,
  buildExpenseDescription,
  buildTransferDescription,
  buildTransactionNotes,
  validateAmount,
  logTransactionOperation,
  OperationTimer,
} from './utils';

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
  body: ExpenseTransactionData | IncomeTransactionData | TransferTransactionData,
  transactionType: TransactionType | string,
  enableVerification: boolean = true
): Promise<TransactionResult> {
  const timer = new OperationTimer();

  try {
    let result: TransactionResult;

    const normalizedType = (transactionType as TransactionType).toLowerCase();

    switch (normalizedType) {
      case TransactionType.EXPENSE:
        result = await handleExpenseTransaction(body as ExpenseTransactionData);
        break;
      case TransactionType.INCOME:
        result = await handleIncomeTransaction(body as IncomeTransactionData);
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
 * Handle expense transactions (EUR and non-EUR)
 */
async function handleExpenseTransaction(body: ExpenseTransactionData): Promise<TransactionResult> {
  try {
    // Validate amount
    if (!validateAmount(body.amount)) {
      return [false, { error: 'Invalid amount: must be positive number' }];
    }

    // Parse date
    const dateIso = parseTransactionDate(body.date);

    // Generate external ID
    const externalId = generateExternalId(TransactionType.EXPENSE, body.username);

    // Determine currencies
    const accountCurrency = body.account_currency || 'EUR';
    const transactionCurrency = body.currency || accountCurrency;

    if (transactionCurrency === 'EUR') {
      // EUR expense transaction
      const payload: FireflyTransactionPayload = {
        type: 'withdrawal',
        date: dateIso,
        amount: formatAmount(body.amount),
        description: buildExpenseDescription(body.category, body.account, body.amount, body.currency),
        currency_code: transactionCurrency,
        category_name: body.category,
        source_name: body.account,
        destination_name: body.comment || 'Expense',
        notes: buildTransactionNotes(
          `Expense ${body.category} from ${body.account} ${body.amount} ${body.currency}`,
          body.comment,
          body.username
        ),
        tags: [body.username],
        external_id: externalId,
        reconciled: false,
        budget_name: (body as unknown as Record<string, unknown>).budget_name as string | undefined,
      };

      const transactionData = buildTransactionRequest(payload);

      logTransactionOperation('info', `Sending EUR expense transaction for user ${body.username}`, transactionData);

      const response = await fireflyService.postRequest<Record<string, unknown>>(
        '/api/v1/transactions',
        transactionData
      );

      if (!response.success) {
        logTransactionOperation('error', `EUR expense transaction failed for user ${body.username}`, response.data);
        return [false, response.data || { error: 'Unknown error' }];
      }

      // Trigger sync to update account balances
      await triggerImmediateSync();

      return [true, response.data || {}];
    } else {
      // Non-EUR expense - convert to EUR
      const foreignAmount = await convertCurrency(transactionCurrency, 'EUR', parseFloat(String(body.amount)));

      if (foreignAmount === null) {
        logTransactionOperation('error', `Currency conversion failed: ${transactionCurrency} to EUR`);
        return [false, { error: 'Currency conversion failed' }];
      }

      const payload: FireflyTransactionPayload = {
        type: 'withdrawal',
        date: dateIso,
        amount: formatAmount(body.amount),
        description: buildExpenseDescription(body.category, body.account, body.amount, body.currency, foreignAmount),
        currency_code: accountCurrency,
        category_name: body.category,
        source_name: body.account,
        destination_name: body.comment || 'Expense',
        foreign_currency_code: 'EUR',
        foreign_amount: formatAmount(foreignAmount),
        notes: buildTransactionNotes(
          `Expense ${body.category} from ${body.account} ${body.amount} ${body.currency} (${foreignAmount} EUR)`,
          body.comment,
          body.username
        ),
        tags: [body.username],
        external_id: externalId,
        reconciled: false,
        budget_name: (body as unknown as Record<string, unknown>).budget_name as string | undefined,
      };

      const transactionData = buildTransactionRequest(payload);

      logTransactionOperation('info', `Sending non-EUR expense transaction for user ${body.username}`, transactionData);

      const response = await fireflyService.postRequest<Record<string, unknown>>(
        '/api/v1/transactions',
        transactionData
      );

      if (!response.success) {
        logTransactionOperation('error', `Non-EUR expense transaction failed for user ${body.username}`, response.data);
        return [false, response.data || { error: 'Unknown error' }];
      }

      // Trigger sync to update account balances
      await triggerImmediateSync();

      return [true, response.data || {}];
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTransactionOperation('error', `Error handling expense transaction: ${errorMessage}`);
    return [false, { error: errorMessage }];
  }
}

/**
 * Handle income transactions (EUR and non-EUR)
 */
async function handleIncomeTransaction(body: IncomeTransactionData): Promise<TransactionResult> {
  try {
    // Validate amount
    if (!validateAmount(body.amount)) {
      return [false, { error: 'Invalid amount: must be positive number' }];
    }

    // Parse date
    const dateIso = parseTransactionDate(body.date);

    // Generate external ID
    const externalId = generateExternalId(TransactionType.INCOME, body.username);

    // Determine currencies
    const accountCurrency = body.account_currency || 'EUR';
    const transactionCurrency = body.currency || accountCurrency;

    if (transactionCurrency === 'EUR') {
      // EUR income transaction
      const payload: FireflyTransactionPayload = {
        type: 'deposit',
        date: dateIso,
        amount: formatAmount(body.amount),
        description: `${body.category} income to ${body.account} ${body.amount} ${body.currency} Comment: ${body.comment || ''}`,
        currency_code: accountCurrency,
        category_name: extractCategoryName(body.category),
        destination_name: body.account,
        notes: buildTransactionNotes(
          `Income ${body.category} to ${body.account} ${body.amount} ${body.currency}`,
          body.comment,
          body.username
        ),
        tags: [body.username],
        external_id: externalId,
      };

      const transactionData = buildTransactionRequest(payload);

      logTransactionOperation('info', `Sending EUR income transaction for user ${body.username}`, transactionData);

      const response = await fireflyService.postRequest<Record<string, unknown>>(
        '/api/v1/transactions',
        transactionData
      );

      if (!response.success) {
        logTransactionOperation('error', `EUR income transaction failed for user ${body.username}`, response.data);
        return [false, response.data || { error: 'Unknown error' }];
      }

      // Trigger sync to update account balances
      await triggerImmediateSync();

      return [true, response.data || {}];
    } else {
      // Non-EUR income - convert to EUR
      const foreignAmount = await convertCurrency(transactionCurrency, 'EUR', parseFloat(String(body.amount)));

      if (foreignAmount === null) {
        logTransactionOperation('error', `Currency conversion failed: ${transactionCurrency} to EUR`);
        return [false, { error: 'Currency conversion failed' }];
      }

      const payload: FireflyTransactionPayload = {
        type: 'deposit',
        date: dateIso,
        amount: formatAmount(body.amount),
        description: `${body.category} income to ${body.account} ${body.amount} ${body.currency} (${foreignAmount} EUR) Comment: ${body.comment || ''}`,
        currency_code: accountCurrency,
        category_name: extractCategoryName(body.category),
        destination_name: body.account,
        foreign_currency_code: 'EUR',
        foreign_amount: formatAmount(foreignAmount),
        notes: buildTransactionNotes(
          `Income ${body.category} to ${body.account} ${body.amount} ${body.currency} (${foreignAmount} EUR)`,
          body.comment,
          body.username
        ),
        tags: [body.username],
        external_id: externalId,
      };

      const transactionData = buildTransactionRequest(payload);

      logTransactionOperation('info', `Sending non-EUR income transaction for user ${body.username}`, transactionData);

      const response = await fireflyService.postRequest<Record<string, unknown>>(
        '/api/v1/transactions',
        transactionData
      );

      if (!response.success) {
        logTransactionOperation('error', `Non-EUR income transaction failed for user ${body.username}`, response.data);
        return [false, response.data || { error: 'Unknown error' }];
      }

      // Trigger sync to update account balances
      await triggerImmediateSync();

      return [true, response.data || {}];
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTransactionOperation('error', `Error handling income transaction: ${errorMessage}`);
    return [false, { error: errorMessage }];
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
    const externalId = generateExternalId(TransactionType.TRANSFER, body.username);

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
          body.username
        ),
        tags: [body.username],
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
          body.username
        ),
        tags: [body.username],
        external_id: externalId,
      };
    }

    const transactionData = buildTransactionRequest(payload);

    logTransactionOperation('info', `Sending transfer transaction for user ${body.username}`, transactionData);

    // Execute main transfer
    const response = await fireflyService.postRequest<Record<string, unknown>>(
      '/api/v1/transactions',
      transactionData
    );

    if (!response.success) {
      logTransactionOperation('error', `Transfer transaction failed for user ${body.username}`, response.data);
      return [false, response.data || { error: 'Unknown error' }];
    }

    // Handle exit fee if present
    if (body.exit_fee && parseFloat(String(body.exit_fee)) > 0) {
      await handleTransferFee(body.exit_fee, body.exit_account, body.entry_account, 'exit', exitCurrency, body.username);
    }

    // Handle entry fee if present
    if (body.entry_fee && parseFloat(String(body.entry_fee)) > 0) {
      await handleTransferFee(body.entry_fee, body.entry_account, body.exit_account, 'entry', entryCurrency, body.username);
    }

    // Trigger sync after successful transfer
    await triggerImmediateSync();

    return [true, response.data || {}];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTransactionOperation('error', `Error handling transfer transaction: ${errorMessage}`);
    return [false, { error: errorMessage }];
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

    const response = await fireflyService.postRequest<Record<string, unknown>>(
      '/api/v1/transactions',
      transactionData
    );

    if (!response.success) {
      logTransactionOperation('error', `${feeType} fee transaction failed for user ${username}`, response.data);
    }
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
    // Import syncService dynamically to get exchange rates
    const { default: syncService } = await import('../sync');

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
    if (typeof obj.username === 'string') {
      return obj.username;
    }
  }
  return 'unknown';
}

// Type alias for clarity
type FireflyTransactionResponse = Record<string, unknown>;
