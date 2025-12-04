import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncService } from '../services/sync';
import telegramService from '../services/telegram';
import { gradients, cardStyles, layouts } from '../theme/dark';

interface TransferAmountScreenProps {
  sourceAccount: string;
  destAccount: string;
  sourceCurrency: string;
  destCurrency: string;
  sourceAmount: string;
  destAmount: string;
  exchangeRate: number | null;
  errors?: Record<string, string>;
  isAvailable?: boolean;
  onBack: () => void;
  onSourceAmountChange: (value: string) => void;
  onDestAmountChange: (value: string) => void;
  onExchangeRateChange: (rate: number) => void;
  onNext: () => void;
  onClearError?: () => void;
}

const TransferAmountScreen: React.FC<TransferAmountScreenProps> = ({
  sourceAccount,
  destAccount,
  sourceCurrency,
  destCurrency,
  sourceAmount,
  destAmount,
  // exchangeRate prop is used indirectly via onExchangeRateChange callback
  errors = {},
  isAvailable,
  onBack,
  onSourceAmountChange,
  onDestAmountChange,
  onExchangeRateChange,
  onNext,
  onClearError
}) => {
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);
  const [suggestedAmount, setSuggestedAmount] = useState<string | null>(null);

  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  const sourceCurrencyCode = sourceCurrency?.toUpperCase() || 'EUR';
  const destCurrencyCode = destCurrency?.toUpperCase() || 'EUR';
  const isSameCurrency = sourceCurrencyCode === destCurrencyCode;

  // Calculate suggested conversion amount for different currencies
  useEffect(() => {
    const fetchConversion = async () => {
      if (isSameCurrency || !sourceAmount) {
        setSuggestedAmount(null);
        return;
      }

      setIsLoadingConversion(true);
      try {
        const numAmount = parseFloat(sourceAmount);
        if (numAmount > 0) {
          const converted = await syncService.getExchangeRate(
            sourceCurrencyCode,
            destCurrencyCode,
            numAmount
          );
          if (converted !== null) {
            setSuggestedAmount(converted.toFixed(2));
            onExchangeRateChange(converted);
          }
        }
      } catch (error) {
        console.error('Failed to fetch conversion:', error);
        setSuggestedAmount(null);
      } finally {
        setIsLoadingConversion(false);
      }
    };

    // Debounce the conversion fetch
    const timer = setTimeout(fetchConversion, 500);
    return () => clearTimeout(timer);
  }, [sourceAmount, sourceCurrencyCode, destCurrencyCode, isSameCurrency, onExchangeRateChange]);

  const handleSourceAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Replace comma with dot for decimal separator
    value = value.replace(/,/g, '.');

    // Reject if it contains minus sign (negative amounts not allowed)
    if (value.includes('-')) {
      return;
    }

    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Add leading zero if input starts with decimal point (e.g., ".5" → "0.5")
      if (value.startsWith('.')) {
        value = '0' + value;
      }
      onSourceAmountChange(value);

      // Clear validation error when user types a valid source amount
      if (value && parseFloat(value) > 0 && onClearError) {
        onClearError();
      }
    }
  };

  const handleDestAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Replace comma with dot for decimal separator
    value = value.replace(/,/g, '.');

    // Reject if it contains minus sign (negative amounts not allowed)
    if (value.includes('-')) {
      return;
    }

    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Add leading zero if input starts with decimal point (e.g., ".5" → "0.5")
      if (value.startsWith('.')) {
        value = '0' + value;
      }
      onDestAmountChange(value);

      // Clear validation error when user types a valid destination amount
      if (value && parseFloat(value) > 0 && onClearError) {
        onClearError();
      }
    }
  };

  const handleUseSuggestedAmount = () => {
    if (suggestedAmount) {
      onDestAmountChange(suggestedAmount);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValidAmounts()) {
      onNext();
    }
  };

  const isValidAmounts = () => {
    const sourceValid = sourceAmount && parseFloat(sourceAmount) > 0;
    const destValid = destAmount && parseFloat(destAmount) > 0;
    return sourceValid && destValid;
  };

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold">Transfer Amount</h1>
      </div>

      <div className={layouts.contentWide}>
        {/* Validation Error */}
        {errors.validation && (
          <div className="mb-3 p-3 rounded-lg bg-red-900/30 border border-red-600/50">
            <p className="text-xs text-red-200">{errors.validation}</p>
          </div>
        )}

        {/* Source Amount (From Account) */}
        <div className={`${cardStyles.container} mb-2`}>
          <p className="text-xs text-gray-400 mb-2">From: {sourceAccount}</p>
          <div className="text-center overflow-x-auto">
            <div className="flex items-baseline justify-center gap-1 px-2 min-w-full">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={sourceAmount}
                onChange={handleSourceAmountChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                className={`text-4xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-gray-600 min-w-0 ${
                  sourceAmount ? 'text-right' : 'text-center'
                }`}
                style={{ width: sourceAmount ? `${Math.min(sourceAmount.length * 0.65, 12)}em` : '2em', maxWidth: '100%' }}
                autoFocus
              />
              {sourceAmount && (
                <span className="text-2xl font-semibold text-gray-400 whitespace-nowrap ml-1">
                  {sourceCurrencyCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Currency Conversion Arrow/Indicator */}
        <div className="flex items-center justify-center py-2">
          <div className="text-gray-500 text-sm">
            {!isSameCurrency && isLoadingConversion ? 'Converting...' : '↓'}
          </div>
        </div>

        {/* Destination Amount (To Account) */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-400 mb-2">To: {destAccount}</p>
          <div className="text-center overflow-x-auto">
            <div className="flex items-baseline justify-center gap-1 px-2 min-w-full">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={destAmount}
                onChange={handleDestAmountChange}
                onKeyDown={handleKeyDown}
                placeholder={suggestedAmount || '0'}
                className={`text-4xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-gray-600 min-w-0 ${
                  destAmount ? 'text-right' : 'text-center'
                }`}
                style={{ width: destAmount ? `${Math.min(destAmount.length * 0.65, 12)}em` : suggestedAmount ? `${Math.min(suggestedAmount.length * 0.65 + 1, 12)}em` : '2em', maxWidth: '100%' }}
              />
              {destAmount && (
                <span className="text-2xl font-semibold text-gray-400 whitespace-nowrap ml-1">
                  {destCurrencyCode}
                </span>
              )}
            </div>
          </div>

          {/* Show suggested amount button for different currencies */}
          {!isSameCurrency && suggestedAmount && suggestedAmount !== destAmount && (
            <div className="mt-3 pt-3 border-t border-gray-700 text-center">
              <button
                onClick={handleUseSuggestedAmount}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                Use suggested: {suggestedAmount} {destCurrencyCode}
              </button>
            </div>
          )}

          {/* Show exchange rate info */}
          {!isSameCurrency && sourceAmount && destAmount && (
            <div className="mt-3 pt-3 border-t border-gray-700 text-center">
              <p className="text-xs text-gray-500">
                Rate: 1 {sourceCurrencyCode} ≈ {(parseFloat(destAmount) / parseFloat(sourceAmount)).toFixed(4)} {destCurrencyCode}
              </p>
            </div>
          )}
        </div>

        {isSameCurrency && (
          <p className="text-xs text-gray-500 text-center mb-4">
            Same currency transfer
          </p>
        )}

        {!isSameCurrency && (
          <p className="text-xs text-gray-500 text-center mb-4">
            Manual entry enabled - enter your desired amount
          </p>
        )}

        <button
          onClick={onNext}
          disabled={!isValidAmounts()}
          className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition active:scale-98"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TransferAmountScreen;
