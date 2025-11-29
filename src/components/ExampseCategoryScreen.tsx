/**
 * TODO: Wire to XState state management (useExpenseFlow hook)
 * This component is currently using props-based state.
 * Will be updated to use: const { state, send } = useExpenseFlow()
 */

interface ExpenseCategoryScreenProps {
  onBack: () => void;
  onSelectCategory?: (category: any) => void;
  onNext: () => void;
}

const ExpenseCategoryScreen: React.FC<ExpenseCategoryScreenProps> = ({ onBack, onNext }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Category</h1>
        <button onClick={onBack} className="text-gray-400 hover:text-white">←</button>
      </div>
      <button onClick={onNext} className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg">
        Next
      </button>
    </div>
  );
};

export default ExpenseCategoryScreen;
