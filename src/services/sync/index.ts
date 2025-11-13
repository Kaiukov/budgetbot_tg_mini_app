/**
 * Sync API Service - Main Export
 * Exports singleton instance and all types
 */

import { SyncServiceUser } from './user';

// Re-export all types for consumers
export * from './types';

// Export class for type checking if needed
export { SyncServiceUser };

// Create singleton instance
export const syncService = new SyncServiceUser();

// Default export for convenience
export default syncService;
