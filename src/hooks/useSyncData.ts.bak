import { useState, useCallback } from 'react';

/**
 * Generic hook for fetching data from Sync API
 * Eliminates duplication between accounts and categories fetching
 *
 * @param fetchFn - Function that fetches data from Sync API
 * @param userName - Optional username for filtering
 */
export function useSyncData<T>(
  fetchFn: (userName?: string) => Promise<{ success: boolean; message: string; total: number; [key: string]: any }>,
  userName?: string
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching data for user:', userName);

      // Treat "User" and "Guest" as unknown users (browser mode)
      const isUnknownUser = userName === 'User' || userName === 'Guest';
      const response = await fetchFn(isUnknownUser ? undefined : userName);

      console.log('📊 Fetched data:', {
        total: response.total,
        userName
      });

      // Extract the data array from response (works for both accounts and categories)
      const dataArray = Object.values(response).find(Array.isArray) as T[];
      setData(dataArray || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      console.error('❌ Failed to fetch data:', {
        error: err,
        message: errorMessage,
        userName
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, userName]);

  return {
    data,
    loading,
    error,
    fetchData,
    retry: fetchData
  };
}
