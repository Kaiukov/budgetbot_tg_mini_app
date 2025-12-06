import { useState, useEffect } from 'react';
import { X, Check, Loader, ArrowLeft, Wallet, Tag, MapPin, Calendar, FileText, ArrowRight } from 'lucide-react';
import { addTransaction, type WithdrawalTransactionData, type DepositTransactionData, type TransferTransactionData } from '../services/sync/index';
import telegramService from '../services/telegram';
import type { TransactionData } from '../hooks/useTransactionData';
import { getCurrencySymbol } from '../utils/currencies';
import { refreshHomeTransactionCache } from '../utils/cache';
import { gradients, layouts } from '../theme/dark';

const DEBUG_WEBHOOK_URL = import.meta.env.VITE_DEBUG_WEBHOOK_URL || 'https://n8n.neon-chuckwalla.ts.net/webhook-test/test_me';

const postDebugPayload = async (payload: WithdrawalTransactionData | DepositTransactionData | TransferTransactionData, type: 'withdrawal' | 'deposit' | 'transfer') => {
  try {
    await fetch(DEBUG_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: `${type}_confirm_payload`, payload })
    });
  } catch (error) {
    console.warn('Debug webhook post failed (non-blocking):', error);
  }
};

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

type BaseConfirmScreenProps = {
  isSubmitting?: boolean;
  submitMessage?: { type: 'success' | 'error'; text: string } | null;
  errors?: Record<string, string>;
  isAvailable?: boolean;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onSuccess: () => void;
  onIsSubmittingChange?: (isSubmitting: boolean) => void;
  onSubmitMessageChange?: (message: { type: 'success' | 'error'; text: string } | null) => void;
  onDateChange?: (isoDate: string) => void;
  onNotesChange?: (notes: string) => void;
  onClearError?: () => void;
  transactionData: TransactionData;
};

type WithdrawalConfirmProps = BaseConfirmScreenProps & {
  transactionType: 'withdrawal';
  account_name: string;
  amount: string;
  budget_name: string;
  destination_name: string;
};

type DepositConfirmProps = BaseConfirmScreenProps & {
  transactionType: 'deposit';
  account_name: string;
  amount: string;
  budget_name: string;
  destination_name: string;
  source_name?: string;
  source_id?: number | string;
};

type TransferConfirmProps = BaseConfirmScreenProps & {
  transactionType: 'transfer';
  sourceAccount: string;
  destAccount: string;
  sourceAmount: string;
  destAmount: string;
  sourceCurrency: string;
  destCurrency: string;
  sourceFee?: string;
  destFee?: string;
};

type ConfirmScreenProps = WithdrawalConfirmProps | DepositConfirmProps | TransferConfirmProps;

