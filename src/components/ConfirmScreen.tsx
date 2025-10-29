import { useState } from 'react';
import { X, Check, Loader, ArrowLeft } from 'lucide-react';
import { syncService } from '../services/sync';
import { addTransaction } from '../services/firefly/transactions';
import { extractBudgetName } from '../services/firefly/utils';
import type { ExpenseTransactionData } from '../services/firefly/types';
import type { ExpenseData } from '../hooks/useExpenseData';
import { getCurrencySymbol } from '../utils/currencies';

interface ConfirmScreenProps {
  account: string;
  amount: string;
  category: string;
  comment: string;
  expenseData: ExpenseData;
  userName: string;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onSuccess: () => void;
}

const ConfirmScreen: React.FC<ConfirmScreenProps> = ({
  account,
  amount,
  category,
  comment,
  expenseData,
  userName,
  onBack,
  onCancel,
  onConfirm,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConfirmTransaction = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      console.log('💳 Starting transaction submission:', {
        account,
        amount,
        category,
        expenseData
      });

      // Convert amount to EUR if needed
      let amountForeignEur: number | null = null;

      if (expenseData.account_currency && expenseData.account_currency.toUpperCase() !== 'EUR') {
        console.log('💱 Converting', expenseData.account_currency, 'to EUR');
        amountForeignEur = await syncService.getExchangeRate(
          expenseData.account_currency,
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

      // Build transaction payload
      const budgetName = extractBudgetName(category);
      const transactionPayload: ExpenseTransactionData = {
        account: expenseData.account,
        account_id: parseInt(expenseData.account_id || '0'),
        account_currency: expenseData.account_currency || 'EUR',
        currency: expenseData.account_currency || 'EUR',
        amount: parseFloat(amount),
        amount_foreign: amountForeignEur,
        category: category,
        comment: comment || '',
        date: new Date().toISOString(),
        user_id: expenseData.user_id || 0,
        username: userName || expenseData.username || 'unknown',
        // Only include budget_name if it's not empty (excludes Cyrillic/non-ASCII names)
        ...(budgetName && { budget_name: budgetName })
      };

      console.log('📝 Transaction payload built:', transactionPayload);

      // Submit to Firefly
      const [success, response] = await addTransaction(transactionPayload, 'expense', true);

      if (success) {
        console.log('✅ Transaction submitted successfully:', response);
        setSubmitMessage({
          type: 'success',
          text: 'Transaction saved to Firefly!'
        });

        // Reset form and navigate after showing success
        setTimeout(() => {
          onSuccess();
          onConfirm();
        }, 2000);
      } else {
        console.error('❌ Transaction submission failed:', response);
        const errorMessage = typeof response === 'object' && response !== null && 'error' in response
          ? (response as { error: string }).error
          : 'Failed to save transaction';

        setSubmitMessage({
          type: 'error',
          text: `Error: ${errorMessage}`
        });
      }
    } catch (error) {
      console.error('💥 Transaction submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      setSubmitMessage({
        type: 'error',
        text: `Error: ${errorMessage}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Confirmation</h2>
      </div>

      <div className="p-3">
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-red-500 mb-1">
              -{getCurrencySymbol(expenseData.account_currency)}{amount}
            </div>
            <p className="text-xs text-gray-400">Expense</p>
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

export default ConfirmScreen;
