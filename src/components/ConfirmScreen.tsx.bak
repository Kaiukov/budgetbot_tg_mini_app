import { useState, useEffect } from 'react';
import { X, Check, Loader, ArrowLeft } from 'lucide-react';
import { addTransaction, type WithdrawalTransactionData } from '../services/sync/index';
import telegramService from '../services/telegram';
import type { TransactionData } from '../hooks/useTransactionData';
import { getCurrencySymbol } from '../utils/currencies';
import { refreshHomeTransactionCache } from '../utils/cache';
import { gradients, cardStyles, layouts } from '../theme/dark';

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
        // Required identification
        user_name: transactionData.user_name || 'unknown',

        // Account
        account: transactionData.account_name,
        account_id: transactionData.account_id,
        account_currency: transactionData.account_currency,
        currency: transactionData.account_currency,

        // Amounts
        amount: amountValue,
        amount_foreign: amountForeign,

        // Category
        category: transactionData.category_name,
        budget_name: transactionData.budget_name,

        // Destination/Comment
        comment: transactionData.destination_name || '',

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
        <h1 className="text-2xl font-bold">Confirmation</h1>
      </div>

      <div className={layouts.content}>
        <div className={`${cardStyles.container} mb-4`}>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-red-500 mb-1">
              -{getCurrencySymbol(transactionData.account_currency)}{amount}
            </div>
            <p className="text-xs text-gray-400">Withdrawal</p>
          </div>

          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Account:</span>
              <span className="text-xs font-medium text-white">{account_name}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Category:</span>
              <span className="text-xs font-medium text-white">{displayCategory}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Destination:</span>
              <span className="text-xs font-medium text-white text-right max-w-[60%]">{destination_name || 'None'}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-gray-400">Date:</span>
              <input
                type="date"
                aria-label="Transaction date"
                value={dateInput}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white text-xs px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[170px] text-right"
              />
            </div>
            <div className="border-b border-gray-700" />
            <div className="flex flex-col gap-1 pt-2.5">
              <label className="text-xs text-gray-400">Notes:</label>
              <textarea
                value={notesInput}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add notes for this withdrawal..."
                rows={8}
                className="bg-gray-800 border border-gray-700 text-white text-xs px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[200px] w-full"
              />
            </div>
          </div>
        </div>

        {/* Submit Message */}
        {submitMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
            submitMessage.type === 'success'
              ? 'bg-green-900 border border-green-700 text-green-200'
              : 'bg-red-900 border border-red-700 text-red-200'
          }`}>
            {submitMessage.type === 'success' ? (
              <Check size={16} />
            ) : (
              <X size={16} />
            )}
            <span>{submitMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition active:scale-95 flex items-center justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={14} className="mr-1" />
            No
          </button>
          <button
            onClick={handleConfirmTransaction}
            disabled={isSubmitting}
            className="bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition active:scale-95 flex items-center justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader size={14} className="mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={14} className="mr-1" />
                Yes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmScreen;
