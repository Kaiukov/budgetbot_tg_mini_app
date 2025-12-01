import { useState, useEffect } from 'react';
import { X, Check, Loader, ArrowLeft } from 'lucide-react';
import { addTransaction, type ExpenseTransactionData } from '../services/sync/index';
import telegramService from '../services/telegram';
import type { TransactionData } from '../hooks/useTransactionData';
import { getCurrencySymbol } from '../utils/currencies';
import { refreshHomeTransactionCache } from '../utils/cache';
import { gradients, cardStyles, layouts } from '../theme/dark';

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
  onSubmitMessageChange
}) => {
  const [isSubmitting, setIsSubmitting] = useState(propIsSubmitting ?? false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(propSubmitMessage ?? null);

  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  const handleConfirmTransaction = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    onIsSubmittingChange?.(true);
    setSubmitMessage(null);
    onSubmitMessageChange?.(null);

    try {
      // Build transaction payload
      const transactionPayload: ExpenseTransactionData = {
        account: transactionData.account_name,
        account_id: transactionData.account_id,
        account_currency: transactionData.account_currency,
        currency: transactionData.account_currency,
        amount: parseFloat(transactionData.amount),
        amount_foreign: transactionData.amount_eur,
        category: transactionData.category_name,
        comment: transactionData.destination_name || '',
        date: transactionData.date || new Date().toISOString(),
        username: transactionData.user_name || 'unknown',
        // Only include budget_name if it's not empty (excludes Cyrillic/non-ASCII names)
        ...(transactionData.budget_name && { budget_name: transactionData.budget_name })
      };

      console.log('📝 Transaction payload built:', transactionPayload);

      // Submit to Firefly
      const [success, response] = await addTransaction(transactionPayload, 'expense', true);

      if (success) {
        console.log('✅ Transaction submitted successfully:', response);

        // Proactively refresh transaction cache
        await refreshHomeTransactionCache();

        // Show Telegram alert for success
        telegramService.showAlert('✅ Expense saved successfully!', () => {
          onSuccess();
          onConfirm();
        });
      } else {
        console.error('❌ Transaction submission failed:', response);
        const errorMessage = typeof response === 'object' && response !== null && 'error' in response
          ? (response as { error: string }).error
          : 'Failed to save transaction';

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

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
            <p className="text-xs text-gray-400">Expense</p>
          </div>

          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Account:</span>
              <span className="text-xs font-medium text-white">{account_name}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Category:</span>
              <span className="text-xs font-medium text-white">{budget_name || transactionData.category_name}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Destination:</span>
              <span className="text-xs font-medium text-white text-right max-w-[60%]">{destination_name || 'None'}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-xs text-gray-400">Date:</span>
              <span className="text-xs font-medium text-white">{new Date().toLocaleDateString('en-US')}</span>
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
