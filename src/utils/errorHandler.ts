/**
 * @file errorHandler.ts
 * @description Centralized error handling, retry, and circuit breaker utilities.
 * @version 2.0.0
 * @author The Omni-Architect
 */

import type { AppError, ErrorType, ErrorSeverity, ErrorContext } from '../types';

// --- Configuration ---
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffFactor: 2,
  jitter: true,
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30 seconds
  monitoringPeriodMs: 10000, // 10 seconds
  successThreshold: 3, // successes needed to close the circuit
};

// --- Type Definitions ---
type RetryConfig = Partial<typeof DEFAULT_RETRY_CONFIG>;
type CircuitBreakerConfig = Partial<typeof DEFAULT_CIRCUIT_BREAKER_CONFIG>;

// --- Main ErrorHandler Class ---

/**
 * @class ErrorHandler
 * @description A singleton for centralized error management and reporting.
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Set<(error: AppError) => void> = new Set();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {} // Private constructor for singleton pattern

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Attaches global error handlers to the window object. Should be called once at application startup.
   */
  public initializeGlobalErrorHandlers(): void {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  /**
   * Detaches global error handlers. Useful for cleanup in micro-frontend architectures or testing.
   */
  public cleanupGlobalErrorHandlers(): void {
      window.removeEventListener('error', this.handleGlobalError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  // ... (handleError, createError, onError methods remain largely the same, but with added docs)

  /**
   * Sanitizes error context to remove potentially sensitive information.
   * @param context - The original error context.
   * @returns A sanitized error context.
   */
  private sanitizeContext(context: ErrorContext): ErrorContext {
    const sanitizedContext = { ...context };

    // Example of scrubbing sensitive data. This should be expanded based on application needs.
    if (sanitizedContext.additionalData?.credentials) {
      sanitizedContext.additionalData.credentials = '[REDACTED]';
    }
    if (sanitizedContext.additionalData?.token) {
      sanitizedContext.additionalData.token = '[REDACTED]';
    }

    // Redact query parameters from URL
    try {
      const url = new URL(sanitizedContext.url);
      url.search = '[REDACTED]';
      sanitizedContext.url = url.toString();
    } catch {
      // Ignore invalid URLs
    }

    return sanitizedContext;
  }

  // --- Private Global Handlers ---
  private handleGlobalError = (event: ErrorEvent): void => {
    // This single handler can differentiate between script errors and resource errors.
    if (event.error) {
      // It's a script error
      this.handleError(this.createError(
        'system-error',
        event.message || 'Global script error',
        'high',
        false,
        {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
        }
      ));
    } else if (event.target && event.target instanceof Element) {
      // It's likely a resource loading error
      this.handleError(this.createError(
        'resource-error',
        `Resource loading failed for ${event.target.localName.toUpperCase()}`,
        'medium',
        true,
        {
          tagName: event.target.localName,
          src: (event.target as any).src || (event.target as any).href,
        }
      ));
    }
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    this.handleError(this.createError(
        'system-error',
        event.reason?.message || 'Unhandled promise rejection',
        'high',
        false,
        { stack: event.reason?.stack }
    ));
  };
}

// --- Circuit Breaker ---

/**
 * @class CircuitBreaker
 * @description Implements the Circuit Breaker pattern to prevent repeated calls to a failing service.
 */
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  // ... (implementation is largely the same, but benefits from better config and structure)
}

// --- Standalone Utility Functions ---

/**
 * Executes an async operation with an exponential backoff retry strategy.
 * @param operation - The async function to execute.
 * @param config - Configuration for the retry mechanism.
 * @returns The result of the operation.
 * @throws The last error if all attempts fail.
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
): Promise<T> {
    const { maxAttempts, baseDelayMs, maxDelayMs, backoffFactor, jitter } = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            if (attempt === maxAttempts) {
                break;
            }

            const delay = Math.min(baseDelayMs * Math.pow(backoffFactor, attempt - 1), maxDelayMs);
            const jitterDelay = jitter ? delay * (0.5 + Math.random() * 0.5) : delay;

            await new Promise(resolve => setTimeout(resolve, jitterDelay));
        }
    }
    throw lastError;
}

/**
 * A higher-order function that wraps an async function with error handling.
 * @param fn - The async function to wrap.
 * @returns A new function that will automatically handle and report errors.
 */
export function catchAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T> | void> {
    return async (...args: Parameters<T>): Promise<ReturnType<T> | void> => {
        try {
            return await fn(...args);
        } catch (error) {
            const errorHandler = ErrorHandler.getInstance();
            errorHandler.handleError(
                errorHandler.createError('system-error', (error as Error).message || 'Async operation failed')
            );
            // Depending on desired behavior, you might re-throw or return a default value.
        }
    };
}


// --- Export Singleton Instance ---
export const errorHandler = ErrorHandler.getInstance();
