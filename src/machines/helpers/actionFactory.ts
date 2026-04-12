/**
 * Action Factory for Data Loading State Management
 * Generates standardized loading/success/error action triplets for data resources
 *
 * Follows the ActorConfig factory pattern from errorHandling.ts
 *
 * @example
 * const accountActions = createResourceActions<AccountUsage[]>({
 *   resourceName: 'accounts'
 * });
 *
 * export const actions = {
 *   setAccounts: accountActions.setData,
 *   setAccountsLoading: accountActions.setLoading,
 *   setAccountsError: accountActions.setError,
 * };
 */

import { assign } from 'xstate';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for creating data loading state actions
 * Follows ActorConfig pattern for consistency
 */
export interface ResourceActionConfig<TData = any> {
  /** Resource name that corresponds to context.data and context.ui keys */
  resourceName: 'accounts' | 'categories' | 'transactions';

  /** Optional: Type hint for TypeScript inference. Not used at runtime */
  dataType?: TData;
}

/**
 * Generated actions for a specific resource
 * Each resource gets 3 actions: loading, success (with data), error
 */
export interface DataLoadingActions {
  /**
   * Sets resource to loading state
   * Updates context.ui[resourceName] = { loading: true, error: null }
   */
  setLoading: any; // XState AssignAction

  /**
   * Updates resource with data and marks as success
   * Handles both orchestrator pattern (event.output.resourceName)
   * and manual event pattern (event.resourceName)
   * Updates context.data[resourceName] and context.ui[resourceName]
   */
  setData: any; // XState AssignAction

  /**
   * Updates resource error state
   * Updates context.ui[resourceName] = { loading: false, error: event.error }
   */
  setError: any; // XState AssignAction
}

// ============================================================================
// Factory Implementation
// ============================================================================

/**
 * Creates standardized data loading action triplet for a resource
 *
 * Supports 2 event patterns:
 * 1. Orchestrator: event.output.accounts (from dataLoadingOrchestratorActor)
 * 2. Manual: event.accounts (from explicit events)
 *
 * Each resource gets 3 identical action patterns:
 * - Loading: { loading: true, error: null }
 * - Success: updates data, { loading: false, error: null }
 * - Error: { loading: false, error: message }
 *
 * @param config - Configuration with resourceName
 * @returns Object with setLoading, setData, setError actions
 *
 * @example
 * const accountActions = createResourceActions<AccountUsage[]>({
 *   resourceName: 'accounts'
 * });
 *
 * // Use in machine actions:
 * setAccountsLoading: accountActions.setLoading,
 * setAccounts: accountActions.setData,
 * setAccountsError: accountActions.setError,
 */
export function createResourceActions<TData = any>(
  config: ResourceActionConfig<TData>
): DataLoadingActions {
  const { resourceName } = config;

  // Validate resource name (development safety)
  const validResourceNames = ['accounts', 'categories', 'transactions'];
  if (!validResourceNames.includes(resourceName)) {
    throw new Error(
      `Invalid resourceName: "${resourceName}". Must be one of: ${validResourceNames.join(', ')}`
    );
  }

  return {
    // ========================================================================
    // setLoading Action
    // ========================================================================
    // Pattern: setAccountsLoading, setCategoriesLoading, setTransactionsLoading
    setLoading: assign({
      ui: ({ context }) => ({
        ...context.ui,
        [resourceName]: { loading: true, error: null },
      }),
    }),

    // ========================================================================
    // setData Action (Unified for both event patterns)
    // ========================================================================
    // Pattern: setAccounts, setCategories, setTransactions
    // Handles:
    //   1. Orchestrator: event.output.accounts (from dataLoadingOrchestratorActor onDone)
    //   2. Manual: event.accounts (from explicit SET_ACCOUNTS events)
    // Uses fallback chain: event.output?.[resourceName] ?? event[resourceName] ?? []
    setData: assign({
      data: ({ context, event }: any) => {
        // Unified getter: try orchestrator pattern first, fall back to manual
        // Orchestrator: event.output.accounts (top-level output from actor)
        // Manual: event.accounts (direct event property)
        const newData = event.output?.[resourceName] ?? event[resourceName] ?? [];

        return {
          ...context.data,
          [resourceName]: newData,
        };
      },

      ui: ({ context }) => ({
        ...context.ui,
        [resourceName]: { loading: false, error: null },
      }),
    }),

    // ========================================================================
    // setError Action
    // ========================================================================
    // Pattern: setAccountsError, setCategoriesError, setTransactionsError
    setError: assign({
      ui: ({ context, event }: any) => ({
        ...context.ui,
        [resourceName]: { loading: false, error: event.error },
      }),
    }),
  };
}
