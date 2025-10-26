import { ArrowLeft } from 'lucide-react';
import NumberPad from './NumberPad';

interface AmountScreenProps {
  account: string;
  amount: string;
  onBack: () => void;
  onNumberClick: (num: string) => void;
  onDelete: () => void;
  onNext: () => void;
}

const AmountScreen: React.FC<AmountScreenProps> = ({
  account,
  amount,
  onBack,
  onNumberClick,
  onDelete,
  onNext
}) => {
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
          <div className="text-3xl font-bold text-center py-4 text-white">
            {amount || '0'} <span className="text-gray-500">₴</span>
          </div>
        </div>

        <NumberPad
          onNumberClick={onNumberClick}
          onDelete={onDelete}
        />

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
