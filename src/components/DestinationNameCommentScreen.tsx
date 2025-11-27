import { Loader } from 'lucide-react';
import { useEffect } from 'react';
import { type DestinationSuggestion } from '../services/sync';
import { useTelegramUser } from '../hooks/useTelegramUser';
import { useBudgetStore } from '../store/useBudgetStore';
import { gradients, layouts } from '../theme/dark';

interface CommentScreenProps {
  comment: string;
  category: string;
  categoryId?: number | string | null;
  onCommentChange: (comment: string, destinationId?: string) => void;
  onNext: () => void;
}

const CommentScreen: React.FC<CommentScreenProps> = ({
  comment,
  category,
  categoryId,
  onCommentChange,
  onNext
}) => {
  const { userName } = useTelegramUser();
  const destinations = useBudgetStore(state => state.destinations);
  const destinationsLoading = useBudgetStore(state => state.destinationsLoading);
  const destinationsError = useBudgetStore(state => state.destinationsError);
  const fetchDestinations = useBudgetStore(state => state.fetchDestinations);
  const clearDestinations = useBudgetStore(state => state.clearDestinations);

  // Fetch destination suggestions when category changes
  useEffect(() => {
    if (!category || !userName || userName === 'User' || userName === 'Guest') {
      clearDestinations();
      return;
    }

    fetchDestinations(userName, categoryId ?? category);
  }, [category, categoryId, clearDestinations, fetchDestinations, userName]);

  // Get display suggestions - use dynamic if available, otherwise empty list
  const displaySuggestions = destinations.length > 0
    ? destinations.map((s: DestinationSuggestion) => s.destination_name)
    : [];

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        <h1 className="text-2xl font-bold">Comment</h1>
      </div>

      <div className={layouts.content}>
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value, undefined)}
          placeholder="Add comment (optional)"
          className="w-full h-28 p-3 text-sm bg-gray-800 text-white rounded-lg border-none focus:ring-1 focus:ring-gray-700 outline-none resize-none placeholder-gray-500"
        />

        <div className="mt-3">
          {displaySuggestions.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-gray-400">Quick destinations:</p>
                {destinationsLoading && <Loader size={12} className="animate-spin text-gray-400" />}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {displaySuggestions.slice(0, 50).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const selected = destinations.find(d => d.destination_name === suggestion);
                      onCommentChange(suggestion, selected?.destination_id);
                    }}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition active:scale-95"
                    title={suggestion}
                  >
                    {suggestion.length > 12 ? `${suggestion.slice(0, 50)}...` : suggestion}
                  </button>
                ))}
              </div>

              {destinations.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {destinations.filter(s => s.user_name === userName).length} of your favorites
                  {destinations.filter(s => s.user_name !== userName).length > 0 && ` + ${destinations.filter(s => s.user_name !== userName).length} community suggestions`}
                </p>
              )}
            </>
          )}

          {destinationsError && (
            <p className="text-xs text-red-400">Failed to load suggestions</p>
          )}
        </div>

        <button
          onClick={onNext}
          className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition active:scale-98"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CommentScreen;
