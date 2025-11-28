/**
 * Sync API Service - Backward Compatibility Wrapper
 *
 * This file now re-exports the modular sync service for backward compatibility.
 * All implementation details have been moved to src/services/sync/ directory.
 */

export * from './sync/index';
export { default } from './sync/index';
