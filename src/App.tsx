import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary, RouteErrorBoundary } from "./components/ErrorBoundary";
import { SecurityProvider } from "./components/enhanced/SecurityProvider";
import { logger } from "./utils/logger";
import { performanceMonitor } from "./utils/monitoring";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        logger.warn('Query retry attempt', error, {
          failureCount,
          errorMessage: error?.message
        });
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        logger.error('Mutation error', error);
      },
    },
  },
});

const App = () => {
  // Initialize monitoring and logging
  React.useEffect(() => {
    logger.info('CloudIDE Application started', {
      version: process.env.VITE_APP_VERSION || 'development',
      environment: process.env.NODE_ENV,
      userAgent: navigator.userAgent,
    });

    // Track initial page load performance
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationTiming) {
          logger.info('Page load performance', {
            loadTime: navigationTiming.loadEventEnd - navigationTiming.navigationStart,
            domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart,
            firstByte: navigationTiming.responseStart - navigationTiming.requestStart,
          });
        }
      });
    }

    return () => {
      logger.info('CloudIDE Application shutting down');
      performanceMonitor.destroy();
    };
  }, []);

  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        logger.error('Application error boundary triggered', error, {
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <SecurityProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RouteErrorBoundary>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Index />} />
                  </Route>
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </RouteErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </SecurityProvider>
    </ErrorBoundary>
  );
};

export default App;
