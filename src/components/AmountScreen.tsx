import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncService } from '../services/sync';
import telegramService from '../services/telegram';
import type { TransactionData } from '../hooks/useTransactionData';
import { gradients, cardStyles, layouts } from '../theme/dark';
import ComposeDataDebugPanel from './ComposeDataDebugPanel';

interface AmountScreenProps {
  account: string;
  amount: string;
  transactionData: TransactionData;
  isAvailable?: boolean;
  onBack: () => void;
  onAmountChange: (value: string) => void;
  onAmountForeignChange?: (value: string) => void;
  onNext: () => void;
}

const AmountScreen: React.FC<AmountScreenProps> = ({
  account,
  amount,
  transactionData,
  isAvailable,
  onBack,
  onAmountChange,
  onAmountForeignChange,
  onNext
}) => {
  const [conversionAmount, setConversionAmount] = useState<number | null>(null);
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);

  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  // Get currency code, default to empty string if not available
  const currencyCode = transactionData.account_currency?.toUpperCase() || '';

  // Fetch EUR conversion when amount or currency changes
  useEffect(() => {
    const fetchConversion = async () => {
      // Only show conversion if:
      // 1. We have an amount
      // 2. We have a currency code
      // 3. Currency is NOT EUR (no conversion needed for same currency)
      if (!amount || !currencyCode || currencyCode === 'EUR') {
        setConversionAmount(null);
        onAmountForeignChange?.('');
        return;
      }

      setIsLoadingConversion(true);
      try {
        const numAmount = parseFloat(amount);
        if (!(numAmount > 0)) {
          setConversionAmount(null);
          onAmountForeignChange?.('');
          return;
        }

        const converted = await syncService.getExchangeRate(currencyCode, 'EUR', numAmount);
        setConversionAmount(converted);
        if (converted) {
          onAmountForeignChange?.(converted.toFixed(2));
        }
      } catch (error) {
        console.error('Failed to fetch conversion:', error);
        setConversionAmount(null);
        onAmountForeignChange?.('');
      } finally {
        setIsLoadingConversion(false);
      }
    };

    // Debounce the conversion fetch
    const timer = setTimeout(fetchConversion, 500);
    return () => clearTimeout(timer);
  }, [amount, currencyCode, onAmountForeignChange]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      onAmountChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && amount && parseFloat(amount) > 0) {
      onNext();
    }
  };

  const isValidAmount = amount && parseFloat(amount) > 0;

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold">Enter Amount</h1>
      </div>

      <div className={layouts.contentWide}>
        <div className={`${cardStyles.container} mb-3`}>
          <p className="text-xs text-gray-400 mb-2">Account: {account}</p>
          <div className="text-center overflow-x-auto">
            <div className="flex items-baseline justify-center gap-1 px-2 min-w-full">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={amount}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                className={`text-4xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-gray-600 min-w-0 ${
                  amount ? 'text-right' : 'text-center'
                }`}
                style={{ width: amount ? `${Math.min(amount.length * 0.65, 12)}em` : '2em', maxWidth: '100%' }}
                autoFocus
              />
              {amount && (
                <span className="text-2xl font-semibold text-gray-400 whitespace-nowrap ml-1">
                  {currencyCode || 'EUR'}
                </span>
              )}
            </div>
          </div>

          {/* Show EUR conversion for non-EUR currencies */}
          {currencyCode && currencyCode !== 'EUR' && (
            <div className="mt-3 pt-3 border-t border-gray-700 text-center">
              {isLoadingConversion ? (
                <p className="text-xs text-gray-500">Converting...</p>
              ) : conversionAmount !== null ? (
                <p className="text-sm text-gray-400">
                  {conversionAmount.toFixed(2)} EUR
                </p>
              ) : null}
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!isValidAmount}
          className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition active:scale-98"
        >
          Next
        </button>

        {/* Debug Panel */}
        <ComposeDataDebugPanel transactionData={transactionData} title="Amount Entry State" />
      </div>
    </div>
  );
};

export default AmountScreen;
