import { ArrowLeft } from 'lucide-react';

interface AmountScreenProps {
  account: string;
  amount: string;
  onBack: () => void;
  onAmountChange: (value: string) => void;
  onNext: () => void;
}

const AmountScreen: React.FC<AmountScreenProps> = ({
  account,
  amount,
  onBack,
  onAmountChange,
  onNext
}) => {
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
    if (e.key === 'Enter' && amount) {
      onNext();
    }
  };

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
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            value={amount}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="0"
            className="w-full p-4 text-3xl font-bold text-center bg-transparent text-white border-none focus:outline-none placeholder-gray-600"
            autoFocus
          />
          <div className="text-center text-gray-500 text-2xl">₴</div>
        </div>

        <button
          onClick={onNext}
          disabled={!amount}
          className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition active:scale-98"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AmountScreen;
