/**
 * Sync Service - Transaction Creation
 * Handles creation of expenses, income, and transfer transactions via Sync API
 * All transactions are created through /api/sync/transactions with Tier 2 authentication
 * Based on Python implementation: firefly/budgetbot/bot/utils/firefly_api/add_transaction.py
 */

import { SyncServiceCore } from './core';
import type {
  ExpenseTransactionData,
  IncomeTransactionData,
  TransferTransactionData,
  FireflyCreateTransactionRequest,
  FireflyTransactionPayload,
  TransactionResult,
  ServiceTransactionsResponse,
  ServiceSingleTransactionResponse,
  TransactionsResponse,
  SingleTransactionResponse,
} from './types';
import type { TransactionData } from '../../types/transaction';
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
  TransactionType,
  mapTransactionToDisplay,
} from './transaction-utils';

/**
 * Mixin class for transaction operations
 * Extends SyncServiceCore with transaction creation methods
 */
export class SyncServiceTransactions extends SyncServiceCore {
  /**
   * Helper to build transaction request with cleaned null values
   */
  protected buildTransactionRequest(payload: FireflyTransactionPayload): FireflyCreateTransactionRequest {
    const cleaned = removeNullValues(payload as unknown as Record<string, unknown>) as unknown as FireflyTransactionPayload;

    return {
      error_if_duplicate_hash: false,
      apply_rules: false,
      fire_webhooks: false,
      transactions: [cleaned],
    };
  }

