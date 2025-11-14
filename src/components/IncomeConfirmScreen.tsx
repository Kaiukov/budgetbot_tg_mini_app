import { useState, useEffect } from 'react';
import { X, Check, Loader, ArrowLeft } from 'lucide-react';
import { syncService } from '../services/sync';
import { addTransaction } from '../services/firefly/transactions';
import { extractBudgetName } from '../services/firefly/utils';
import telegramService from '../services/telegram';
import type { IncomeTransactionData } from '../services/firefly/types';
import type { TransactionData } from '../hooks/useTransactionData';
import { getCurrencySymbol } from '../utils/currencies';
import { refreshHomeTransactionCache } from '../utils/cache';
import { gradients, cardStyles, layouts } from '../theme/dark';

interface IncomeConfirmScreenProps {
  account: string;
  amount: string;
  category: string;
  comment: string;
  transactionData: TransactionData;
  userName: string;
  isAvailable?: boolean;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onSuccess: () => void;
}

const IncomeConfirmScreen: React.FC<IncomeConfirmScreenProps> = ({
  account,
  amount,
  category,
  comment,
  transactionData,
  userName,
  isAvailable,
  onBack,
  onCancel,
  onConfirm,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  const handleConfirmTransaction = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      console.log('💰 Starting income transaction submission:', {
        account,
        amount,
        category,
        transactionData
      });

      // Convert amount to EUR if needed
      let amountForeignEur: number | null = null;

      if (transactionData.account_currency && transactionData.account_currency.toUpperCase() !== 'EUR') {
        console.log('💱 Converting', transactionData.account_currency, 'to EUR');
        amountForeignEur = await syncService.getExchangeRate(
          transactionData.account_currency,
          'EUR',
          parseFloat(amount)
        );

        if (amountForeignEur === null) {
          console.warn('⚠️ Currency conversion failed, using amount as-is');
          amountForeignEur = parseFloat(amount);
        }
      } else {
        amountForeignEur = parseFloat(amount);
      }

      console.log('✅ Amount converted to EUR:', amountForeignEur);

      // Build income transaction payload
      const budgetName = extractBudgetName(category);
      const transactionPayload: IncomeTransactionData = {
        account: transactionData.account,
        account_id: parseInt(transactionData.account_id || '0'),
        account_currency: transactionData.account_currency || 'EUR',
        currency: transactionData.account_currency || 'EUR',
        amount: parseFloat(amount),
        amount_foreign: amountForeignEur,
        category: category,
        comment: comment || '',
        date: new Date().toISOString(),
        user_id: transactionData.user_id || 0,
        username: userName || transactionData.username || 'unknown',
        // Only include budget_name if it's not empty
        ...(budgetName && { budget_name: budgetName })
      };

      console.log('📝 Income transaction payload built:', transactionPayload);

      // Submit to Firefly as income
      const [success, response] = await addTransaction(transactionPayload, 'income', true);

      if (success) {
        console.log('✅ Income transaction submitted successfully:', response);

        // Proactively refresh transaction cache
        await refreshHomeTransactionCache();

        // Show Telegram alert for success
        telegramService.showAlert('✅ Income saved successfully!', () => {
          onSuccess();
          onConfirm();
        });
      } else {
        console.error('❌ Income transaction submission failed:', response);
        const errorMessage = typeof response === 'object' && response !== null && 'error' in response
          ? (response as { error: string }).error
          : 'Failed to save income transaction';

        // Show Telegram alert for error
        telegramService.showAlert(`❌ Error: ${errorMessage}`);

        setSubmitMessage({
          type: 'error',
          text: `Error: ${errorMessage}`
        });
      }
    } catch (error) {
      console.error('💥 Income transaction submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Show Telegram alert for error
      telegramService.showAlert(`❌ Error: ${errorMessage}`);

      setSubmitMessage({
        type: 'error',
        text: `Error: ${errorMessage}`
      });
    } finally {
      setIsSubmitting(false);
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
            <div className="text-3xl font-bold text-green-500 mb-1">
              +{getCurrencySymbol(transactionData.account_currency)}{amount}
            </div>
            <p className="text-xs text-gray-400">Income</p>
          </div>

          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Account:</span>
              <span className="text-xs font-medium text-white">{account}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Category:</span>
              <span className="text-xs font-medium text-white">{category}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Comment:</span>
              <span className="text-xs font-medium text-white text-right max-w-[60%]">{comment || 'No comment'}</span>
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

export default IncomeConfirmScreen;
