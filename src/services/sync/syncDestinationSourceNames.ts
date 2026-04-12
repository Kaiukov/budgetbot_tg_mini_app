/**
 * Sync API - Destination & Source Suggestions
 * Provides methods for fetching destination and source name suggestions
 * Used for withdrawal (destinations) and deposit (sources) flows
 */

import { apiClient } from './apiClient';

// Type definitions (will be moved to types.ts in future refactoring)
interface DestinationSuggestion {
  user_name: string;
  destination_id: string;
  destination_name: string;
  category_id: string;
  category_name: string;
  usage_count: number;
  global_usage?: number;
  user_has_used?: boolean;
}

interface DestinationNameUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_destination_name_usage: DestinationSuggestion[];
  total: number;
}

interface SourceSuggestion {
  user_name: string;
  source_id: string;
  source_name: string;
  category_id: string;
  category_name: string;
  usage_count: number;
  global_usage?: number;
  user_has_used?: boolean;
}

interface SourceNameUsageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  get_source_name_usage: SourceSuggestion[];
  total: number;
}

// ============================================================================
// Destination & Source Service
// ============================================================================

class DestinationSourceService {
  /**
   * Check if service is configured
   */
  private isConfigured(): boolean {
    return apiClient.isConfigured();
  }

  /**
   * Make API request using unified ApiClient with Tier 2 auth
   */
  private async makeRequest<T>(
    endpoint: string,
    options?: { method?: string; body?: any }
  ): Promise<T> {
    const method = options?.method || 'GET';
    return apiClient.request<T>(endpoint, {
      method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      body: options?.body,
      auth: 'tier2',
    });
  }

  /**
   * Get destination name usage data with optional filtering
   * Returns destination list optionally filtered by user and/or category
   *
   * @param user_name - Optional username to filter destinations
   * @param categoryId - Optional category ID to filter destinations by category
   * @returns Destination list for the specified user/category
   */
  public async getDestinationNameUsage(user_name?: string, categoryId?: number): Promise<DestinationNameUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (user_name) params.append('user_name', user_name);
      if (categoryId) params.append('category_id', categoryId.toString());
      const queryString = params.toString();
      const endpoint = queryString
        ? `/api/v1/read-model/destinations?${queryString}`
        : '/api/v1/read-model/destinations';

      const data = await this.makeRequest<DestinationNameUsageResponse>(
        endpoint,
        { method: 'GET' }
      );

      console.log('🏪 Fetched destinations from API:', {
        filters: { user_name, categoryId },
        total: data.total,
        sample: data.get_destination_name_usage.slice(0, 3).map(d => ({
          name: d.destination_name,
          category: d.category_name,
          user: d.user_name,
          usage: d.usage_count
        }))
      });

      return data;
    } catch (error) {
      console.error('Failed to get destination names:', error);
      throw error;
    }
  }

  /**
   * Get source name suggestions for deposit flows
   * Returns previous sources used for a specific category, sorted by usage frequency
   *
   * @param user_name - Optional username to filter sources
   * @param categoryId - Optional category ID to filter sources
   */
  public async getSourceNameUsage(user_name?: string, categoryId?: number): Promise<SourceNameUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (user_name) params.append('user_name', user_name);
      if (categoryId) params.append('category_id', categoryId.toString());
      const queryString = params.toString();
      const endpoint = queryString
        ? `/api/v1/read-model/sources?${queryString}`
        : '/api/v1/read-model/sources';

      const data = await this.makeRequest<SourceNameUsageResponse>(
        endpoint,
        { method: 'GET' }
      );

      console.log('📍 Fetched sources from API:', {
        filters: { user_name, categoryId },
        total: data.total,
        sample: data.get_source_name_usage.slice(0, 3).map(s => ({
          name: s.source_name,
          category: s.category_name,
          user: s.user_name,
          usage: s.usage_count
        }))
      });

      return data;
    } catch (error) {
      console.error('Failed to get source names:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const destinationSourceService = new DestinationSourceService();

// Export types for use in other modules
export type { DestinationSuggestion, DestinationNameUsageResponse, SourceSuggestion, SourceNameUsageResponse };
