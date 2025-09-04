import type { AppError, ErrorType, ErrorSeverity, ErrorContext } from '../types';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Set<(error: AppError) => void> = new Set();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        id: crypto.randomUUID(),
        type: 'system-error',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        context: this.getErrorContext(),
        timestamp: new Date(),
        severity: 'high',
        recoverable: false,
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        id: crypto.randomUUID(),
        type: 'system-error',
        message: event.message || 'JavaScript error',
        stack: event.error?.stack,
        context: {
          ...this.getErrorContext(),
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
        timestamp: new Date(),
        severity: 'high',
        recoverable: false,
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        this.handleError({
          id: crypto.randomUUID(),
          type: 'system-error',
          message: `Resource loading failed: ${target.tagName}`,
          context: {
            ...this.getErrorContext(),
            additionalData: {
              tagName: target.tagName,
              src: (target as any).src || (target as any).href,
            },
          },
          timestamp: new Date(),
          severity: 'medium',
          recoverable: true,
        });
      }
    }, true);
  }

  private getErrorContext(): ErrorContext {
    return {
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData: {
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      },
    };
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  handleError(error: AppError): void {
    console.error('Application Error:', error);

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    // Send to monitoring service (if configured)
    this.sendToMonitoring(error);
  }

  createError(
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = 'medium',
    recoverable: boolean = true,
    additionalContext?: Record<string, unknown>
  ): AppError {
    return {
      id: crypto.randomUUID(),
      type,
      message,
      context: {
        ...this.getErrorContext(),
        additionalData: additionalContext,
      },
      timestamp: new Date(),
      severity,
      recoverable,
    };
  }

  onError(listener: (error: AppError) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private async sendToMonitoring(error: AppError): Promise<void> {
    try {
      // In a real application, this would send to a monitoring service
      // like Sentry, LogRocket, or a custom endpoint
      if (process.env.NODE_ENV === 'development') {
        console.groupCollapsed(`🔥 ${error.type.toUpperCase()}: ${error.message}`);
        console.error('Error Details:', error);
        console.error('Stack:', error.stack);
        console.error('Context:', error.context);
        console.groupEnd();
      }
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError);
    }
  }

  getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name, config));
    }
    return this.circuitBreakers.get(name)!;
  }
}

class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      monitoringPeriod: 10000, // 10 seconds
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.config.resetTimeout) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      this.state = 'half-open';
      this.successCount = 0;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = 'closed';
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
      console.warn(`Circuit breaker ${this.name} opened after ${this.failureCount} failures`);
    }
  }

  getState(): string {
    return this.state;
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitter = true,
  } = config;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
      
      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      console.warn(`Retry attempt ${attempt}/${maxAttempts} failed, waiting ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export function createTypedError<T extends Record<string, unknown>>(
  type: ErrorType,
  message: string,
  data?: T
): AppError & { data: T } {
  const errorHandler = ErrorHandler.getInstance();
  const baseError = errorHandler.createError(type, message, 'medium', true, data);
  
  return {
    ...baseError,
    data: data || ({} as T),
  };
}

// Specialized error creators
export const createNetworkError = (message: string, statusCode?: number) =>
  createTypedError('network-error', message, { statusCode });

export const createValidationError = (message: string, field?: string, value?: unknown) =>
  createTypedError('validation-error', message, { field, value });

export const createAuthError = (message: string, authType?: string) =>
  createTypedError('authentication-error', message, { authType });

export const createBuilderError = (message: string, builderId?: string, taskId?: string) =>
  createTypedError('builder-error', message, { builderId, taskId });

// Error boundary helper
export class ErrorBoundary extends Error {
  constructor(
    message: string,
    public readonly originalError: Error,
    public readonly componentStack?: string
  ) {
    super(message);
    this.name = 'ErrorBoundary';
  }
}

// Async error wrapper
export function catchAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return ((...args: Parameters<T>) => {
    return Promise.resolve(fn(...args)).catch((error) => {
      const errorHandler = ErrorHandler.getInstance();
      errorHandler.handleError(
        errorHandler.createError(
          'system-error',
          error.message || 'Async operation failed',
          'medium',
          true,
          {
            functionName: fn.name,
            arguments: args,
            originalError: error,
          }
        )
      );
      throw error;
    });
  }) as T;
}

// Performance monitoring for errors
export function withPerformanceMonitoring<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return operation()
    .then(result => {
      const duration = performance.now() - start;
      console.debug(`Operation ${name} completed in ${duration.toFixed(2)}ms`);
      return result;
    })
    .catch(error => {
      const duration = performance.now() - start;
      const errorHandler = ErrorHandler.getInstance();
      errorHandler.handleError(
        errorHandler.createError(
          'system-error',
          `Operation ${name} failed after ${duration.toFixed(2)}ms: ${error.message}`,
          'medium',
          true,
          {
            operationName: name,
            duration,
            originalError: error,
          }
        )
      );
      throw error;
    });
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();