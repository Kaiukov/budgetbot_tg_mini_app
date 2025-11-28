import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncService, type SourceSuggestion } from '../services/sync';
import { useTelegramUser } from '../hooks/useTelegramUser';
import { gradients, layouts } from '../theme/dark';

interface CommentScreenProps {
  comment: string;
  category: string;
  categoryId?: number | string | null;
  onCommentChange: (comment: string) => void;
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
  const [suggestions, setSuggestions] = useState<SourceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useDynamicSuggestions, setUseDynamicSuggestions] = useState(false);

  // Fetch source suggestions when category changes
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
        console.log('🏪 Fetching sources for user/category:', {
          requestedUser: userName,
          requestedCategory: category,
          requestedCategoryId: categoryId
        });

        // Fetch sources filtered by user/category when possible
        const data = await syncService.getSourceNameUsage(userName, categoryId ?? undefined);

        if (data.total === 0) {
          console.log('⚠️ No sources available in API');
          setSuggestions([]);
          setUseDynamicSuggestions(false);
          return;
        }

        // Client-side filtering: filter by category and separate by user
        const allSources = data.get_source_name_usage;
        const matchesCategory = (d: SourceSuggestion) => {
          if (categoryId !== null && categoryId !== undefined) {
            return String(d.category_id ?? '') === String(categoryId);
          }
          return d.category_name === category;
        };

        // Group 1: User's sources in this category
        const userSources = allSources.filter(
          d => d.user_name === userName && matchesCategory(d)
        );

        // Group 2: Other users' sources in this category (for discovery)
        const communitySources = allSources.filter(
          d => matchesCategory(d) && d.user_name !== userName
        );

        // Sort both groups by usage_count DESC
        userSources.sort((a, b) => b.usage_count - a.usage_count);
        communitySources.sort((a, b) => b.usage_count - a.usage_count);

        // Combine: user's first, then community
        const combinedSuggestions = [...userSources, ...communitySources];

        console.log('✅ Client-side filtered sources:', {
          requestedUser: userName,
          requestedCategory: category,
          totalFetched: allSources.length,
          userSources: userSources.length,
          communitySources: communitySources.length,
          combined: combinedSuggestions.length,
          sample: combinedSuggestions.slice(0, 3).map(d => ({
            name: d.source_name,
            user: d.user_name,
            usage: d.usage_count
          }))
        });

        if (combinedSuggestions.length > 0) {
          setSuggestions(combinedSuggestions);
          setUseDynamicSuggestions(true);
        } else {
          console.log('⚠️ No sources found for this category, using empty list');
          setSuggestions([]);
          setUseDynamicSuggestions(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load suggestions';
        console.error('❌ Error fetching source suggestions:', errorMessage);
        setError(errorMessage);
        setSuggestions([]);
        setUseDynamicSuggestions(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinationSuggestions();
  }, [category, categoryId, userName]);

  // Get display suggestions - use dynamic if available, otherwise empty list
  const displaySuggestions = useDynamicSuggestions && suggestions.length > 0
    ? suggestions.map(s => s.source_name)
    : [];

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
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
