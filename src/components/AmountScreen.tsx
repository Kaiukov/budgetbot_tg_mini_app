import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncService } from '../services/sync';
import telegramService from '../services/telegram';
import type { TransactionData } from '../hooks/useTransactionData';
import { gradients, cardStyles, layouts } from '../theme/dark';
import { needsConversion, normalizeCurrency } from '../utils/currency';

// Modes allow reuse for withdrawal/deposit (single) and transfer (dual)
type AmountScreenMode = 'single' | 'transfer';

interface AmountScreenProps {
  // Mode (defaults: infer transfer when destination props are provided)
  mode?: AmountScreenMode;

  // Single-amount (withdrawal/deposit)
  account?: string;
  amount?: string;
  transactionData?: TransactionData;
  conversionAmount?: number | null;
  isLoadingConversion?: boolean;

  // Dual-amount (transfer)
  sourceAccount?: string;
  destAccount?: string;
  sourceCurrency?: string;
  destCurrency?: string;
  sourceAmount?: string;
  destAmount?: string;
  exchangeRate?: number | null;

  // Shared
  errors?: Record<string, string>;
  isAvailable?: boolean;
  canProceed?: boolean;
  onBack: () => void;
  onAmountChange?: (value: string) => void; // single mode
  onSourceAmountChange?: (value: string) => void; // transfer mode
  onDestAmountChange?: (value: string) => void; // transfer mode
  onExchangeRateChange?: (rate: number | null) => void; // transfer mode
  onConversionAmountChange?: (amount: number | null) => void; // single mode EUR conversion
  onIsLoadingConversionChange?: (isLoading: boolean) => void; // single mode EUR conversion
  onClearError?: () => void;
  onNext: () => void;
}

const sanitizeNumberInput = (raw: string): string | null => {
  let value = raw.replace(/,/g, '.');
  if (value.includes('-')) return null;
  if (value === '' || /^\d*\.?\d*$/.test(value)) {
    if (value.startsWith('.')) value = '0' + value;
    return value;
  }
  return null;
};

const AmountScreen: React.FC<AmountScreenProps> = (props) => {
  const inferredMode: AmountScreenMode = props.mode
    ? props.mode
    : props.destAccount || props.destCurrency || props.destAmount
    ? 'transfer'
    : 'single';

  if (inferredMode === 'transfer') {
    return <TransferAmountVariant {...props} />;
  }
  return <SingleAmountVariant {...props} />;
};

