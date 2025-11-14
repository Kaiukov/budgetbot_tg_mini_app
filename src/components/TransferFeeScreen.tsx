import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import telegramService from '../services/telegram';
import { gradients, cardStyles, layouts } from '../theme/dark';

interface TransferFeeScreenProps {
  sourceAccount: string;
  destAccount: string;
  sourceCurrency: string;
  destCurrency: string;
  exitFee: string;
  entryFee: string;
  isAvailable?: boolean;
  onBack: () => void;
  onExitFeeChange: (value: string) => void;
  onEntryFeeChange: (value: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

const TransferFeeScreen: React.FC<TransferFeeScreenProps> = ({
  sourceAccount,
  destAccount,
  sourceCurrency,
  destCurrency,
  exitFee,
  entryFee,
  isAvailable,
  onBack,
  onExitFeeChange,
  onEntryFeeChange,
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

  const handleExitFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      onExitFeeChange(value);
    }
  };

  const handleEntryFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      onEntryFeeChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onNext();
    }
  };

  const handleSkipFees = () => {
    onExitFeeChange('0');
    onEntryFeeChange('0');
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
        {/* Exit Fee (From Account) */}
        <div className={`${cardStyles.container} mb-2`}>
          <p className="text-xs text-gray-400 mb-2">Exit Fee from: {sourceAccount}</p>
          <div className="text-center overflow-x-auto">
            <div className="flex items-baseline justify-center gap-1 px-2 min-w-full">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={exitFee}
                onChange={handleExitFeeChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                className={`text-4xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-gray-600 min-w-0 ${
                  exitFee ? 'text-right' : 'text-center'
                }`}
                style={{
                  width: exitFee ? `${Math.min(exitFee.length * 0.65, 12)}em` : '2em',
                  maxWidth: '100%'
                }}
                autoFocus
              />
              {exitFee && (
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

        {/* Entry Fee (To Account) */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-400 mb-2">Entry Fee to: {destAccount}</p>
          <div className="text-center overflow-x-auto">
            <div className="flex items-baseline justify-center gap-1 px-2 min-w-full">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={entryFee}
                onChange={handleEntryFeeChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                className={`text-4xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-gray-600 min-w-0 ${
                  entryFee ? 'text-right' : 'text-center'
                }`}
                style={{
                  width: entryFee ? `${Math.min(entryFee.length * 0.65, 12)}em` : '2em',
                  maxWidth: '100%'
                }}
              />
              {entryFee && (
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
