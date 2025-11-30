import { ArrowLeft, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncService, type DestinationSuggestion } from '../services/sync';
import telegramService from '../services/telegram';
import { useTelegramUser } from '../hooks/useTelegramUser';
import { gradients, layouts } from '../theme/dark';

interface CommentScreenProps {
  destination_name: string;
  category_name: string;
  category_id?: number;
  suggestions?: { destination_id: string; destination_name: string; usage_count: number }[];
  isLoadingSuggestions?: boolean;
  suggestionsError?: string | null;
  isAvailable?: boolean;
  onBack: () => void;
  onDestinationChange: (destination_id: number | string, destination_name: string) => void;
  onSuggestionsChange?: (suggestions: any[]) => void;
  onLoadingSuggestionsChange?: (isLoading: boolean) => void;
  onSuggestionsErrorChange?: (error: string | null) => void;
  onNext: () => void;
}

const CommentScreen: React.FC<CommentScreenProps> = ({
  destination_name,
  category_name,
  category_id,
  suggestions: propSuggestions,
  isLoadingSuggestions: propIsLoadingSuggestions,
  suggestionsError: propSuggestionsError,
  isAvailable,
  onBack,
  onDestinationChange,
  onSuggestionsChange,
  onLoadingSuggestionsChange,
  onSuggestionsErrorChange,
  onNext
}) => {
  const { userName } = useTelegramUser();
  // Use prop values if provided (from machine), otherwise use local state
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>(propSuggestions ? propSuggestions as DestinationSuggestion[] : []);
  const [loading, setLoading] = useState(propIsLoadingSuggestions ?? false);
  const [error, setError] = useState<string | null>(propSuggestionsError ?? null);

  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  // Fetch destination suggestions when category changes
  useEffect(() => {
    if (!category_name || !userName || userName === 'User' || userName === 'Guest') {
      // If no category or unknown user, don't fetch suggestions
      setSuggestions([]);
      return;
    }

    const fetchDestinationSuggestions = async () => {
      setLoading(true);
      onLoadingSuggestionsChange?.(true);
      setError(null);
      onSuggestionsErrorChange?.(null);

      try {
        console.log('🏪 Fetching destinations filtered by category:', {
          requestedUser: userName,
          requestedCategory: category_name,
          category_id
        });

        // Fetch destinations filtered by user and category
        const data = await syncService.getDestinationNameUsage(userName, category_id);

        if (data.total === 0) {
          console.log('⚠️ No destinations available in API');
          setSuggestions([]);
          onSuggestionsChange?.([]);
          return;
        }

        // Backend already filtered by user and category
        const allDestinations = data.get_destination_name_usage;

        // Sort by usage_count DESC
        allDestinations.sort((a, b) => b.usage_count - a.usage_count);

        console.log('✅ Backend-filtered destinations:', {
          requestedUser: userName,
          requestedCategory: category_name,
          category_id,
          totalFetched: allDestinations.length,
          sample: allDestinations.slice(0, 3).map(d => ({
            name: d.destination_name,
            user: d.user_name,
            usage: d.usage_count
          }))
        });

        if (allDestinations.length > 0) {
          setSuggestions(allDestinations);
          onSuggestionsChange?.(allDestinations);
        } else {
          console.log('⚠️ No destinations found for this category, using empty list');
          setSuggestions([]);
          onSuggestionsChange?.([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load suggestions';
        console.error('❌ Error fetching destination suggestions:', errorMessage);
        setError(errorMessage);
        onSuggestionsErrorChange?.(errorMessage);
        setSuggestions([]);
        onSuggestionsChange?.([]);
      } finally {
        setLoading(false);
        onLoadingSuggestionsChange?.(false);
      }
    };

    fetchDestinationSuggestions();
  }, [category_name, category_id, userName]);


  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold">Comment</h1>
      </div>

      <div className={layouts.content}>
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Destination/Comment:</label>
          <input
            type="text"
            value={destination_name}
            onChange={(e) => onDestinationChange(0, e.target.value)}
            placeholder="Enter destination or comment..."
            className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm border border-gray-700 focus:border-blue-500 focus:outline-none mb-3"
          />
        </div>

        <div className="mt-3">
          {suggestions.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-gray-400">Quick destinations:</p>
                {loading && <Loader size={12} className="animate-spin text-gray-400" />}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 50).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => onDestinationChange(parseInt(suggestion.destination_id), suggestion.destination_name)}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition active:scale-95"
                    title={suggestion.destination_name}
                  >
                    {suggestion.destination_name.length > 12 ? `${suggestion.destination_name.slice(0, 50)}...` : suggestion.destination_name}
                  </button>
                ))}
              </div>

              {suggestions.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {suggestions.filter(s => s.user_name === userName).length} of your favorites
                  {suggestions.filter(s => s.user_name !== userName).length > 0 && ` + ${suggestions.filter(s => s.user_name !== userName).length} community suggestions`}
                </p>
              )}
            </>
          )}

          {error && (
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
