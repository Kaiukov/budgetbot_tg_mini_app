import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncService } from '../services/sync';

interface TransferAmountScreenProps {
  sourceAccount: string;
  destAccount: string;
  sourceCurrency: string;
  destCurrency: string;
  exitAmount: string;
  entryAmount: string;
  onBack: () => void;
  onExitAmountChange: (value: string) => void;
  onEntryAmountChange: (value: string) => void;
  onNext: () => void;
}

const TransferAmountScreen: React.FC<TransferAmountScreenProps> = ({
  sourceAccount,
  destAccount,
  sourceCurrency,
  destCurrency,
  exitAmount,
  entryAmount,
  onBack,
  onExitAmountChange,
  onEntryAmountChange,
  onNext
}) => {
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);
  const [suggestedAmount, setSuggestedAmount] = useState<string | null>(null);

  const sourceCurrencyCode = sourceCurrency?.toUpperCase() || 'EUR';
  const destCurrencyCode = destCurrency?.toUpperCase() || 'EUR';
  const isSameCurrency = sourceCurrencyCode === destCurrencyCode;

  // Calculate suggested conversion amount for different currencies
  useEffect(() => {
    const fetchConversion = async () => {
      if (isSameCurrency || !exitAmount) {
        setSuggestedAmount(null);
        return;
      }

      setIsLoadingConversion(true);
      try {
        const numAmount = parseFloat(exitAmount);
        if (numAmount > 0) {
          const converted = await syncService.getExchangeRate(
            sourceCurrencyCode,
            destCurrencyCode,
            numAmount
          );
          if (converted !== null) {
            setSuggestedAmount(converted.toFixed(2));
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
  }, [exitAmount, sourceCurrencyCode, destCurrencyCode, isSameCurrency]);

  const handleExitAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      onExitAmountChange(value);
    }
  };

  const handleEntryAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      onEntryAmountChange(value);
    }
  };

  const handleUseSuggestedAmount = () => {
    if (suggestedAmount) {
      onEntryAmountChange(suggestedAmount);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValidAmounts()) {
      onNext();
    }
  };

  const isValidAmounts = () => {
    const exitValid = exitAmount && parseFloat(exitAmount) > 0;
    const entryValid = entryAmount && parseFloat(entryAmount) > 0;
    return exitValid && entryValid;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Transfer Amount</h2>
      </div>

      <div className="p-4">
        {/* Exit Amount (From Account) */}
        <div className="bg-gray-800 rounded-lg p-4 mb-2">
          <p className="text-xs text-gray-400 mb-2">From: {sourceAccount}</p>
          <div className="text-center overflow-x-auto">
            <div className="flex items-baseline justify-center gap-1 px-2 min-w-full">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={exitAmount}
                onChange={handleExitAmountChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                className={`text-4xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-gray-600 min-w-0 ${
                  exitAmount ? 'text-right' : 'text-center'
                }`}
                style={{ width: exitAmount ? `${Math.min(exitAmount.length * 0.65, 12)}em` : '2em', maxWidth: '100%' }}
                autoFocus
              />
              {exitAmount && (
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

        {/* Entry Amount (To Account) */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-400 mb-2">To: {destAccount}</p>
          <div className="text-center overflow-x-auto">
            <div className="flex items-baseline justify-center gap-1 px-2 min-w-full">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={entryAmount}
                onChange={handleEntryAmountChange}
                onKeyDown={handleKeyDown}
                placeholder={suggestedAmount || '0'}
                className={`text-4xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-gray-600 min-w-0 ${
                  entryAmount ? 'text-right' : 'text-center'
                }`}
                style={{ width: entryAmount ? `${Math.min(entryAmount.length * 0.65, 12)}em` : '2em', maxWidth: '100%' }}
              />
              {entryAmount && (
                <span className="text-2xl font-semibold text-gray-400 whitespace-nowrap ml-1">
                  {destCurrencyCode}
                </span>
              )}
            </div>
          </div>

          {/* Show suggested amount button for different currencies */}
          {!isSameCurrency && suggestedAmount && suggestedAmount !== entryAmount && (
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
          {!isSameCurrency && exitAmount && entryAmount && (
            <div className="mt-3 pt-3 border-t border-gray-700 text-center">
              <p className="text-xs text-gray-500">
                Rate: 1 {sourceCurrencyCode} ≈ {(parseFloat(entryAmount) / parseFloat(exitAmount)).toFixed(4)} {destCurrencyCode}
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
