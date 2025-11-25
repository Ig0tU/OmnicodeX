/**
 * @file logger.ts
 * @description A modular, extensible, and secure logging utility for the application.
 * @version 2.0.0
 * @author The Omni-Architect
 */

// --- Core Types ---
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogContext = Record<string, any>;

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  stack?: string;
}

// --- Transport Interface ---

/**
 * @interface LogTransport
 * @description Defines the contract for a log transport, which is responsible for outputting log entries.
 */
export interface LogTransport {
  log(entry: LogEntry): void;
  flush?(): Promise<void>;
}

// --- Console Transport ---
// ... (implementation of a console transport)

// --- Remote Transport ---
// ... (implementation of a remote transport with buffering and flushing)

// --- Sanitizer ---
function sanitize(context: LogContext): LogContext {
    const sanitized: LogContext = {};
    for (const key in context) {
        if (Object.prototype.hasOwnProperty.call(context, key)) {
            // Add redaction logic here based on key names
            if (key === 'token' || key === 'password' || key === 'secret') {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = context[key];
            }
        }
    }
    return sanitized;
}


// --- Main Logger Class ---
class Logger {
  private transports: LogTransport[] = [];

  public addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  public log(level: LogLevel, message: string, context: LogContext = {}): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: sanitize(context),
      stack: level === 'error' || level === 'fatal' ? new Error().stack : undefined,
    };
    this.transports.forEach(t => t.log(entry));
  }

  // --- Convenience Methods ---
  public debug(message: string, context?: LogContext): void { this.log('debug', message, context); }
  public info(message: string, context?: LogContext): void { this.log('info', message, context); }
  public warn(message: string, context?: LogContext): void { this.log('warn', message, context); }
  public error(message: string, context?: LogContext): void { this.log('error', message, context); }
  public fatal(message: string, context?: LogContext): void { this.log('fatal', message, context); }

  public async flushAll(): Promise<void> {
    const flushPromises = this.transports
      .map(t => t.flush ? t.flush() : Promise.resolve())
    await Promise.all(flushPromises);
  }
}

// --- Singleton Instance and Configuration ---
export const logger = new Logger();

// In a real application, you would configure transports based on the environment.
// For example:
// if (process.env.NODE_ENV === 'development') {
//   logger.addTransport(new ConsoleTransport());
// }
// if (process.env.NODE_ENV === 'production') {
//   logger.addTransport(new RemoteTransport({ endpoint: '/api/logs' }));
// }

// For this example, let's just add a console transport.
class ConsoleTransport implements LogTransport {
    log(entry: LogEntry) {
        const { level, message, context } = entry;
        const styles = {
            debug: 'color: #888',
            info: 'color: #3b82f6',
            warn: 'color: #f59e0b',
            error: 'color: #ef4444',
            fatal: 'background: #ef4444; color: #fff; padding: 2px 4px; border-radius: 4px;',
        };
        console.log(`%c[${level.toUpperCase()}]`, styles[level], message, context);
    }
}
logger.addTransport(new ConsoleTransport());
