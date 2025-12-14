/**
 * Telegram Service Exports
 * Central barrel export for telegram service module
 */

// SDK wrapper - singleton instance
export { default as telegramService } from './sdk';

// Shared initialization function
export { initializeTelegramUser } from './userInit';

// Type exports
export type { BudgetUser } from './types';
