import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncService } from '../services/sync';
import type { ExpenseData } from '../hooks/useExpenseData';

interface AmountScreenProps {
  account: string;
  amount: string;
  expenseData: ExpenseData;
  onBack: () => void;
  onAmountChange: (value: string) => void;
  onNext: () => void;
}

const AmountScreen: React.FC<AmountScreenProps> = ({
  account,
  amount,
  expenseData,
  onBack,
  onAmountChange,
  onNext
}) => {
  const [conversionAmount, setConversionAmount] = useState<number | null>(null);
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);

  // Get currency code, default to empty string if not available
  const currencyCode = expenseData.account_currency?.toUpperCase() || '';

  // Fetch EUR conversion when amount or currency changes
  useEffect(() => {
    const fetchConversion = async () => {
      // Only show conversion if:
      // 1. We have an amount
      // 2. We have a currency code
      // 3. Currency is NOT EUR (no conversion needed for same currency)
      if (!amount || !currencyCode || currencyCode === 'EUR') {
        setConversionAmount(null);
        return;
      }

      setIsLoadingConversion(true);
      try {
        const numAmount = parseFloat(amount);
        if (numAmount > 0) {
          const converted = await syncService.getExchangeRate(currencyCode, 'EUR', numAmount);
          setConversionAmount(converted);
        }
      } catch (error) {
        console.error('Failed to fetch conversion:', error);
        setConversionAmount(null);
      } finally {
        setIsLoadingConversion(false);
      }
    };

    // Debounce the conversion fetch
    const timer = setTimeout(fetchConversion, 500);
    return () => clearTimeout(timer);
  }, [amount, currencyCode]);
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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Enter Amount</h2>
      </div>

      <div className="p-4">
        <div className="bg-gray-800 rounded-lg p-4 mb-3">
          <p className="text-xs text-gray-400 mb-2">Account: {account}</p>
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={amount}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                className="text-4xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-gray-600 text-center min-w-0"
                style={{ width: amount ? `${Math.max(amount.length * 0.6, 1)}em` : '2em' }}
                autoFocus
              />
              {amount && (
                <span className="text-2xl font-semibold text-gray-400">
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
      </div>
    </div>
  );
};

export default AmountScreen;
