import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { syncService } from '../services/sync';
import telegramService from '../services/telegram';
import { gradients, cardStyles, layouts } from '../theme/dark';

interface AmountScreenProps {
  account: string;
  amount: string;
  accountCurrency?: string;
  isAvailable?: boolean;
  onBack: () => void;
  onAmountChange: (value: string) => void;
  onAmountForeignChange?: (value: string) => void;
  onNext: () => void;
}

const AmountScreen: React.FC<AmountScreenProps> = ({
  account,
  amount,
  accountCurrency,
  isAvailable,
  onBack,
  onAmountChange,
  onAmountForeignChange,
  onNext
}) => {
  const [conversionAmount, setConversionAmount] = useState<number | null>(null);
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  // Get currency code, default to EUR if not available
  const currencyCode = accountCurrency?.toUpperCase() || 'EUR';
  const requiresConversion = currencyCode !== 'EUR';

  const parsedAmount = amount ? Number(amount) : NaN;
  const isValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;

  // Fetch EUR conversion when amount or currency changes
  const convertToEur = useCallback(async (cancelRef?: { cancelled: boolean }) => {
    if (!requiresConversion || !isValidAmount) {
      setConversionAmount(null);
      setConversionError(null);
      onAmountForeignChange?.('');
      setIsLoadingConversion(false);
      return;
    }

    setIsLoadingConversion(true);
    setConversionError(null);

    try {
      const converted = await syncService.getExchangeRate(currencyCode, 'EUR', parsedAmount);
      if (cancelRef?.cancelled) return;

      if (converted === null || !Number.isFinite(converted)) {
        setConversionAmount(null);
        setConversionError('Conversion unavailable. Please retry.');
        onAmountForeignChange?.('');
        return;
      }

      setConversionAmount(converted);
      onAmountForeignChange?.(converted.toFixed(2));
    } catch (error) {
      if (cancelRef?.cancelled) return;
      console.error('Failed to fetch conversion:', error);
      setConversionAmount(null);
      setConversionError('Conversion failed. Please retry.');
      onAmountForeignChange?.('');
    } finally {
      if (!cancelRef?.cancelled) {
        setIsLoadingConversion(false);
      }
    }
  }, [currencyCode, isValidAmount, onAmountForeignChange, parsedAmount, requiresConversion]);

  useEffect(() => {
    let cancelled = false;

    // Only show conversion when needed and amount is valid
    if (!requiresConversion || !isValidAmount) {
      setConversionAmount(null);
      setConversionError(null);
      onAmountForeignChange?.('');
      setIsLoadingConversion(false);
      return undefined;
    }

    const cancelRef = { cancelled };
    const timer = setTimeout(() => {
      void convertToEur(cancelRef);
    }, 500);

    return () => {
      cancelRef.cancelled = true;
      cancelled = true;
      clearTimeout(timer);
    };
  }, [convertToEur, currencyCode, isValidAmount, onAmountForeignChange, parsedAmount, requiresConversion]);

  const handleRetryConversion = () => {
    void convertToEur();
  };

  const normalizeAmountInput = (rawValue: string) => {
    let value = rawValue.replace(/,/g, '.');

    // Reject if it contains minus sign (negative amounts not allowed)
    if (value.includes('-')) {
      return null;
    }

    // Allow only numbers and one decimal point
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return null;
    }

    if (value.startsWith('.')) {
      value = '0' + value;
    }

    // Trim redundant leading zeros (keep single zero before decimals)
    if (value.startsWith('0') && !value.startsWith('0.') && value.length > 1) {
      value = value.replace(/^0+/, '');
      if (value === '') {
        value = '0';
      }
    }

    return value;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = normalizeAmountInput(e.target.value);
    if (value === null) return;

    setConversionError(null);
    onAmountChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValidAmount && isNextEnabled) {
      onNext();
    }
  };

  const isNextEnabled = isValidAmount && (!requiresConversion || (conversionAmount !== null && !conversionError && !isLoadingConversion));

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
                  ) : conversionAmount !== null && !conversionError ? (
                    <p className="text-sm text-gray-400">
                      ≈ {conversionAmount.toFixed(2)} EUR
                    </p>
                  ) : conversionError ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-xs text-red-400">{conversionError}</p>
                      <button
                        onClick={handleRetryConversion}
                        className="text-xs text-blue-400 hover:text-blue-300 transition"
                      >
                        Retry
                      </button>
                    </div>
                  ) : null}
            </div>
          )}

          {amount && !isValidAmount && (
            <p className="text-xs text-red-400 mt-2 text-center">Enter a valid amount greater than zero</p>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!isNextEnabled}
          className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition active:scale-98"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AmountScreen;
