/**
 * Centralized timeout configuration for all XState actors
 *
 * Timeout Rationale:
 * - TELEGRAM_INIT: 5s - Quick Telegram WebApp SDK initialization
 * - DATA_FETCH: 30s - Account, category, transaction bulk fetches
 * - CRUD_OPERATION: 15s - Single transaction create/edit/delete
 * - HEALTH_CHECK: 10s - Service health ping checks
 * - ORCHESTRATOR: 30s - Parallel data loading orchestration
 */
export const ACTOR_TIMEOUTS = {
  TELEGRAM_INIT: 5000,        // 5 seconds
  DATA_FETCH: 30000,          // 30 seconds
  CRUD_OPERATION: 15000,      // 15 seconds
  HEALTH_CHECK: 10000,        // 10 seconds
  ORCHESTRATOR: 30000,        // 30 seconds
} as const;

/**
 * Type-safe timeout keys for actor input
 */
export type ActorTimeoutKey = keyof typeof ACTOR_TIMEOUTS;
