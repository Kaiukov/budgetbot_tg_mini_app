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
  errors?: Record<string, string>;
  onBack: () => void;
  onSourceFeeChange: (value: string) => void;
  onDestFeeChange: (value: string) => void;
  onClearError?: () => void;
  onNext: () => void;
}

const sanitizeFeeInput = (raw: string): string | null => {
  if (raw === '') return '';

  let value = raw.replace(/,/g, '.');
  if (value.includes('-')) return null;
  if (!/^\d*\.?\d*$/.test(value)) return null;
  if (value.startsWith('.')) value = '0' + value;

  const [intRaw, frac] = value.split('.');
  let intPart = intRaw.replace(/^0+(?=\d)/, ''); // strip leading zeros but keep single zero
  if (intPart === '') intPart = '0';

  return frac !== undefined ? `${intPart}${frac === '' ? '.' : '.' + frac}` : intPart;
};

const TransferFeeScreen: React.FC<TransferFeeScreenProps> = ({
  sourceAccount,
  destAccount,
  sourceCurrency,
  destCurrency,
  sourceFee,
  destFee,
  isAvailable,
  errors,
  onBack,
  onSourceFeeChange,
  onDestFeeChange,
  onClearError,
  onNext
}) => {
  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  const sourceCurrencyCode = sourceCurrency?.toUpperCase() || 'EUR';
  const destCurrencyCode = destCurrency?.toUpperCase() || 'EUR';

  const handleSourceFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeFeeInput(e.target.value);
    if (value === null) return;
    onSourceFeeChange(value);
    if (onClearError) onClearError();
  };

  const handleDestFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeFeeInput(e.target.value);
    if (value === null) return;
    onDestFeeChange(value);
    if (onClearError) onClearError();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onNext();
    }
  };

  const hasError = Boolean(errors?.validation);

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
        {hasError && (
          <div className="mb-3 p-3 rounded-lg bg-red-900/30 border border-red-600/50">
            <p className="text-xs text-red-200">{errors?.validation}</p>
          </div>
        )}

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
        <button
          onClick={onNext}
          className="w-full bg-blue-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition active:scale-98"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TransferFeeScreen;
