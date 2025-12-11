/**
 * Actor Error Handling Factory
 * Centralized error handling for all XState v5 actors
 */

import { fromPromise } from 'xstate';

// ============================================================================
// Error Types & Classification
// ============================================================================

export enum ErrorCategory {
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export interface ActorError {
  category: ErrorCategory;
  message: string;
  actorName: string;
  timestamp: number;
  originalError?: Error;
  metadata?: Record<string, unknown>;
}

export interface TimeoutError extends ActorError {
  category: ErrorCategory.TIMEOUT;
  timeoutMs: number;
}

// ============================================================================
// Logging Utilities (with emoji prefixes per user preference)
// ============================================================================

const enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

export function logActorEvent(
  type: 'start' | 'success',
  actorName: string,
  data?: any
) {
  if (!enableDebugLogs) return;

  const emoji = type === 'start' ? '🔄' : '✅';
  const message = type === 'start'
    ? `${emoji} ${actorName}: Starting...`
    : `${emoji} ${actorName}: Success`;

  console.log(message, data || '');
}

export function logActorError(error: ActorError) {
  console.error(`❌ ${error.actorName}: ${error.message}`, error.originalError || '');
}

// ============================================================================
// Error Classification
// ============================================================================

export function classifyError(
  error: unknown,
  actorName: string
): ActorError {
  const timestamp = Date.now();

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Timeout detection
    if (message.includes('timeout')) {
      const timeoutMatch = message.match(/(\d+)\s*(ms|seconds?)/i);
      const timeoutMs = timeoutMatch
        ? parseInt(timeoutMatch[1]) * (timeoutMatch[2].startsWith('s') ? 1000 : 1)
        : 0;

      return {
        category: ErrorCategory.TIMEOUT,
        message: error.message,
        actorName,
        timestamp,
        timeoutMs,
        originalError: error
      } as TimeoutError;
    }

    // Network error detection (fetch failures, abort, etc)
    if (message.includes('network') || message.includes('fetch') || message.includes('abort')) {
      return {
        category: ErrorCategory.NETWORK,
        message: error.message,
        actorName,
        timestamp,
        originalError: error
      };
    }

    // Validation error detection
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        category: ErrorCategory.VALIDATION,
        message: error.message,
        actorName,
        timestamp,
        originalError: error
      };
    }

    // Auth error detection
    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('auth')) {
      return {
        category: ErrorCategory.AUTH,
        message: error.message,
        actorName,
        timestamp,
        originalError: error
      };
    }

    // Not found detection
    if (message.includes('not found') || message.includes('404')) {
      return {
        category: ErrorCategory.NOT_FOUND,
        message: error.message,
        actorName,
        timestamp,
        originalError: error
      };
    }
  }

  // Fallback for unknown errors
  return {
    category: ErrorCategory.UNKNOWN,
    message: error instanceof Error ? error.message : String(error),
    actorName,
    timestamp,
    originalError: error instanceof Error ? error : undefined
  };
}

// ============================================================================
// Timeout Wrapper (Core Utility)
// ============================================================================

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([timeoutPromise, promise]);
}

// ============================================================================
// Actor Factory Configuration
// ============================================================================

export interface ActorConfig<TInput> {
  name: string;
  timeout: number;
  operation: (input: TInput) => Promise<any>;
  onStart?: (input: TInput) => void;
  onSuccess?: (result: any) => void;
  onError?: (error: ActorError) => void;
  fallback?: (error: ActorError, input: TInput) => any;
}

// ============================================================================
// Main Factory Function
// ============================================================================

export function createActorWithErrorHandling<TOutput, TInput>(
  config: ActorConfig<TInput>
): ReturnType<typeof fromPromise<TOutput, TInput & { timeout?: number }>> {

  return fromPromise<TOutput, TInput & { timeout?: number }>(async ({ input }) => {
    const timeout = (input as any)?.timeout || config.timeout;

    try {
      logActorEvent('start', config.name, input);
      if (config.onStart) config.onStart(input);

      const result = await withTimeout(
        config.operation(input),
        timeout,
        config.name
      );

      logActorEvent('success', config.name, result);
      if (config.onSuccess) config.onSuccess(result);

      return result;

    } catch (error) {
      const structuredError = classifyError(error, config.name);
      logActorError(structuredError);

      if (config.onError) config.onError(structuredError);

      // Graceful fallback (only for critical actors per user preference)
      if (config.fallback) {
        console.warn(`⚠️ ${config.name}: Using fallback due to error`);
        return config.fallback(structuredError, input);
      }

      throw error; // Re-throw for XState onError handler
    }
  });
}