const ConfirmScreen: React.FC<ConfirmScreenProps> = (props) => {
  const {
    transactionType,
    transactionData,
    isSubmitting: propIsSubmitting,
    submitMessage: propSubmitMessage,
    errors = {},
    isAvailable,
    onBack,
    onCancel,
    onConfirm,
    onSuccess,
    onIsSubmittingChange,
    onSubmitMessageChange,
    onDateChange,
    onNotesChange,
    onClearError
  } = props;

  // Extract transaction-type-specific props
  const isTransfer = transactionType === 'transfer';
  const isWithdrawal = transactionType === 'withdrawal';

  // For withdrawal/deposit
  const account_name = !isTransfer ? (props as WithdrawalConfirmProps | DepositConfirmProps).account_name : '';
  const amount = !isTransfer ? (props as WithdrawalConfirmProps | DepositConfirmProps).amount : '';
  const budget_name = !isTransfer ? (props as WithdrawalConfirmProps | DepositConfirmProps).budget_name : '';

  // For transfer
  const sourceAccount = isTransfer ? (props as TransferConfirmProps).sourceAccount : '';
  const destAccount = isTransfer ? (props as TransferConfirmProps).destAccount : '';
  const sourceAmount = isTransfer ? (props as TransferConfirmProps).sourceAmount : '';
  const destAmount = isTransfer ? (props as TransferConfirmProps).destAmount : '';
  const sourceCurrency = isTransfer ? (props as TransferConfirmProps).sourceCurrency : '';
  const destCurrency = isTransfer ? (props as TransferConfirmProps).destCurrency : '';
  const sourceFee = isTransfer ? (props as TransferConfirmProps).sourceFee : '';
  const destFee = isTransfer ? (props as TransferConfirmProps).destFee : '';
  const toLocalDateInput = (value: Date) => {
    const tzOffsetMs = value.getTimezoneOffset() * 60000;
    return new Date(value.getTime() - tzOffsetMs).toISOString().slice(0, 10);
  };

  const getDateInputValue = (date?: string) => {
    if (!date) return toLocalDateInput(new Date());
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? toLocalDateInput(new Date()) : toLocalDateInput(parsed);
  };

  const [isSubmitting, setIsSubmitting] = useState(propIsSubmitting ?? false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(propSubmitMessage ?? null);
  const [dateInput, setDateInput] = useState<string>(() => getDateInputValue(transactionData.date));
  const [notesInput, setNotesInput] = useState<string>(transactionData.notes || '');
  const [notesTouched, setNotesTouched] = useState<boolean>(Boolean(transactionData.notes && transactionData.notes.trim()));

  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  // Sync local date/notes if parent transaction data changes
  useEffect(() => {
    setDateInput(getDateInputValue(transactionData.date));
  }, [transactionData.date]);

  const buildNotesSuggestion = () => {
    if (isTransfer) {
      // Transfer suggestion: "Transfer from Account A 100 EUR to Account B 95 USD. Source fee 1 EUR, destination fee 2 USD"
      const base = `Transfer from ${sourceAccount} ${sourceAmount} ${sourceCurrency} to ${destAccount} ${destAmount} ${destCurrency}`;

      const hasSourceFee = sourceFee && parseFloat(sourceFee) > 0;
      const hasDestFee = destFee && parseFloat(destFee) > 0;

      if (hasSourceFee || hasDestFee) {
        const fees = `Source fee ${sourceFee || '0'} ${sourceCurrency}, destination fee ${destFee || '0'} ${destCurrency}`;
        return `${base}. ${fees}`;
      }

      return base;
    }

    // Original logic for withdrawal/deposit
    const category = transactionData.category_name || (transactionType === 'withdrawal' ? 'Withdrawal' : 'Deposit');
    const account = transactionData.account_name || 'Account';
    const amountRaw = transactionData.amount || '0';
    const currency = (transactionData.account_currency || 'EUR').toUpperCase();
    const amountEur = (transactionData.amount_eur ?? parseFloat(amountRaw)) || 0;
    const transactionLabel = transactionType === 'withdrawal' ? 'Withdrawal' : 'Deposit';
    const sourceOrDest = transactionType === 'withdrawal' ? 'from' : 'to';

    if (currency === 'EUR') {
      return `${transactionLabel} ${category} ${sourceOrDest} ${account} ${amountRaw} ${currency}`;
    }

    return `${transactionLabel} ${category} ${sourceOrDest} ${account} ${amountRaw} ${currency} (${amountEur.toFixed(2)} EUR)`;
  };

  // Prefill notes when untouched
  useEffect(() => {
    if (notesTouched) return;

    const trimmed = transactionData.notes?.trim() ?? '';
    if (trimmed) {
      if (notesInput !== trimmed) {
        setNotesInput(trimmed);
      }
      setNotesTouched(true);
      return;
    }

    const suggestion = buildNotesSuggestion();
    if (notesInput !== suggestion) {
      setNotesInput(suggestion);
      onNotesChange?.(suggestion);
    }
    setNotesTouched(true);
  }, [
    notesTouched,
    transactionData.notes,
    transactionData.category_name,
    transactionData.account_name,
    transactionData.amount,
    transactionData.amount_eur,
    transactionData.account_currency,
    sourceAccount,
    destAccount,
    sourceAmount,
    destAmount,
    sourceCurrency,
    destCurrency,
    sourceFee,
    destFee,
    onNotesChange
  ]);

  const handleDateChange = (value: string) => {
    setDateInput(value);
    const isoValue = value ? new Date(`${value}T00:00:00`).toISOString() : '';
    onDateChange?.(isoValue);
    // Clear validation error when user sets a date
    if (value && onClearError) {
      onClearError();
    }
  };

  const handleNotesChange = (value: string) => {
    if (!notesTouched) setNotesTouched(true);
    setNotesInput(value);
    onNotesChange?.(value);
    // Clear validation error when user types notes (notes can be empty, so any input clears error)
    if (onClearError) {
      onClearError();
    }
  };

  const handleConfirmTransaction = async () => {
    if (isSubmitting) return;

    // Validate amount_eur is available (required for API submission)
    if (!transactionData.amount_eur || transactionData.amount_eur === 0) {
      const errorMsg = {
        type: 'error' as const,
        text: 'Currency conversion failed. Please retry or check your connection.'
      };
      setSubmitMessage(errorMsg);
      onSubmitMessageChange?.(errorMsg);
      return;
    }

    // Notes validation: required for withdrawal, optional for deposit and transfer
    if (isWithdrawal && !notesInput.trim()) {
      const errorMsg = { type: 'error' as const, text: 'Please add notes before submitting.' };
      setSubmitMessage(errorMsg);
      onSubmitMessageChange?.(errorMsg);
      return;
    }

    setIsSubmitting(true);
    onIsSubmittingChange?.(true);
    setSubmitMessage(null);
    onSubmitMessageChange?.(null);

    try {
      // Build transaction payload
      const effectiveDateIso = dateInput
        ? new Date(`${dateInput}T00:00:00`).toISOString()
        : new Date().toISOString();

      const amountValue = parseFloat(transactionData.amount);

      // Build payload based on transaction type
      let transactionPayload: WithdrawalTransactionData | DepositTransactionData | TransferTransactionData;

      if (transactionType === 'withdrawal') {
        transactionPayload = {
          // Withdrawal payload
          user_name: transactionData.user_name || 'unknown',
          account_name: transactionData.account_name,
          account_id: transactionData.account_id,
          account_currency: transactionData.account_currency,
          amount: amountValue,
          amount_eur: transactionData.amount_eur,
          category_id: transactionData.category_id,
          category_name: transactionData.category_name,
          budget_name: transactionData.budget_name,
          destination_id: transactionData.destination_id,
          destination_name: transactionData.destination_name || '',
          notes: notesInput.trim(),
          date: effectiveDateIso,
        };
      } else if (transactionType === 'deposit') {
        transactionPayload = {
          // Deposit payload
          user_name: transactionData.user_name || 'unknown',
          account_name: transactionData.account_name,
          account_id: transactionData.account_id,
          account_currency: transactionData.account_currency,
          amount: amountValue,
          amount_eur: transactionData.amount_eur,
          category_id: transactionData.category_id,
          category_name: transactionData.category_name,
          source_id: transactionData.source_id,
          source_name: transactionData.source_name || '',
          notes: notesInput.trim(),
          date: effectiveDateIso,
        };
      } else {
        // Transfer payload
        const sourceCurrencyCode = sourceCurrency?.toUpperCase() || 'EUR';
        const destCurrencyCode = destCurrency?.toUpperCase() || 'EUR';
        transactionPayload = {
          user_name: transactionData.user_name || 'unknown',
          date: effectiveDateIso,
          exit_account: sourceAccount,
          entry_account: destAccount,
          exit_amount: parseFloat(sourceAmount),
          entry_amount: parseFloat(destAmount),
          exit_currency: sourceCurrencyCode,
          entry_currency: destCurrencyCode,
          exit_fee: sourceFee ? parseFloat(sourceFee) : 0,
          entry_fee: destFee ? parseFloat(destFee) : 0,
          description: notesInput.trim()
        };
      }

      // Fire-and-forget debug webhook (does not block main submission)
      void postDebugPayload(transactionPayload, transactionType);

      console.log(`📝 ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} payload built:`, transactionPayload);

      // Submit to Firefly
      const [success, response] = await addTransaction(transactionPayload, transactionType, true);

      if (success) {
        console.log(`✅ ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} submitted successfully:`, response);

        // Proactively refresh transaction cache
        await refreshHomeTransactionCache();

        // Show Telegram alert for success
        const successMsg = transactionType === 'withdrawal'
          ? '✅ Withdrawal saved successfully!'
          : transactionType === 'deposit'
            ? '✅ Deposit saved successfully!'
            : '✅ Transfer saved successfully!';
        telegramService.showAlert(successMsg, () => {
          onSuccess();
          onConfirm();
        });
      } else {
        console.error('❌ Transaction submission failed:', response);
        let errorMessage = 'Failed to save transaction';
        if (typeof response === 'object' && response !== null) {
          // ApiError shape from apiClient
          if ('status' in response && 'statusText' in response) {
            const r = response as { status?: unknown; statusText?: unknown; body?: unknown; message?: unknown; error?: unknown };
            const status = r.status ?? '';
            const statusText = r.statusText ?? '';
            const body = r.body ? ` body: ${safeStringify(r.body)}` : '';
            const msg = r.message ? ` message: ${safeStringify(r.message)}` : '';
            const err = r.error ? ` error: ${safeStringify(r.error)}` : '';
            errorMessage = `${status} ${statusText}${msg}${body}${err}`.trim();
          } else if ('error' in response) {
            const maybeError = (response as { error: unknown }).error;
            errorMessage = safeStringify(maybeError);
          } else if ('message' in response) {
            errorMessage = safeStringify((response as { message: unknown }).message);
          } else {
            errorMessage = safeStringify(response);
          }
        } else if (response) {
          errorMessage = String(response);
        }

        // Show Telegram alert for error
        telegramService.showAlert(`❌ Error: ${errorMessage}`);

        const errorMsg = {
          type: 'error' as const,
          text: `Error: ${errorMessage}`
        };
        setSubmitMessage(errorMsg);
        onSubmitMessageChange?.(errorMsg);
      }
    } catch (error) {
      console.error('💥 Transaction submission error:', error);
      const errorMessage = safeStringify(error);

      // Show Telegram alert for error
      telegramService.showAlert(`❌ Error: ${errorMessage}`);

      const errorMsg = {
        type: 'error' as const,
        text: `Error: ${errorMessage}`
      };
      setSubmitMessage(errorMsg);
      onSubmitMessageChange?.(errorMsg);
    } finally {
      setIsSubmitting(false);
      onIsSubmittingChange?.(false);
    }
  };

  const displayCategory = transactionData.category_name || budget_name;
  const isSameCurrency = isTransfer && sourceCurrency?.toUpperCase() === destCurrency?.toUpperCase();
  const transactionTypeLabel = isTransfer ? 'Transfer' : isWithdrawal ? 'Withdrawal' : 'Deposit';
  const notesPlaceholder = isTransfer
    ? 'Describe the transfer...'
    : isWithdrawal
      ? 'Describe the withdrawal...'
      : 'Describe the deposit...';

  // For withdrawal/deposit
  const amountColorClass = isTransfer ? 'text-blue-400' : isWithdrawal ? 'text-red-400' : 'text-green-400';
  const amountBgClass = isTransfer
    ? 'bg-gradient-to-br from-blue-900/40 to-blue-900/20 border border-blue-800/50'
    : isWithdrawal
      ? 'bg-gradient-to-br from-red-900/40 to-red-900/20 border border-red-800/50'
      : 'bg-gradient-to-br from-green-900/40 to-green-900/20 border border-green-800/50';
  const amountLabelColorClass = isTransfer ? 'text-blue-200' : isWithdrawal ? 'text-red-200' : 'text-green-200';
  const amountPrefix = isTransfer ? '' : isWithdrawal ? '-' : '+';
  const sourceOrDestLabel = isWithdrawal ? 'Destination' : 'Source';
  const sourceOrDestValue = isWithdrawal ? transactionData.destination_name : transactionData.source_name;
  const sourceOrDestIcon = isWithdrawal ? 'text-green-400' : 'text-blue-400';

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold">Confirm {transactionTypeLabel}</h1>
      </div>

      <div className={layouts.content}>
        {/* Validation Error */}
        {errors.validation && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-600/50">
            <p className="text-xs text-red-200">{errors.validation}</p>
          </div>
        )}

        {/* Amount Card - Prominent Display */}
        <div className={`mb-4 p-3 rounded-lg ${amountBgClass} shadow-lg`}>
          <p className={`text-xs ${amountLabelColorClass} uppercase tracking-wider font-semibold mb-1`}>Amount</p>
          {isTransfer ? (
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-blue-400 mb-1">
              {isSameCurrency ? (
                <>{getCurrencySymbol(sourceCurrency)}{sourceAmount}</>
              ) : (
                <>
                  <span>{getCurrencySymbol(sourceCurrency)}{sourceAmount}</span>
                  <ArrowRight size={24} className="flex-shrink-0" />
                  <span>{getCurrencySymbol(destCurrency)}{destAmount}</span>
                </>
              )}
            </div>
          ) : (
            <div className={`text-3xl font-bold ${amountColorClass} mb-1`}>
              {amountPrefix}{getCurrencySymbol(transactionData.account_currency)}{amount}
            </div>
          )}
          <p className="text-xs text-gray-400">{transactionTypeLabel} Transaction</p>
        </div>

        {/* Details Card */}
        <div className="mb-4 rounded-lg bg-gray-800/50 border border-gray-700/50 shadow-lg overflow-hidden">
          {isTransfer ? (
            <>
              {/* Source Account */}
              <div className="p-3 border-b border-gray-700/50">
                <div className="flex items-center gap-2 mb-0.5">
                  <MapPin size={14} className="text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">From Account</span>
                </div>
                <span className="text-xs font-medium text-white ml-5">{sourceAccount}</span>
              </div>

              {/* Destination Account */}
              <div className="p-3 border-b border-gray-700/50">
                <div className="flex items-center gap-2 mb-0.5">
                  <MapPin size={14} className="text-green-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">To Account</span>
                </div>
                <span className="text-xs font-medium text-white ml-5">{destAccount}</span>
              </div>

              {/* Fees - Only show if present */}
              {((sourceFee && parseFloat(sourceFee) > 0) || (destFee && parseFloat(destFee) > 0)) && (
                <div className="p-3 border-b border-gray-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag size={14} className="text-amber-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Fees</span>
                  </div>
                  <div className="ml-5 space-y-0.5">
                    {sourceFee && parseFloat(sourceFee) > 0 && (
                      <div className="text-xs font-medium text-white">
                        Source: {getCurrencySymbol(sourceCurrency)}{sourceFee}
                      </div>
                    )}
                    {destFee && parseFloat(destFee) > 0 && (
                      <div className="text-xs font-medium text-white">
                        Destination: {getCurrencySymbol(destCurrency)}{destFee}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Account */}
              <div className="p-3 border-b border-gray-700/50">
                <div className="flex items-center gap-2 mb-0.5">
                  <Wallet size={14} className="text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Account</span>
                </div>
                <span className="text-xs font-medium text-white ml-5">{account_name}</span>
              </div>

              {/* Category */}
              <div className="p-3 border-b border-gray-700/50">
                <div className="flex items-center gap-2 mb-0.5">
                  <Tag size={14} className="text-amber-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Category</span>
                </div>
                <span className="text-xs font-medium text-white ml-5">{displayCategory}</span>
              </div>

              {/* Destination / Source */}
              <div className="p-3 border-b border-gray-700/50">
                <div className="flex items-center gap-2 mb-0.5">
                  <MapPin size={14} className={`${sourceOrDestIcon} flex-shrink-0`} />
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{sourceOrDestLabel}</span>
                </div>
                <span className="text-xs font-medium text-white ml-5">{sourceOrDestValue || 'Not specified'}</span>
              </div>
            </>
          )}

          {/* Date */}
          <div className="p-3 border-b border-gray-700/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar size={14} className="text-purple-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Date</span>
            </div>
            <input
              type="date"
              aria-label="Transaction date"
              value={dateInput}
              onChange={(e) => handleDateChange(e.target.value)}
              className="ml-5 bg-gray-900/50 border border-gray-600/50 text-white text-xs px-2 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full max-w-[140px]"
            />
          </div>

          {/* Notes */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <FileText size={14} className="text-cyan-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Notes</span>
            </div>
            <textarea
              value={notesInput}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={notesPlaceholder}
              rows={4}
              className="ml-5 bg-gray-900/50 border border-gray-600/50 text-white text-xs px-2 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y min-h-[100px] w-[calc(100%-20px)]"
            />
          </div>
        </div>

        {/* Submit Message */}
        {submitMessage && (
          <div className={`mb-3 p-3 rounded-lg text-xs font-medium flex items-center gap-2 transition ${
            submitMessage.type === 'success'
              ? 'bg-green-900/30 border border-green-600/50 text-green-200'
              : 'bg-red-900/30 border border-red-600/50 text-red-200'
          }`}>
            {submitMessage.type === 'success' ? (
              <Check size={16} className="flex-shrink-0" />
            ) : (
              <X size={16} className="flex-shrink-0" />
            )}
            <span>{submitMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <X size={16} />
            Decline
          </button>
          <button
            onClick={handleConfirmTransaction}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check size={16} />
                Confirm
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmScreen;
