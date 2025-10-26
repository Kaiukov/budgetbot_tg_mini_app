import { ArrowLeft, X, Check } from 'lucide-react';

interface ConfirmScreenProps {
  account: string;
  amount: string;
  category: string;
  comment: string;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmScreen: React.FC<ConfirmScreenProps> = ({
  account,
  amount,
  category,
  comment,
  onBack,
  onCancel,
  onConfirm
}) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Confirmation</h2>
      </div>

      <div className="p-3">
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-red-500 mb-1">-{amount} ₴</div>
            <p className="text-xs text-gray-400">Expense</p>
          </div>

          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Account:</span>
              <span className="text-xs font-medium text-white">{account}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Category:</span>
              <span className="text-xs font-medium text-white">{category}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-700">
              <span className="text-xs text-gray-400">Comment:</span>
              <span className="text-xs font-medium text-white text-right max-w-[60%]">{comment || 'No comment'}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-xs text-gray-400">Date:</span>
              <span className="text-xs font-medium text-white">{new Date().toLocaleDateString('en-US')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={onCancel}
            className="bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition active:scale-95 flex items-center justify-center text-xs"
          >
            <X size={14} className="mr-1" />
            No
          </button>
          <button
            onClick={onBack}
            className="bg-gray-700 text-white py-2 rounded-lg font-medium hover:bg-gray-600 transition active:scale-95 flex items-center justify-center text-xs"
          >
            <ArrowLeft size={14} className="mr-1" />
            Back
          </button>
          <button
            onClick={onConfirm}
            className="bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition active:scale-95 flex items-center justify-center text-xs"
          >
            <Check size={14} className="mr-1" />
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmScreen;