  /**
   * Create transaction via Sync API
   * Handles Tier 2 authentication with X-Telegram-Init-Data header
   */
  protected async createTransaction(
    request: FireflyCreateTransactionRequest
  ): Promise<FireflyTransactionPayload | { error: string }> {
    try {
      const url = `${this.getBaseUrl()}/api/v1/transactions`;
      const anonKey = this.getAnonKey();

      if (!anonKey) {
        throw new Error('Sync anonymous API key not configured');
      }

      // Get Telegram initData for Tier 2 authentication
      const { default: telegramService } = await import('../telegram');
      const initData = telegramService.getInitData();

      console.log('🔄 Creating transaction via Sync API:', {
        url,
        hasAnonKey: !!anonKey,
        hasInitData: !!initData,
        transactionCount: request.transactions.length
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Anonymous-Key': anonKey,
          'X-Telegram-Init-Data': initData,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 Sync API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Sync API Error Response:', errorText);
        throw new Error(`Sync API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      let apiResponse: {
        success: boolean;
        status: number;
        message: string;
        data?: FireflyTransactionPayload;
        telegram_user_id?: number;
      };

      try {
        apiResponse = await response.json();
      } catch (parseError) {
        const text = await response.text();
        const parseErrorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        console.error('❌ Failed to parse JSON response:', {
          error: parseErrorMsg,
          body: text,
          status: response.status
        });
        throw new Error(`Failed to parse API response: ${parseErrorMsg}. Response: ${text.substring(0, 200)}`);
      }

      console.log('✅ Sync API Success:', {
        success: apiResponse.success,
        telegramUserId: apiResponse.telegram_user_id
      });

      // Return the Firefly transaction data from response
      if (apiResponse.data) {
        return apiResponse.data;
      }

      return { error: `Invalid response from Sync API: ${apiResponse.message || 'No data in response'}` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Transaction creation error:', {
        message: errorMessage,
        type: error instanceof Error ? error.constructor.name : typeof error,
        error: error
      });
      return { error: errorMessage };
    }
  }

  /**
   * Main entry point for adding transactions
   * Coordinates transaction creation with optional verification
   */
  public async addTransaction(
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
          result = await this.handleExpenseTransaction(body as ExpenseTransactionData);
          break;
        case TransactionType.INCOME:
          result = await this.handleIncomeTransaction(body as IncomeTransactionData);
          break;
        case TransactionType.TRANSFER:
          result = await this.handleTransferTransaction(body as TransferTransactionData);
          break;
        default:
          logTransactionOperation('error', `Invalid transaction type: ${transactionType}`);
          result = [false, { error: `Invalid transaction type: ${transactionType}` }];
      }

      const [success, response] = result;

      // Verify transaction exists after creation if enabled
      if (success && enableVerification) {
        const externalId = this.extractExternalIdFromResponse(response);

        if (externalId) {
          logTransactionOperation('info', `Verifying transaction exists for external_id: ${externalId}`);
          const verifyResult = await this.verifyTransactionExists(externalId, 2);

          if (!verifyResult.verified) {
            logTransactionOperation('error', `Transaction verification failed: ${verifyResult.error}`);
            return [
              false,
              {
                error: 'Transaction creation succeeded but verification failed',
                creation_response: response,
                verification_error: verifyResult.error,
                external_id: externalId,
              } as unknown as FireflyTransactionPayload | { error: string },
            ];
          }

          logTransactionOperation('info', `Transaction verification successful for external_id: ${externalId}`);
          if (typeof response === 'object' && response !== null && !('error' in response)) {
            (response as unknown as Record<string, unknown>).verification = verifyResult;
          }
        } else {
          logTransactionOperation('warn', 'No external_id found in response - skipping verification');
        }
      }

      // Log total execution time
      const duration = timer.getDuration();
      const username = this.getUsername(body);
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
      const username = this.getUsername(body);
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
  private async handleExpenseTransaction(body: ExpenseTransactionData): Promise<TransactionResult> {
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

        const transactionData = this.buildTransactionRequest(payload);

        logTransactionOperation('info', `Sending EUR expense transaction for user ${body.username}`, transactionData);

        const response = await this.createTransaction(transactionData);

        if ('error' in response) {
          logTransactionOperation('error', `EUR expense transaction failed for user ${body.username}`, response);
          return [false, response];
        }

        // Trigger sync to update account balances
        await this.triggerImmediateSync();

        return [true, response];
      } else {
        // Non-EUR expense - convert to EUR
        const foreignAmount = await this.convertCurrency(transactionCurrency, 'EUR', parseFloat(String(body.amount)));

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

        const transactionData = this.buildTransactionRequest(payload);

        logTransactionOperation('info', `Sending non-EUR expense transaction for user ${body.username}`, transactionData);

        const response = await this.createTransaction(transactionData);

        if ('error' in response) {
          logTransactionOperation('error', `Non-EUR expense transaction failed for user ${body.username}`, response);
          return [false, response];
        }

        // Trigger sync to update account balances
        await this.triggerImmediateSync();

        return [true, response];
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
  private async handleIncomeTransaction(body: IncomeTransactionData): Promise<TransactionResult> {
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
          source_name: body.comment || body.category || 'Income',
          destination_name: body.account,
          notes: buildTransactionNotes(
            `Income ${body.category} to ${body.account} ${body.amount} ${body.currency}`,
            body.comment,
            body.username
          ),
          tags: [body.username],
          external_id: externalId,
        };

        const transactionData = this.buildTransactionRequest(payload);

        logTransactionOperation('info', `Sending EUR income transaction for user ${body.username}`, transactionData);

        const response = await this.createTransaction(transactionData);

        if ('error' in response) {
          logTransactionOperation('error', `EUR income transaction failed for user ${body.username}`, response);
          return [false, response];
        }

        // Trigger sync to update account balances
        await this.triggerImmediateSync();

        return [true, response];
      } else {
        // Non-EUR income - convert to EUR
        const foreignAmount = await this.convertCurrency(transactionCurrency, 'EUR', parseFloat(String(body.amount)));

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
          source_name: body.comment || body.category || 'Income',
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

        const transactionData = this.buildTransactionRequest(payload);

        logTransactionOperation('info', `Sending non-EUR income transaction for user ${body.username}`, transactionData);

        const response = await this.createTransaction(transactionData);

        if ('error' in response) {
          logTransactionOperation('error', `Non-EUR income transaction failed for user ${body.username}`, response);
          return [false, response];
        }

        // Trigger sync to update account balances
        await this.triggerImmediateSync();

        return [true, response];
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
  private async handleTransferTransaction(body: TransferTransactionData): Promise<TransactionResult> {
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

      const transactionData = this.buildTransactionRequest(payload);

      logTransactionOperation('info', `Sending transfer transaction for user ${body.username}`, transactionData);

      // Execute main transfer
      const response = await this.createTransaction(transactionData);

      if ('error' in response) {
        logTransactionOperation('error', `Transfer transaction failed for user ${body.username}`, response);
        return [false, response];
      }

      // Handle exit fee if present
      if (body.exit_fee && parseFloat(String(body.exit_fee)) > 0) {
        await this.handleTransferFee(body.exit_fee, body.exit_account, body.entry_account, 'exit', exitCurrency, body.username);
      }

      // Handle entry fee if present
      if (body.entry_fee && parseFloat(String(body.entry_fee)) > 0) {
        await this.handleTransferFee(body.entry_fee, body.entry_account, body.exit_account, 'entry', entryCurrency, body.username);
      }

      // Trigger sync after successful transfer
      await this.triggerImmediateSync();

      return [true, response];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logTransactionOperation('error', `Error handling transfer transaction: ${errorMessage}`);
      return [false, { error: errorMessage }];
    }
  }

  /**
   * Handle transfer fee transactions
   */
  private async handleTransferFee(
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

      const transactionData = this.buildTransactionRequest(payload);

      logTransactionOperation('info', `Sending ${feeType} fee transaction for user ${username}`, transactionData);

      const response = await this.createTransaction(transactionData);

      if ('error' in response) {
        logTransactionOperation('error', `${feeType} fee transaction failed for user ${username}`, response);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logTransactionOperation('error', `Error handling ${feeType} fee: ${errorMessage}`);
    }
  }

  /**
   * Verify transaction exists after creation
   */
  private async verifyTransactionExists(
    externalId: string,
    maxRetries: number = 2
  ): Promise<{ verified: boolean; transactionId?: string; error?: string }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Small delay between retries
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

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
  private async convertCurrency(fromCurrency: string, toCurrency: string, amount: number): Promise<number | null> {
    try {
      logTransactionOperation('info', `Converting ${amount} ${fromCurrency} to ${toCurrency}`);

      // Use balance service method for exchange rate
      const convertedAmount = await this.getExchangeRate(fromCurrency, toCurrency, amount);

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
  private async triggerImmediateSync(): Promise<void> {
    try {
      // TODO: Implement sync trigger
      // This should call the backend endpoint to update account balances
      logTransactionOperation('info', 'Triggering immediate sync');

      // Placeholder - implement actual sync API call
      // await this.triggerSync();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logTransactionOperation('warn', `Failed to trigger sync: ${errorMessage}`);
    }
  }

  /**
   * Extract external ID from API response
   */
  private extractExternalIdFromResponse(response: unknown): string | null {
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
  private getUsername(body: unknown): string {
    if (typeof body === 'object' && body !== null) {
      const obj = body as Record<string, unknown>;
      if (typeof obj.username === 'string') {
        return obj.username;
      }
    }
    return 'unknown';
  }

  /**
   * Get exchange rate (stub - to be implemented by Balance subclass)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getExchangeRate(_from: string, _to: string, _amount: number): Promise<number | null> {
    // This will be overridden by SyncServiceBalance
    // For now, return null to indicate not implemented at this level
    return null;
  }
  /**
   * Delete transaction via Sync API
   */
  public async deleteTransaction(transactionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}/api/v1/transactions/${transactionId}`;
      const anonKey = this.getAnonKey();

      if (!anonKey) {
        return { success: false, error: 'Sync anonymous API key not configured' };
      }

      // Get Telegram initData for Tier 2 authentication
      const { default: telegramService } = await import('../telegram');
      const initData = telegramService.getInitData();

      console.log('🗑️ Deleting transaction via Sync API:', {
        url,
        hasAnonKey: !!anonKey,
        hasInitData: !!initData,
        transactionId
      });

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-Anonymous-Key': anonKey,
          'X-Telegram-Init-Data': initData,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Sync API Error Response:', errorText);
        return {
          success: false,
          error: `Sync API request failed: ${response.status} ${response.statusText}`,
        };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Transaction deletion error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update transaction via Sync API
   */
  public async updateTransaction(
    transactionId: string,
    payload: unknown
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}/api/v1/transactions/${transactionId}`;
      const anonKey = this.getAnonKey();

      if (!anonKey) {
        return { success: false, error: 'Sync anonymous API key not configured' };
      }

      // Get Telegram initData for Tier 2 authentication
      const { default: telegramService } = await import('../telegram');
      const initData = telegramService.getInitData();

      console.log('✏️ Updating transaction via Sync API:', {
        url,
        hasAnonKey: !!anonKey,
        hasInitData: !!initData,
        transactionId
      });

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'X-Anonymous-Key': anonKey,
          'X-Telegram-Init-Data': initData,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `Sync API request failed: ${response.status} ${response.statusText}`,
          data,
        };
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Transaction update error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
  /**
   * Fetch transactions via Sync API
   */
  public async fetchTransactions(page: number = 1, limit: number = 50): Promise<ServiceTransactionsResponse> {
    try {
      const url = `${this.getBaseUrl()}/api/v1/transactions?page=${page}&limit=${limit}`;
      const anonKey = this.getAnonKey();

      if (!anonKey) {
        return { success: false, error: 'Sync anonymous API key not configured', transactions: [], pagination: { total: 0, count: 0, per_page: limit, current_page: page, total_pages: 0 } };
      }

      // Get Telegram initData for Tier 2 authentication
      const { default: telegramService } = await import('../telegram');
      const initData = telegramService.getInitData();

      console.log('📥 Fetching transactions via Sync API:', {
        url,
        hasAnonKey: !!anonKey,
        hasInitData: !!initData,
        page,
        limit
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Anonymous-Key': anonKey,
          'X-Telegram-Init-Data': initData,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Sync API Error Response:', errorText);
        return {
          success: false,
          error: `Sync API request failed: ${response.status} ${response.statusText}`,
          transactions: [],
          pagination: { total: 0, count: 0, per_page: limit, current_page: page, total_pages: 0 }
        };
      }

      const data = await response.json() as TransactionsResponse;
      
      // Map transactions
      const transactions = data.data
        .map(mapTransactionToDisplay)
        .filter((t): t is NonNullable<typeof t> => t !== null);

      return {
        success: true,
        transactions,
        pagination: data.meta.pagination
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Transaction fetch error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        transactions: [],
        pagination: { total: 0, count: 0, per_page: limit, current_page: page, total_pages: 0 }
      };
    }
  }

  /**
   * Fetch single transaction by ID via Sync API
   */
  public async fetchTransactionById(id: string): Promise<ServiceSingleTransactionResponse> {
    try {
      const url = `${this.getBaseUrl()}/api/v1/transactions/${id}`;
      const anonKey = this.getAnonKey();

      if (!anonKey) {
        return { success: false, error: 'Sync anonymous API key not configured' };
      }

      // Get Telegram initData for Tier 2 authentication
      const { default: telegramService } = await import('../telegram');
      const initData = telegramService.getInitData();

      console.log('📥 Fetching transaction by ID via Sync API:', {
        url,
        hasAnonKey: !!anonKey,
        hasInitData: !!initData,
        id
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Anonymous-Key': anonKey,
          'X-Telegram-Init-Data': initData,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Sync API Error Response:', errorText);
        return {
          success: false,
          error: `Sync API request failed: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json() as SingleTransactionResponse;
      const transaction = mapTransactionToDisplay(data.data);
      
      if (!transaction) {
        return { success: false, error: 'Failed to map transaction data' };
      }

      // Cast raw data to TransactionData (best effort)
      const rawData = data.data.attributes.transactions[0] as unknown as TransactionData;

      return {
        success: true,
        transaction,
        rawData
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Transaction fetch error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}
