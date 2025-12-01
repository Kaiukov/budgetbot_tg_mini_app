import { useState, useEffect } from 'react';
import { X, Check, Loader, ArrowLeft, Wallet, Tag, MapPin, Calendar, FileText } from 'lucide-react';
import { addTransaction, type WithdrawalTransactionData } from '../services/sync/index';
import telegramService from '../services/telegram';
import type { TransactionData } from '../hooks/useTransactionData';
import { getCurrencySymbol } from '../utils/currencies';
import { refreshHomeTransactionCache } from '../utils/cache';
import { gradients, layouts } from '../theme/dark';

const DEBUG_WEBHOOK_URL = import.meta.env.VITE_DEBUG_WEBHOOK_URL || 'https://n8n.neon-chuckwalla.ts.net/webhook-test/test_me';

const postDebugPayload = async (payload: WithdrawalTransactionData) => {
  try {
    await fetch(DEBUG_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: 'withdrawal_confirm_payload', payload })
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

interface ConfirmScreenProps {
  account_name: string;
  amount: string;
  budget_name: string;
  destination_name: string;
  transactionData: TransactionData;
  isSubmitting?: boolean;
  submitMessage?: { type: 'success' | 'error'; text: string } | null;
  isAvailable?: boolean;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onSuccess: () => void;
  onIsSubmittingChange?: (isSubmitting: boolean) => void;
  onSubmitMessageChange?: (message: { type: 'success' | 'error'; text: string } | null) => void;
  onDateChange?: (isoDate: string) => void;
  onNotesChange?: (notes: string) => void;
}

const ConfirmScreen: React.FC<ConfirmScreenProps> = ({
  account_name,
  amount,
  budget_name,
  destination_name,
  transactionData,
  isSubmitting: propIsSubmitting,
  submitMessage: propSubmitMessage,
  isAvailable,
  onBack,
  onCancel,
  onConfirm,
  onSuccess,
  onIsSubmittingChange,
  onSubmitMessageChange,
  onDateChange,
  onNotesChange
}) => {
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
    const category = transactionData.category_name || 'Withdrawal';
    const account = transactionData.account_name || 'Account';
    const amountRaw = transactionData.amount || '0';
    const currency = (transactionData.account_currency || 'EUR').toUpperCase();
    const amountEur = (transactionData.amount_eur ?? parseFloat(amountRaw)) || 0;
    const transactionLabel = 'Withdrawal';

    if (currency === 'EUR') {
      return `${transactionLabel} ${category} from ${account} ${amountRaw} ${currency}`;
    }

    return `${transactionLabel} ${category} from ${account} ${amountRaw} ${currency} (${amountEur.toFixed(2)} EUR)`;
  };

  // Prefill notes when untouched
  useEffect(() => {
    if (notesTouched) return;

    if (transactionData.notes && transactionData.notes.trim()) {
      setNotesInput(transactionData.notes);
      onNotesChange?.(transactionData.notes);
      return;
    }

    const suggestion = buildNotesSuggestion();
    setNotesInput(suggestion);
    onNotesChange?.(suggestion);
  }, [
    notesTouched,
    transactionData.notes,
    transactionData.category_name,
    transactionData.account_name,
    transactionData.amount,
    transactionData.amount_eur,
    transactionData.account_currency,
    onNotesChange
  ]);

  const handleDateChange = (value: string) => {
    setDateInput(value);
    const isoValue = value ? new Date(`${value}T00:00:00`).toISOString() : '';
    onDateChange?.(isoValue);
  };

  const handleNotesChange = (value: string) => {
    if (!notesTouched) setNotesTouched(true);
    setNotesInput(value);
    onNotesChange?.(value);
  };

  const handleConfirmTransaction = async () => {
    if (isSubmitting) return;

    if (!notesInput.trim()) {
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
      const isEurAccount = (transactionData.account_currency || '').toUpperCase() === 'EUR';
      const amountForeign = isEurAccount ? undefined : amountValue;

      const transactionPayload: WithdrawalTransactionData = {
        // User identification
        user_name: transactionData.user_name || 'unknown',

        // Account
        account_name: transactionData.account_name,
        account_id: transactionData.account_id,
        account_currency: transactionData.account_currency,

        // Amounts
        amount: amountValue,
        amount_eur: amountForeign !== undefined ? amountForeign : amountValue,

        // Category
        category_id: transactionData.category_id,
        category_name: transactionData.category_name,
        budget_name: transactionData.budget_name,

        // Destination
        destination_id: transactionData.destination_id,
        destination_name: transactionData.destination_name || '',

        // Meta
        notes: notesInput.trim(),
        date: effectiveDateIso
      };

      // Fire-and-forget debug webhook (does not block main submission)
      void postDebugPayload(transactionPayload);

      console.log('📝 Transaction payload built:', transactionPayload);

      // Submit to Firefly
      const [success, response] = await addTransaction(transactionPayload, 'withdrawal', true);

      if (success) {
        console.log('✅ Transaction submitted successfully:', response);

        // Proactively refresh transaction cache
        await refreshHomeTransactionCache();

        // Show Telegram alert for success
        telegramService.showAlert('✅ Withdrawal saved successfully!', () => {
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

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold">Confirm Withdrawal</h1>
      </div>

      <div className={layouts.content}>
        {/* Amount Card - Prominent Display */}
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-red-900/40 to-red-900/20 border border-red-800/50 shadow-lg">
          <p className="text-xs text-red-200 uppercase tracking-wider font-semibold mb-1">Amount</p>
          <div className="text-3xl font-bold text-red-400 mb-1">
            -{getCurrencySymbol(transactionData.account_currency)}{amount}
          </div>
          <p className="text-xs text-gray-400">Withdrawal Transaction</p>
        </div>

        {/* Details Card */}
        <div className="mb-4 rounded-lg bg-gray-800/50 border border-gray-700/50 shadow-lg overflow-hidden">
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

          {/* Destination */}
          <div className="p-3 border-b border-gray-700/50">
            <div className="flex items-center gap-2 mb-0.5">
              <MapPin size={14} className="text-green-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Destination</span>
            </div>
            <span className="text-xs font-medium text-white ml-5">{destination_name || 'Not specified'}</span>
          </div>

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
              placeholder="Describe the withdrawal..."
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
