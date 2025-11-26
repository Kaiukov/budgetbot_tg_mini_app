/**
 * Sync API Service - Destination Operations
 * Handles destination name suggestions
 */

import type { DestinationNameUsageResponse, SourceNameUsageResponse } from './types';
import { SyncServiceCategories } from './categories';

export class SyncServiceDestinations extends SyncServiceCategories {
  /**
   * Get destination name usage data with optional filtering
   *
   * @param userName - Optional username to filter by user
   * @param categoryId - Optional category ID to filter by category
   * @returns Destination list (filtered if params provided)
   */
  public async getDestinationNameUsage(userName?: string, categoryId?: string | number): Promise<DestinationNameUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      const params = new URLSearchParams();
      if (userName) params.set('user_name', userName);
      if (categoryId !== undefined) params.set('category_id', String(categoryId));

      const endpoint = `/api/v1/get_destination_name_usage${params.toString() ? `?${params.toString()}` : ''}`;

      const rawData = await this.makeRequest<DestinationNameUsageResponse>(
        endpoint,
        { method: 'GET' }
      );

      const total = rawData.total ?? rawData.total_sync ?? rawData.get_destination_name_usage.length;
      const data: DestinationNameUsageResponse = {
        ...rawData,
        total
      };

      console.log('🏪 Fetched all destinations from API:', {
        userName,
        categoryId,
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
   * Get source name usage data with optional filtering
   *
   * @param userName - Optional username to filter by user
   * @param categoryId - Optional category ID to filter by category
   * @returns Source list (filtered if params provided)
   */
  public async getSourceNameUsage(userName?: string, categoryId?: string | number): Promise<SourceNameUsageResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sync API not configured');
      }

      const params = new URLSearchParams();
      if (userName) params.set('user_name', userName);
      if (categoryId !== undefined) params.set('category_id', String(categoryId));

      const endpoint = `/api/v1/get_source_name_usage${params.toString() ? `?${params.toString()}` : ''}`;

      const rawData = await this.makeRequest<SourceNameUsageResponse>(
        endpoint,
        { method: 'GET' }
      );

      const total = rawData.total ?? rawData.total_sync ?? rawData.get_source_name_usage.length;
      const data: SourceNameUsageResponse = {
        ...rawData,
        total
      };

      console.log('🏪 Fetched all sources from API:', {
        userName,
        categoryId,
        total: data.total,
        sample: data.get_source_name_usage.slice(0, 3).map(d => ({
          name: d.source_name,
          category: d.category_name,
          user: d.user_name,
          usage: d.usage_count
        }))
      });

      return data;
    } catch (error) {
      console.error('Failed to get source names:', error);
      throw error;
    }
  }
}
