/**
 * Structured logging utility for CloudIDE application
 * Provides consistent logging across the application with different log levels
 * and structured data formatting
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  builderId?: string;
  taskId?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  stack?: string;
  performance?: {
    duration?: number;
    memory?: number;
    renderTime?: number;
  };
}

class Logger {
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private enableRemote: boolean;
  private remoteEndpoint?: string;
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;

  constructor() {
    this.logLevel = (process.env.VITE_LOG_LEVEL as LogLevel) || 'info';
    this.enableConsole = process.env.NODE_ENV === 'development';
    this.enableRemote = process.env.NODE_ENV === 'production';
    this.remoteEndpoint = process.env.VITE_LOG_ENDPOINT || '/api/logs';
    this.sessionId = this.generateSessionId();

    // Flush logs periodically
    if (this.enableRemote) {
      setInterval(() => this.flush(), 30000); // Flush every 30 seconds
    }

    // Flush logs before page unload
    window.addEventListener('beforeunload', () => this.flush());
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        buildInfo: {
          version: process.env.VITE_APP_VERSION || 'development',
          gitHash: process.env.VITE_GIT_HASH,
        },
      },
    };

    // Add performance data if available
    if (window.performance) {
      entry.performance = {
        memory: (performance as any).memory?.usedJSHeapSize,
        renderTime: performance.now(),
      };
    }

    return entry;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.enableConsole) return;

    const { level, message, context, timestamp } = entry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    const styles = {
      debug: 'color: #6b7280',
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
      fatal: 'color: #dc2626; font-weight: bold',
    };

    if (level === 'error' || level === 'fatal') {
      console.group(`%c${prefix} ${message}`, styles[level]);
      console.error('Context:', context);
      if (entry.stack) {
        console.error('Stack trace:', entry.stack);
      }
      console.groupEnd();
    } else {
      console.log(`%c${prefix} ${message}`, styles[level], context);
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Keep buffer size under control
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  private async sendToRemote(entries: LogEntry[]): Promise<void> {
    if (!this.enableRemote || !this.remoteEndpoint) return;

    try {
      await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
    }
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(level, message, context);

    if (error) {
      entry.stack = error.stack;
      entry.context.errorName = error.name;
      entry.context.errorMessage = error.message;
    }

    this.logToConsole(entry);
    this.addToBuffer(entry);

    // Immediately send critical errors
    if (level === 'error' || level === 'fatal') {
      this.sendToRemote([entry]);
    }
  }

  public debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  public fatal(message: string, error?: Error, context?: LogContext): void {
    this.log('fatal', message, context, error);
  }

  // Performance logging
  public time(label: string, context?: LogContext): () => void {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    return () => {
      const duration = performance.now() - startTime;
      const memoryDelta = ((performance as any).memory?.usedJSHeapSize || 0) - startMemory;

      this.info(`Timer: ${label}`, {
        ...context,
        performance: {
          duration,
          memoryDelta,
        },
      });
    };
  }

  // Component lifecycle logging
  public componentMount(componentName: string, context?: LogContext): void {
    this.debug(`Component mounted: ${componentName}`, {
      ...context,
      component: componentName,
      action: 'mount',
    });
  }

  public componentUnmount(componentName: string, context?: LogContext): void {
    this.debug(`Component unmounted: ${componentName}`, {
      ...context,
      component: componentName,
      action: 'unmount',
    });
  }

  public componentError(componentName: string, error: Error, context?: LogContext): void {
    this.error(`Component error: ${componentName}`, error, {
      ...context,
      component: componentName,
      action: 'error',
    });
  }

  // User action logging
  public userAction(action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      action,
      category: 'user-interaction',
    });
  }

  // API request logging
  public apiRequest(method: string, url: string, context?: LogContext): void {
    this.debug(`API Request: ${method} ${url}`, {
      ...context,
      method,
      url,
      category: 'api-request',
    });
  }

  public apiResponse(method: string, url: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 400 ? 'error' : 'debug';
    this.log(level, `API Response: ${method} ${url} - ${status}`, {
      ...context,
      method,
      url,
      status,
      duration,
      category: 'api-response',
    });
  }

  // WebSocket logging
  public websocketConnect(url: string, context?: LogContext): void {
    this.info(`WebSocket connected: ${url}`, {
      ...context,
      url,
      category: 'websocket',
      action: 'connect',
    });
  }

  public websocketDisconnect(url: string, code?: number, reason?: string, context?: LogContext): void {
    this.info(`WebSocket disconnected: ${url}`, {
      ...context,
      url,
      code,
      reason,
      category: 'websocket',
      action: 'disconnect',
    });
  }

  public websocketMessage(type: string, data?: any, context?: LogContext): void {
    this.debug(`WebSocket message: ${type}`, {
      ...context,
      messageType: type,
      data: typeof data === 'object' ? JSON.stringify(data) : data,
      category: 'websocket',
      action: 'message',
    });
  }

  // Builder and task logging
  public builderAction(builderId: string, action: string, context?: LogContext): void {
    this.info(`Builder ${action}: ${builderId}`, {
      ...context,
      builderId,
      action,
      category: 'builder',
    });
  }

  public taskAction(taskId: string, action: string, context?: LogContext): void {
    this.info(`Task ${action}: ${taskId}`, {
      ...context,
      taskId,
      action,
      category: 'task',
    });
  }

  // Security logging
  public securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const level = severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : 'warn';
    this.log(level, `Security event: ${event}`, {
      ...context,
      severity,
      category: 'security',
    });
  }

  // Flush logs to remote endpoint
  public async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    await this.sendToRemote(logsToSend);
  }

  // Get recent logs for debugging
  public getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Set log level dynamically
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level changed to: ${level}`);
  }

  // Export logs for support
  public exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Create singleton instance
export const logger = new Logger();

// React hook for component logging
export const useLogger = (componentName: string) => {
  const componentLogger = {
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...context, component: componentName }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...context, component: componentName }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...context, component: componentName }),
    error: (message: string, error?: Error, context?: LogContext) =>
      logger.error(message, error, { ...context, component: componentName }),
    userAction: (action: string, context?: LogContext) =>
      logger.userAction(action, { ...context, component: componentName }),
    time: (label: string, context?: LogContext) =>
      logger.time(`${componentName}.${label}`, { ...context, component: componentName }),
  };

  React.useEffect(() => {
    logger.componentMount(componentName);
    return () => logger.componentUnmount(componentName);
  }, [componentName]);

  return componentLogger;
};

// Error boundary logger
export const logError = (error: Error, errorInfo: any, context?: LogContext) => {
  logger.error('React Error Boundary caught error', error, {
    ...context,
    componentStack: errorInfo.componentStack,
    category: 'error-boundary',
  });
};

export default logger;