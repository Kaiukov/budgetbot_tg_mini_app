import { useState, useEffect } from 'react';
import { X, Check, Loader, ArrowLeft, ArrowRight } from 'lucide-react';
import { addTransaction } from '../services/sync';
import telegramService from '../services/telegram';
import type { TransferTransactionData } from '../services/sync/types';
import { getCurrencySymbol } from '../utils/currencies';
import { gradients, cardStyles, layouts } from '../theme/dark';

interface TransferConfirmScreenProps {
  sourceAccount: string;
  destAccount: string;
  sourceCurrency: string;
  destCurrency: string;
  exitAmount: string;
  entryAmount: string;
  exitFee: string;
  entryFee: string;
  comment: string;
  userName: string;
  isAvailable?: boolean;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onSuccess: () => void;
}

const TransferConfirmScreen: React.FC<TransferConfirmScreenProps> = ({
  sourceAccount,
  destAccount,
  sourceCurrency,
  destCurrency,
  exitAmount,
  entryAmount,
  exitFee,
  entryFee,
  comment,
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

  const sourceCurrencyCode = sourceCurrency?.toUpperCase() || 'EUR';
  const destCurrencyCode = destCurrency?.toUpperCase() || 'EUR';
  const isSameCurrency = sourceCurrencyCode === destCurrencyCode;

  const handleConfirmTransaction = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      console.log('💸 Starting transfer transaction submission:', {
        sourceAccount,
        destAccount,
        exitAmount,
        entryAmount,
        exitFee,
        entryFee,
        comment
      });

      // Build transfer transaction payload
      const transactionPayload: TransferTransactionData = {
        username: userName || 'unknown',
        date: new Date().toISOString(),
        exit_account: sourceAccount,
        entry_account: destAccount,
        exit_amount: parseFloat(exitAmount),
        entry_amount: parseFloat(entryAmount),
        exit_currency: sourceCurrencyCode,
        entry_currency: destCurrencyCode,
        exit_fee: exitFee ? parseFloat(exitFee) : 0,
        entry_fee: entryFee ? parseFloat(entryFee) : 0,
        description: comment || ''
      };

      console.log('📝 Transfer payload built:', transactionPayload);

      // Submit to Firefly
      const [success, response] = await addTransaction(transactionPayload, 'transfer', true);

      if (success) {
        console.log('✅ Transfer submitted successfully:', response);

        // Show Telegram alert for success
        telegramService.showAlert('✅ Transfer saved successfully!', () => {
          onSuccess();
          onConfirm();
        });
      } else {
        console.error('❌ Transfer submission failed:', response);
        const errorMessage = typeof response === 'object' && response !== null && 'error' in response
          ? (response as { error: string }).error
          : 'Failed to save transfer';

        // Show Telegram alert for error
        telegramService.showAlert(`❌ Error: ${errorMessage}`);

        setSubmitMessage({
          type: 'error',
          text: `Error: ${errorMessage}`
        });
      }
    } catch (error) {
      console.error('💥 Transfer submission error:', error);
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
            {/* Transfer amount display with arrow */}
            {isSameCurrency ? (
              <div className="text-3xl font-bold text-blue-500 mb-1">
                {getCurrencySymbol(sourceCurrencyCode)}{exitAmount}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-blue-500 mb-1">
                <span>{getCurrencySymbol(sourceCurrencyCode)}{exitAmount}</span>
                <ArrowRight size={24} className="flex-shrink-0" />
                <span>{getCurrencySymbol(destCurrencyCode)}{entryAmount}</span>
              </div>
            )}
            <p className="text-xs text-gray-400">Transfer</p>
          </div>

          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">From Account:</span>
              <span className="text-xs font-medium text-white">{sourceAccount}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">To Account:</span>
              <span className="text-xs font-medium text-white">{destAccount}</span>
            </div>

            {/* Show fees if they're greater than 0 */}
            {((exitFee && parseFloat(exitFee) > 0) || (entryFee && parseFloat(entryFee) > 0)) && (
              <div className="flex justify-between py-2.5 border-b border-gray-700">
                <span className="text-xs text-gray-400">Fees:</span>
                <div className="text-xs font-medium text-white text-right">
                  {exitFee && parseFloat(exitFee) > 0 && (
                    <div>Exit: {getCurrencySymbol(sourceCurrencyCode)}{exitFee}</div>
                  )}
                  {entryFee && parseFloat(entryFee) > 0 && (
                    <div>Entry: {getCurrencySymbol(destCurrencyCode)}{entryFee}</div>
                  )}
                </div>
              </div>
            )}

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

export default TransferConfirmScreen;
