/**
 * Sync API Service - Destination Operations
 * Handles destination name suggestions
 */

import type { DestinationNameUsageResponse } from './types';
import { SyncServiceCategories } from './categories';

export class SyncServiceDestinations extends SyncServiceCategories {
  /**
   * Get all destination name usage data (no filtering)
   * Returns complete destination list from all users and categories
   * Client-side filtering is preferred over backend filtering to avoid encoding issues with Cyrillic/emoji
   *
   * @returns Full destination list for client-side filtering
   */
  public async getDestinationNameUsage(): Promise<DestinationNameUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      // Fetch all destinations without query parameters
      // Avoids backend filtering issues with special characters (Cyrillic, emoji)
      const endpoint = '/api/v1/get_destination_name_usage';

      const data = await this.makeRequest<DestinationNameUsageResponse>(
        endpoint,
        { method: 'GET' }
      );

      console.log('🏪 Fetched all destinations from API:', {
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
}
