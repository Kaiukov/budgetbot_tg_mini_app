import { ArrowLeft, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncService, type DestinationSuggestion } from '../services/sync';
import telegramService from '../services/telegram';
import { useTelegramUser } from '../hooks/useTelegramUser';
import { gradients, layouts } from '../theme/dark';

interface CommentScreenProps {
  comment: string;
  category: string;
  isAvailable?: boolean;
  onBack: () => void;
  onCommentChange: (comment: string) => void;
  onNext: () => void;
}

const CommentScreen: React.FC<CommentScreenProps> = ({
  comment,
  category,
  isAvailable,
  onBack,
  onCommentChange,
  onNext
}) => {
  const { userName } = useTelegramUser();
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useDynamicSuggestions, setUseDynamicSuggestions] = useState(false);

  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  // Fetch destination suggestions when category changes
  useEffect(() => {
    if (!category || !userName || userName === 'User' || userName === 'Guest') {
      // If no category or unknown user, don't fetch dynamic suggestions
      setSuggestions([]);
      setUseDynamicSuggestions(false);
      return;
    }

    const fetchDestinationSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🏪 Fetching all destinations for client-side filtering:', {
          requestedUser: userName,
          requestedCategory: category
        });

        // Fetch all destinations (no backend filtering)
        const data = await syncService.getDestinationNameUsage();

        if (data.total === 0) {
          console.log('⚠️ No destinations available in API');
          setSuggestions([]);
          setUseDynamicSuggestions(false);
          return;
        }

        // Client-side filtering: filter by category and separate by user
        const allDestinations = data.get_destination_name_usage;

        // Group 1: User's destinations in this category
        const userDestinations = allDestinations.filter(
          d => d.user_name === userName && d.category_name === category
        );

        // Group 2: Other users' destinations in this category (for discovery)
        const communityDestinations = allDestinations.filter(
          d => d.category_name === category && d.user_name !== userName
        );

        // Sort both groups by usage_count DESC
        userDestinations.sort((a, b) => b.usage_count - a.usage_count);
        communityDestinations.sort((a, b) => b.usage_count - a.usage_count);

        // Combine: user's first, then community
        const combinedSuggestions = [...userDestinations, ...communityDestinations];

        console.log('✅ Client-side filtered destinations:', {
          requestedUser: userName,
          requestedCategory: category,
          totalFetched: allDestinations.length,
          userDestinations: userDestinations.length,
          communityDestinations: communityDestinations.length,
          combined: combinedSuggestions.length,
          sample: combinedSuggestions.slice(0, 3).map(d => ({
            name: d.destination_name,
            user: d.user_name,
            usage: d.usage_count
          }))
        });

        if (combinedSuggestions.length > 0) {
          setSuggestions(combinedSuggestions);
          setUseDynamicSuggestions(true);
        } else {
          console.log('⚠️ No destinations found for this category, using empty list');
          setSuggestions([]);
          setUseDynamicSuggestions(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load suggestions';
        console.error('❌ Error fetching destination suggestions:', errorMessage);
        setError(errorMessage);
        setSuggestions([]);
        setUseDynamicSuggestions(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinationSuggestions();
  }, [category, userName]);

  // Get display suggestions - use dynamic if available, otherwise empty list
  const displaySuggestions = useDynamicSuggestions && suggestions.length > 0
    ? suggestions.map(s => s.destination_name)
    : [];

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
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Add comment (optional)"
          className="w-full h-28 p-3 text-sm bg-gray-800 text-white rounded-lg border-none focus:ring-1 focus:ring-gray-700 outline-none resize-none placeholder-gray-500"
        />

        <div className="mt-3">
          {displaySuggestions.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-gray-400">Quick destinations:</p>
                {loading && <Loader size={12} className="animate-spin text-gray-400" />}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {displaySuggestions.slice(0, 50).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => onCommentChange(suggestion)}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition active:scale-95"
                    title={suggestion}
                  >
                    {suggestion.length > 12 ? `${suggestion.slice(0, 50)}...` : suggestion}
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
