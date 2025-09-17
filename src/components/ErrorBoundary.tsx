import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to external service
    this.logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    const errorReport = {
      id: this.state.errorId || `error-${Date.now()}`,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      buildInfo: this.getBuildInfo(),
      retryCount: this.retryCount,
    };

    // In production, send to error tracking service like Sentry
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(errorReport);
    } else {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Report:', errorReport);
      console.groupEnd();
    }
  }

  private sendToErrorService(errorReport: any) {
    // Implementation for production error tracking
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport),
    }).catch((fetchError) => {
      console.error('Failed to send error report:', fetchError);
    });
  }

  private getUserId(): string | null {
    // Get user ID from local storage or context
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData).id : null;
    } catch {
      return null;
    }
  }

  private getBuildInfo() {
    return {
      version: process.env.VITE_APP_VERSION || 'development',
      buildDate: process.env.VITE_BUILD_DATE,
      gitHash: process.env.VITE_GIT_HASH,
    };
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const error = this.state.error;
    const errorInfo = this.state.errorInfo;

    if (error && errorInfo) {
      const subject = encodeURIComponent(`Bug Report: ${error.message}`);
      const body = encodeURIComponent(
        `Error ID: ${this.state.errorId}\n\n` +
        `Error Message: ${error.message}\n\n` +
        `Stack Trace:\n${error.stack}\n\n` +
        `Component Stack:\n${errorInfo.componentStack}\n\n` +
        `User Agent: ${navigator.userAgent}\n` +
        `URL: ${window.location.href}\n` +
        `Timestamp: ${new Date().toISOString()}`
      );

      window.open(`mailto:support@terragonlabs.com?subject=${subject}&body=${body}`);
    }
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo } = this.state;
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error. Our team has been notified and is working on a fix.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  Error ID: <code className="bg-muted px-1 rounded">{this.state.errorId}</code>
                </AlertDescription>
              </Alert>

              {this.props.showDetails && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md text-sm font-mono">
                    <div className="mb-2">
                      <strong>Error:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div className="mb-2">
                        <strong>Stack Trace:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1 text-muted-foreground">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1 text-muted-foreground">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {canRetry ? (
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                ) : (
                  <Button onClick={() => window.location.reload()} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                )}

                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>

                <Button onClick={this.handleReportBug} variant="outline" className="flex-1">
                  <Bug className="h-4 w-4 mr-2" />
                  Report Bug
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground mt-4">
                If this problem persists, please contact support at{' '}
                <a
                  href="mailto:support@terragonlabs.com"
                  className="text-primary hover:underline"
                >
                  support@terragonlabs.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Partial<Props>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Specialized error boundaries for different parts of the app
export const UIErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    showDetails={process.env.NODE_ENV === 'development'}
    onError={(error, errorInfo) => {
      console.error('UI Component Error:', error, errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);

export const DataErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    showDetails={false}
    onError={(error, errorInfo) => {
      console.error('Data Layer Error:', error, errorInfo);
    }}
    fallback={
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load data. Please refresh the page or try again later.
        </AlertDescription>
      </Alert>
    }
  >
    {children}
  </ErrorBoundary>
);

export const RouteErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    showDetails={process.env.NODE_ENV === 'development'}
    onError={(error, errorInfo) => {
      console.error('Route Error:', error, errorInfo);
    }}
    fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Page Not Found</CardTitle>
            <CardDescription>
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);