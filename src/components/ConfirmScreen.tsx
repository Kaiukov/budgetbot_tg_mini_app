/**
 * TODO: Wire to XState state management (useExpenseFlow hook)
 * This component is currently using props-based state.
 * Will be updated to use: const { state, send } = useExpenseFlow()
 */

interface ConfirmScreenProps {
  onBack: () => void;
  onSubmit: () => void;
}

const ConfirmScreen: React.FC<ConfirmScreenProps> = ({ onBack, onSubmit }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Confirm</h1>
        <button onClick={onBack} className="text-gray-400 hover:text-white">←</button>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg mb-6 space-y-2">
        <div>Transaction Details</div>
        <div className="text-sm text-gray-400">Ready to submit</div>
      </div>
      <button onClick={onSubmit} className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-lg">
        Submit
      </button>
    </div>
  );
};

export default ConfirmScreen;
