import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import telegramService from '../services/telegram';
import { gradients, cardStyles, layouts } from '../theme/dark';

interface TransferFeeScreenProps {
  sourceAccount: string;
  destAccount: string;
  sourceCurrency: string;
  destCurrency: string;
  sourceFee: string;
  destFee: string;
  isAvailable?: boolean;
  onBack: () => void;
  onSourceFeeChange: (value: string) => void;
  onDestFeeChange: (value: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

const TransferFeeScreen: React.FC<TransferFeeScreenProps> = ({
  sourceAccount,
  destAccount,
  sourceCurrency,
  destCurrency,
  sourceFee,
  destFee,
  isAvailable,
  onBack,
  onSourceFeeChange,
  onDestFeeChange,
  onNext,
  onSkip
}) => {
  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  const sourceCurrencyCode = sourceCurrency?.toUpperCase() || 'EUR';
  const destCurrencyCode = destCurrency?.toUpperCase() || 'EUR';

  const handleSourceFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Replace comma with dot for decimal separator
    value = value.replace(/,/g, '.');

    // Reject if it contains minus sign (negative fees not allowed)
    if (value.includes('-')) {
      return;
    }

    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Add leading zero if input starts with decimal point (e.g., ".5" → "0.5")
      if (value.startsWith('.')) {
        value = '0' + value;
      }
      onSourceFeeChange(value);
    }
  };

  const handleDestFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Replace comma with dot for decimal separator
    value = value.replace(/,/g, '.');

    // Reject if it contains minus sign (negative fees not allowed)
    if (value.includes('-')) {
      return;
    }

    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Add leading zero if input starts with decimal point (e.g., ".5" → "0.5")
      if (value.startsWith('.')) {
        value = '0' + value;
      }
      onDestFeeChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onNext();
    }
  };

  const handleSkipFees = () => {
    onSourceFeeChange('0');
    onDestFeeChange('0');
    onSkip();
  };

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold">Transfer Fees (Optional)</h1>
      </div>

      <div className={layouts.contentWide}>
        {/* Source Fee (From Account) */}
        <div className={`${cardStyles.container} mb-2`}>
          <p className="text-xs text-gray-400 mb-2">Fee from: {sourceAccount}</p>
          <div className="text-center overflow-x-auto">
            <div className="flex items-baseline justify-center gap-1 px-2 min-w-full">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={sourceFee}
                onChange={handleSourceFeeChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                className={`text-4xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-gray-600 min-w-0 ${
                  sourceFee ? 'text-right' : 'text-center'
                }`}
                style={{
                  width: sourceFee ? `${Math.min(sourceFee.length * 0.65, 12)}em` : '2em',
                  maxWidth: '100%'
                }}
                autoFocus
              />
              {sourceFee && (
                <span className="text-2xl font-semibold text-gray-400 whitespace-nowrap ml-1">
                  {sourceCurrencyCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center py-2">
          <div className="text-gray-500 text-sm">↓</div>
        </div>

        {/* Destination Fee (To Account) */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-400 mb-2">Fee to: {destAccount}</p>
          <div className="text-center overflow-x-auto">
            <div className="flex items-baseline justify-center gap-1 px-2 min-w-full">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={destFee}
                onChange={handleDestFeeChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                className={`text-4xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-gray-600 min-w-0 ${
                  destFee ? 'text-right' : 'text-center'
                }`}
                style={{
                  width: destFee ? `${Math.min(destFee.length * 0.65, 12)}em` : '2em',
                  maxWidth: '100%'
                }}
              />
              {destFee && (
                <span className="text-2xl font-semibold text-gray-400 whitespace-nowrap ml-1">
                  {destCurrencyCode}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mb-4">
          Enter fees or leave at 0 if no fees apply
        </p>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleSkipFees}
            className="w-full bg-gray-700 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-600 transition active:scale-98"
          >
            Skip Fees (Set to 0)
          </button>

          <button
            onClick={onNext}
            className="w-full bg-blue-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition active:scale-98"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferFeeScreen;
