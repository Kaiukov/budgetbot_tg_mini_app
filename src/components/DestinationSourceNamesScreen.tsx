import { ArrowLeft, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncService } from '../services/sync';
import telegramService from '../services/telegram';
import { useTelegramUser } from '../hooks/useTelegramUser';
import { gradients, layouts } from '../theme/dark';

interface DestinationSourceNamesScreenProps {
  // Mode: determines which flow (withdrawal=destination, deposit=source)
  transactionType: 'withdrawal' | 'deposit';

  // Common props for both flows
  name: string; // destination_name or source_name
  category_name: string;
  category_id?: number;

  // Callbacks (polymorphic, handled internally)
  onNameChange: (id: number | string, name: string) => void;
  onNext: () => void;
  onBack: () => void;

  // Optional props for machine integration
  suggestions?: any[];
  isLoadingSuggestions?: boolean;
  suggestionsError?: string | null;
  isAvailable?: boolean;
  onSuggestionsChange?: (suggestions: any[]) => void;
  onLoadingSuggestionsChange?: (isLoading: boolean) => void;
  onSuggestionsErrorChange?: (error: string | null) => void;
}

const DestinationSourceNamesScreen: React.FC<DestinationSourceNamesScreenProps> = ({
  transactionType,
  name,
  category_name,
  category_id,
  suggestions: propSuggestions,
  isLoadingSuggestions: propIsLoadingSuggestions,
  suggestionsError: propSuggestionsError,
  isAvailable,
  onBack,
  onNameChange,
  onSuggestionsChange,
  onLoadingSuggestionsChange,
  onSuggestionsErrorChange,
  onNext
}) => {
  const { user_name } = useTelegramUser();
  const effectiveUser = user_name === 'User' || user_name === 'Guest' ? undefined : user_name;
  const enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

  // Use prop values if provided (from machine), otherwise use local state
  const [suggestions, setSuggestions] = useState<any[]>(
    propSuggestions ? (propSuggestions as any[]) : []
  );
  const [loading, setLoading] = useState(propIsLoadingSuggestions ?? false);
  const [error, setError] = useState<string | null>(propSuggestionsError ?? null);

  // Context-aware text based on transaction type
  const headerText = transactionType === 'withdrawal' ? 'Destination' : 'Source Name';
  const inputPlaceholder =
    transactionType === 'withdrawal' ? 'Type destination or free text...' : 'Enter source name';
  const quickLabel =
    transactionType === 'withdrawal' ? 'Quick destinations:' : 'Quick sources:';
  const errorContext = transactionType === 'withdrawal' ? 'destinations' : 'sources';
  const logContext = transactionType === 'withdrawal' ? 'destination' : 'source';

  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  // Fetch suggestions when category changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!category_name) {
        setSuggestions([]);
        onSuggestionsChange?.([]);
        return;
      }

      // Early return if no effective user
      if (!effectiveUser) {
        setSuggestions([]);
        onSuggestionsChange?.([]);
        return;
      }

      setLoading(true);
      onLoadingSuggestionsChange?.(true);
      setError(null);
      onSuggestionsErrorChange?.(null);

      try {
        if (enableDebugLogs) {
          console.log(`🔍 Fetching ${logContext} suggestions filtered by category:`, {
            requestedUser: effectiveUser,
            requestedCategory: category_name || 'unspecified',
            category_id,
            transactionType
          });
        }

        // Fetch suggestions filtered by user and category
        const data =
          transactionType === 'withdrawal'
            ? await syncService.getDestinationNameUsage(effectiveUser, category_id)
            : await syncService.getSourceNameUsage(effectiveUser, category_id);

        if (data.total === 0) {
          if (enableDebugLogs) {
            console.log(`⚠️ No ${errorContext} available in API`);
          }
          setSuggestions([]);
          onSuggestionsChange?.([]);
          return;
        }

        // Backend already filtered by user and category
        const allSuggestions =
          transactionType === 'withdrawal'
            ? (data as any).get_destination_name_usage
            : (data as any).get_source_name_usage;

        // Sort by usage_count DESC
        allSuggestions.sort((a: any, b: any) => b.usage_count - a.usage_count);

        if (enableDebugLogs) {
          console.log(`✅ Backend-filtered ${logContext} suggestions:`, {
            requestedUser: effectiveUser,
            requestedCategory: category_name || 'unspecified',
            category_id,
            totalFetched: allSuggestions.length,
            sample: allSuggestions.slice(0, 3).map((s: any) => ({
              name: transactionType === 'withdrawal' ? s.destination_name : s.source_name,
              user: s.user_name,
              usage: s.usage_count
            }))
          });
        }

        // Cap the list to avoid passing huge payloads through state/IPC
        const limitedSuggestions = allSuggestions.slice(0, 50);

        if (limitedSuggestions.length > 0) {
          setSuggestions(limitedSuggestions);
          onSuggestionsChange?.(limitedSuggestions);
        } else {
          console.log(`⚠️ No ${errorContext} found for this category, using empty list`);
          setSuggestions([]);
          onSuggestionsChange?.([]);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to load ${errorContext}`;
        console.error(`❌ Error fetching ${logContext} suggestions:`, errorMessage);
        setError(errorMessage);
        onSuggestionsErrorChange?.(errorMessage);
        setSuggestions([]);
        onSuggestionsChange?.([]);
      } finally {
        setLoading(false);
        onLoadingSuggestionsChange?.(false);
      }
    };

    fetchSuggestions();
  }, [category_name, category_id, user_name]);

  const handleSelectSuggestion = (suggestion: any) => {
    const nameField =
      transactionType === 'withdrawal' ? suggestion.destination_name : suggestion.source_name;
    const idField =
      transactionType === 'withdrawal' ? suggestion.destination_id : suggestion.source_id;
    onNameChange(parseInt(String(idField)), nameField);
    onNext();
  };

  const handleCustomName = () => {
    if (name.trim()) {
      onNameChange(0, name); // Use 0 for custom entry
      onNext();
    }
  };

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold">{headerText}</h1>
      </div>

      <div className={layouts.content}>
        <div>
          <label className="text-xs text-gray-400 mb-2 block">
            {headerText} name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => onNameChange(0, e.target.value)}
            placeholder={inputPlaceholder}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm border border-gray-700 focus:border-blue-500 focus:outline-none mb-3"
          />
        </div>

        <div className="mt-3">
          {suggestions.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-gray-400">{quickLabel}</p>
                {loading && <Loader size={12} className="animate-spin text-gray-400" />}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 50).map((suggestion: any, idx) => {
                  const displayName =
                    transactionType === 'withdrawal'
                      ? suggestion.destination_name
                      : suggestion.source_name;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition active:scale-95"
                      title={displayName}
                    >
                      {displayName.length > 12
                        ? `${displayName.slice(0, 50)}...`
                        : displayName}
                    </button>
                  );
                })}
              </div>

              {suggestions.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {suggestions.filter(s => s.user_name === user_name).length} of your favorites
                  {suggestions.filter(s => s.user_name !== user_name).length > 0 &&
                    ` + ${suggestions.filter(s => s.user_name !== user_name).length} community suggestions`}
                </p>
              )}
            </>
          )}

          {error && <p className="text-xs text-red-400">Failed to load suggestions</p>}
        </div>

        <button
          onClick={handleCustomName}
          className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition active:scale-98"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DestinationSourceNamesScreen;
