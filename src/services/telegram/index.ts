/**
 * Telegram Service Exports
 * Central barrel export for telegram service module
 */

// SDK wrapper - singleton instance (default export for backward compatibility)
import telegramService from './sdk';
export default telegramService;
export { telegramService };

// Shared initialization function
export { initializeTelegramUser } from './userInit';

// Type exports
export type { BudgetUser } from './types';