// -----------------------------------------------------------------------------
// Single-amount variant (withdrawal / deposit)
// -----------------------------------------------------------------------------
const SingleAmountVariant: React.FC<AmountScreenProps> = ({
  account = '',
  amount = '',
  transactionData,
  conversionAmount: propConversionAmount,
  isLoadingConversion: propIsLoadingConversion,
  errors = {},
  isAvailable,
  onBack,
  onAmountChange,
  onConversionAmountChange,
  onIsLoadingConversionChange,
  onClearError,
  canProceed,
  onNext,
}) => {
  const [conversionAmount, setConversionAmount] = useState<number | null>(propConversionAmount ?? null);
  const [isLoadingConversion, setIsLoadingConversion] = useState(propIsLoadingConversion ?? false);
  const [conversionError, setConversionError] = useState(false);

  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  const currencyCode = normalizeCurrency(transactionData?.account_currency || '');
  const conversionRequired = needsConversion(currencyCode);

  useEffect(() => {
    const fetchConversion = async () => {
      if (!amount || !currencyCode || !conversionRequired) {
        setConversionAmount(null);
        onConversionAmountChange?.(null as any);
        return;
      }

      setConversionAmount(null);
      onConversionAmountChange?.(null as any);
      setConversionError(false);

      setIsLoadingConversion(true);
      onIsLoadingConversionChange?.(true);
      try {
        const numAmount = parseFloat(amount);
        if (numAmount > 0) {
          const converted = await syncService.getExchangeRate(currencyCode, 'EUR', numAmount);
          setConversionAmount(converted);
          onConversionAmountChange?.(converted);
        }
      } catch (error) {
        console.error('❌ Failed to fetch conversion:', error);
        setConversionAmount(null);
        onConversionAmountChange?.(null as any);
        setConversionError(true);
      } finally {
        setIsLoadingConversion(false);
        onIsLoadingConversionChange?.(false);
      }
    };

    const timer = setTimeout(fetchConversion, 500);
    return () => clearTimeout(timer);
  }, [amount, currencyCode, conversionRequired, onConversionAmountChange, onIsLoadingConversionChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeNumberInput(e.target.value);
    if (value === null) return;
    onAmountChange?.(value);
    if (value && parseFloat(value) > 0 && onClearError) onClearError();
  };

  const isValidAmount = amount && parseFloat(amount) > 0;
  const hasConversionResult = !conversionRequired || (conversionAmount !== null && conversionAmount !== 0);
  const derivedNextEnabled = Boolean(isValidAmount && hasConversionResult && (!conversionRequired || !isLoadingConversion));
  const isNextEnabled = canProceed ?? derivedNextEnabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isNextEnabled) {
      onNext();
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
        <h1 className="text-2xl font-bold">Enter Amount</h1>
      </div>

      <div className={layouts.contentWide}>
        {errors.validation && (
          <div className="mb-3 p-3 rounded-lg bg-red-900/30 border border-red-600/50">
            <p className="text-xs text-red-200">{errors.validation}</p>
          </div>
        )}

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

          {currencyCode && conversionRequired && (
            <div className="mt-3 pt-3 border-t border-gray-700 text-center">
              {isLoadingConversion ? (
                <p className="text-xs text-gray-500">Converting...</p>
              ) : conversionAmount !== null ? (
                <p className="text-sm text-gray-400">{conversionAmount.toFixed(2)} EUR</p>
              ) : conversionError ? (
                <p className="text-xs text-red-300">Conversion unavailable, please retry</p>
              ) : (
                <p className="text-xs text-gray-500">Waiting for conversion…</p>
              )}
            </div>
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

// -----------------------------------------------------------------------------
// Transfer (dual-amount) variant
// -----------------------------------------------------------------------------
const TransferAmountVariant: React.FC<AmountScreenProps> = ({
  sourceAccount = '',
  destAccount = '',
  sourceCurrency = '',
  destCurrency = '',
  sourceAmount = '',
  destAmount = '',
  exchangeRate,
  errors = {},
  isAvailable,
  onBack,
  onSourceAmountChange,
  onDestAmountChange,
  onExchangeRateChange,
  onClearError,
  canProceed,
  onNext,
}) => {
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);
  const [suggestedAmount, setSuggestedAmount] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState(false);
  const [destManuallyEdited, setDestManuallyEdited] = useState(false);

  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  const sourceCurrencyCode = sourceCurrency?.toUpperCase() || 'EUR';
  const destCurrencyCode = destCurrency?.toUpperCase() || 'EUR';
  const isSameCurrency = sourceCurrencyCode === destCurrencyCode;

  // Reset manual edit flag & suggestions when destination account changes
  useEffect(() => {
    setDestManuallyEdited(false);
    setSuggestedAmount(null);
  }, [destAccount, destCurrencyCode]);

  // Same-currency: auto-copy amount and set exchange rate to 1 (only when changed)
  useEffect(() => {
    const desiredRate = isSameCurrency ? 1 : null;
    if (onExchangeRateChange && desiredRate !== exchangeRate) {
      onExchangeRateChange(desiredRate);
    }

    if (isSameCurrency && onDestAmountChange && destAmount !== sourceAmount) {
      onDestAmountChange(sourceAmount || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSameCurrency, sourceAmount, destAmount, exchangeRate, sourceCurrencyCode, destCurrencyCode]);

  // Fetch conversion for cross-currency transfers
  useEffect(() => {
    if (isSameCurrency) {
      setSuggestedAmount(null);
      setIsLoadingConversion(false);
      setConversionError(false);
      return;
    }

    const numAmount = parseFloat(sourceAmount || '');
    if (!sourceAmount || isNaN(numAmount) || numAmount <= 0) {
      setSuggestedAmount(null);
      setConversionError(false);
      onExchangeRateChange?.(null);
      return;
    }

    const fetchConversion = async () => {
      setIsLoadingConversion(true);
      setConversionError(false);
      try {
        const converted = await syncService.getExchangeRate(sourceCurrencyCode, destCurrencyCode, numAmount);
        if (converted !== null) {
          const rate = converted / numAmount;
          if (onExchangeRateChange && rate !== exchangeRate) {
            onExchangeRateChange(rate);
          }
          const asString = converted.toFixed(2);
          setSuggestedAmount(asString);
          if (!destManuallyEdited && onDestAmountChange && destAmount !== asString) {
            onDestAmountChange(asString);
          }
        } else {
          onExchangeRateChange?.(null);
          setSuggestedAmount(null);
          setConversionError(true);
        }
      } catch (error) {
        console.error('Failed to fetch conversion:', error);
        onExchangeRateChange?.(null);
        setSuggestedAmount(null);
        setConversionError(true);
      } finally {
        setIsLoadingConversion(false);
      }
    };

    const timer = setTimeout(fetchConversion, 500);
    return () => clearTimeout(timer);
  }, [destCurrencyCode, destManuallyEdited, destAmount, exchangeRate, isSameCurrency, onDestAmountChange, onExchangeRateChange, sourceAmount, sourceCurrencyCode]);

  const handleSourceAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeNumberInput(e.target.value);
    if (value === null) return;
    onSourceAmountChange?.(value);
    if (isSameCurrency && onDestAmountChange) {
      onDestAmountChange(value);
    }
    if (value && parseFloat(value) > 0 && onClearError) onClearError();
    // If user edits source again, allow auto-fill to override dest unless user re-edits dest later
    setDestManuallyEdited(false);
  };

  const handleDestAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeNumberInput(e.target.value);
    if (value === null) return;
    setDestManuallyEdited(true);
    onDestAmountChange?.(value);
    if (value && parseFloat(value) > 0 && onClearError) onClearError();
  };

  const handleUseSuggestedAmount = () => {
    if (suggestedAmount && onDestAmountChange) {
      onDestAmountChange(suggestedAmount);
      setDestManuallyEdited(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isNextEnabled) {
      onNext();
    }
  };

  const sourceValid = sourceAmount && parseFloat(sourceAmount) > 0;
  const destValid = destAmount && parseFloat(destAmount) > 0;
  const rateValid = exchangeRate !== null && exchangeRate !== undefined && exchangeRate !== 0;
  const derivedNextEnabled = Boolean(sourceValid && destValid && rateValid && !isLoadingConversion);
  const isNextEnabled = canProceed ?? derivedNextEnabled;

  const displayRate = (() => {
    if (isSameCurrency) return 1;
    if (exchangeRate) return exchangeRate;
    const s = parseFloat(sourceAmount || '');
    const d = parseFloat(destAmount || '');
    if (s > 0 && d > 0) return d / s;
    return null;
  })();

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
        {errors.validation && (
          <div className="mb-3 p-3 rounded-lg bg-red-900/30 border border-red-600/50">
            <p className="text-xs text-red-200">{errors.validation}</p>
          </div>
        )}

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

        <div className="flex items-center justify-center py-2">
          <div className="text-gray-500 text-sm">
            {!isSameCurrency && isLoadingConversion ? 'Converting...' : '↓'}
          </div>
        </div>

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
                style={{
                  width: destAmount
                    ? `${Math.min(destAmount.length * 0.65, 12)}em`
                    : suggestedAmount
                    ? `${Math.min(suggestedAmount.length * 0.65 + 1, 12)}em`
                    : '2em',
                  maxWidth: '100%',
                }}
              />
              {destAmount && (
                <span className="text-2xl font-semibold text-gray-400 whitespace-nowrap ml-1">
                  {destCurrencyCode}
                </span>
              )}
            </div>
          </div>

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

          {!isSameCurrency && displayRate && (
            <div className="mt-3 pt-3 border-t border-gray-700 text-center">
              <p className="text-xs text-gray-500">
                Rate: 1 {sourceCurrencyCode} ≈ {Number(displayRate).toFixed(4)} {destCurrencyCode}
              </p>
            </div>
          )}

          {!isSameCurrency && conversionError && (
            <div className="mt-3 pt-3 border-t border-gray-700 text-center">
              <p className="text-xs text-red-300">Conversion unavailable, please retry</p>
            </div>
          )}
        </div>

        {isSameCurrency && (
          <p className="text-xs text-gray-500 text-center mb-4">Same currency transfer</p>
        )}

        {!isSameCurrency && (
          <p className="text-xs text-gray-500 text-center mb-4">Manual entry enabled - enter your desired amount</p>
        )}

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
