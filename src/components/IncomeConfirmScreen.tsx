import { useState, useEffect } from 'react';
import { X, Check, Loader, ArrowLeft } from 'lucide-react';
import telegramService from '../services/telegram';
import { getCurrencySymbol } from '../utils/currencies';
import { gradients, cardStyles, layouts } from '../theme/dark';

interface IncomeConfirmScreenProps {
  account: string;
  amount: string;
  category: string;
  comment: string;
  accountCurrency?: string;
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
  accountCurrency,
  isAvailable,
  onBack,
  onCancel,
  onConfirm,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const currencyCode = accountCurrency || 'EUR';

  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  const handleConfirmTransaction = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    setSubmitMessage({
      type: 'success',
      text: 'Placeholder only. Ready to send to Firefly once wired.'
    });

    telegramService.showAlert('✅ Flow complete (placeholder only)');
    onSuccess();
    onConfirm();
    setIsSubmitting(false);
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
              +{getCurrencySymbol(currencyCode)}{amount}
            </div>
          </div>

          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Account:</span>
              <span className="text-xs font-medium text-white">{account}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Currency:</span>
              <span className="text-xs font-medium text-white">{currencyCode}</span>
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
