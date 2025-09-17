/**
 * Performance monitoring and analytics utility
 * Tracks application performance, user behavior, and system health
 */

import { logger } from './logger';

export interface PerformanceMetrics {
  // Core Web Vitals
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte

  // Custom metrics
  renderTime?: number;
  bundleSize?: number;
  memoryUsage?: number;
  errorRate?: number;
  userSatisfaction?: number;
}

export interface UserBehaviorMetrics {
  sessionDuration: number;
  pageViews: number;
  clicksPerSession: number;
  featuresUsed: string[];
  errorEncountered: boolean;
  taskCompletionRate: number;
}

export interface SystemHealthMetrics {
  apiResponseTime: number;
  websocketLatency: number;
  builderUtilization: number;
  activeConnections: number;
  errorCount: number;
  uptime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private userBehavior: UserBehaviorMetrics = {
    sessionDuration: 0,
    pageViews: 0,
    clicksPerSession: 0,
    featuresUsed: [],
    errorEncountered: false,
    taskCompletionRate: 0,
  };
  private systemHealth: SystemHealthMetrics = {
    apiResponseTime: 0,
    websocketLatency: 0,
    builderUtilization: 0,
    activeConnections: 0,
    errorCount: 0,
    uptime: 0,
  };

  private sessionStart: number;
  private observer?: PerformanceObserver;
  private mutationObserver?: MutationObserver;
  private isMonitoring = false;

  constructor() {
    this.sessionStart = performance.now();
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.setupPerformanceObserver();
    this.setupWebVitals();
    this.setupUserBehaviorTracking();
    this.setupErrorTracking();
    this.setupNetworkMonitoring();

    this.isMonitoring = true;
    logger.info('Performance monitoring initialized');
  }

  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'mark'] });
    } catch (error) {
      logger.warn('Failed to set up PerformanceObserver', error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'resource':
        this.processResourceEntry(entry as PerformanceResourceTiming);
        break;
      case 'measure':
        this.processMeasureEntry(entry);
        break;
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.metrics.TTFB = entry.responseStart - entry.requestStart;
    this.metrics.FCP = entry.domContentLoadedEventEnd - entry.navigationStart;

    logger.debug('Navigation performance captured', {
      TTFB: this.metrics.TTFB,
      FCP: this.metrics.FCP,
      loadComplete: entry.loadEventEnd - entry.navigationStart,
    });
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    // Track bundle sizes and resource loading performance
    if (entry.name.includes('.js') || entry.name.includes('.css')) {
      const size = entry.transferSize || entry.encodedBodySize || 0;
      this.metrics.bundleSize = (this.metrics.bundleSize || 0) + size;

      logger.debug('Resource loaded', {
        name: entry.name,
        size,
        duration: entry.duration,
      });
    }
  }

  private processMeasureEntry(entry: PerformanceEntry): void {
    // Custom performance measures
    if (entry.name.startsWith('react-render')) {
      this.metrics.renderTime = entry.duration;
    }

    logger.debug('Performance measure', {
      name: entry.name,
      duration: entry.duration,
    });
  }

  private setupWebVitals(): void {
    // Core Web Vitals measurement
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.LCP = lastEntry.startTime;
        logger.debug('LCP measured', { LCP: this.metrics.LCP });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.FID = entry.processingStart - entry.startTime;
          logger.debug('FID measured', { FID: this.metrics.FID });
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let cumulativeScore = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cumulativeScore += (entry as any).value;
          }
        }
        this.metrics.CLS = cumulativeScore;
        logger.debug('CLS measured', { CLS: this.metrics.CLS });
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  private setupUserBehaviorTracking(): void {
    // Track page views
    let currentPath = window.location.pathname;
    this.userBehavior.pageViews = 1;

    // Monitor route changes
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        this.userBehavior.pageViews++;
        logger.userAction('Page view', { path: currentPath });
      }
    };

    // Track clicks
    document.addEventListener('click', (event) => {
      this.userBehavior.clicksPerSession++;

      const target = event.target as HTMLElement;
      const elementInfo = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.slice(0, 50),
      };

      logger.userAction('Click', elementInfo);
    });

    // Track feature usage
    this.trackFeatureUsage();
  }

  private trackFeatureUsage(): void {
    // Monitor specific features based on data attributes or class names
    const featureElements = document.querySelectorAll('[data-feature]');

    featureElements.forEach((element) => {
      element.addEventListener('click', (event) => {
        const feature = (event.target as HTMLElement).getAttribute('data-feature');
        if (feature && !this.userBehavior.featuresUsed.includes(feature)) {
          this.userBehavior.featuresUsed.push(feature);
          logger.userAction('Feature used', { feature });
        }
      });
    });
  }

  private setupErrorTracking(): void {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.userBehavior.errorEncountered = true;
      this.systemHealth.errorCount++;

      logger.error('JavaScript error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.userBehavior.errorEncountered = true;
      this.systemHealth.errorCount++;

      logger.error('Unhandled promise rejection', event.reason);
    });
  }

  private setupNetworkMonitoring(): void {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        this.systemHealth.apiResponseTime =
          (this.systemHealth.apiResponseTime + duration) / 2; // Moving average

        logger.apiResponse(
          args[1]?.method || 'GET',
          url,
          response.status,
          duration
        );

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.systemHealth.errorCount++;

        logger.error('Network request failed', error as Error, {
          url,
          duration,
        });

        throw error;
      }
    };
  }

  // Public methods for tracking custom metrics
  public trackCustomMetric(name: string, value: number, context?: any): void {
    performance.mark(`custom-${name}-start`);
    performance.mark(`custom-${name}-end`);
    performance.measure(`custom-${name}`, `custom-${name}-start`, `custom-${name}-end`);

    logger.info(`Custom metric: ${name}`, {
      value,
      ...context,
      category: 'custom-metric',
    });
  }

  public trackUserSatisfaction(score: number): void {
    this.metrics.userSatisfaction = score;
    logger.userAction('User satisfaction rating', { score });
  }

  public trackTaskCompletion(taskId: string, success: boolean, duration: number): void {
    const currentRate = this.userBehavior.taskCompletionRate;
    this.userBehavior.taskCompletionRate = (currentRate + (success ? 1 : 0)) / 2;

    logger.taskAction(taskId, success ? 'completed' : 'failed', {
      duration,
      success,
    });
  }

  public trackBuilderUtilization(utilization: number): void {
    this.systemHealth.builderUtilization = utilization;

    if (utilization > 90) {
      logger.warn('High builder utilization', { utilization });
    }
  }

  public trackWebSocketLatency(latency: number): void {
    this.systemHealth.websocketLatency = latency;

    if (latency > 1000) {
      logger.warn('High WebSocket latency', { latency });
    }
  }

  // Get current metrics
  public getMetrics(): PerformanceMetrics {
    this.updateDynamicMetrics();
    return { ...this.metrics };
  }

  public getUserBehavior(): UserBehaviorMetrics {
    this.userBehavior.sessionDuration = performance.now() - this.sessionStart;
    return { ...this.userBehavior };
  }

  public getSystemHealth(): SystemHealthMetrics {
    this.systemHealth.uptime = performance.now() - this.sessionStart;
    return { ...this.systemHealth };
  }

  private updateDynamicMetrics(): void {
    // Update memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }

    // Calculate error rate
    const totalEvents = this.userBehavior.clicksPerSession + this.userBehavior.pageViews;
    this.metrics.errorRate = totalEvents > 0 ? this.systemHealth.errorCount / totalEvents : 0;
  }

  // Export metrics for analysis
  public exportMetrics(): string {
    return JSON.stringify({
      performance: this.getMetrics(),
      userBehavior: this.getUserBehavior(),
      systemHealth: this.getSystemHealth(),
      timestamp: new Date().toISOString(),
    }, null, 2);
  }

  // Send metrics to analytics service
  public async sendMetrics(): Promise<void> {
    const metrics = {
      performance: this.getMetrics(),
      userBehavior: this.getUserBehavior(),
      systemHealth: this.getSystemHealth(),
    };

    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metrics),
      });

      logger.debug('Metrics sent to analytics service');
    } catch (error) {
      logger.error('Failed to send metrics', error as Error);
    }
  }

  // Performance budget checking
  public checkPerformanceBudget(): { passed: boolean; violations: string[] } {
    const budget = {
      LCP: 2500, // 2.5 seconds
      FID: 100,  // 100 milliseconds
      CLS: 0.1,  // 0.1
      bundleSize: 1024 * 1024, // 1MB
      memoryUsage: 0.8, // 80%
    };

    const violations: string[] = [];

    if (this.metrics.LCP && this.metrics.LCP > budget.LCP) {
      violations.push(`LCP: ${this.metrics.LCP}ms exceeds budget of ${budget.LCP}ms`);
    }

    if (this.metrics.FID && this.metrics.FID > budget.FID) {
      violations.push(`FID: ${this.metrics.FID}ms exceeds budget of ${budget.FID}ms`);
    }

    if (this.metrics.CLS && this.metrics.CLS > budget.CLS) {
      violations.push(`CLS: ${this.metrics.CLS} exceeds budget of ${budget.CLS}`);
    }

    if (this.metrics.bundleSize && this.metrics.bundleSize > budget.bundleSize) {
      violations.push(`Bundle size: ${this.metrics.bundleSize} bytes exceeds budget of ${budget.bundleSize} bytes`);
    }

    if (this.metrics.memoryUsage && this.metrics.memoryUsage > budget.memoryUsage) {
      violations.push(`Memory usage: ${(this.metrics.memoryUsage * 100).toFixed(1)}% exceeds budget of ${(budget.memoryUsage * 100)}%`);
    }

    const passed = violations.length === 0;

    if (!passed) {
      logger.warn('Performance budget violations detected', { violations });
    }

    return { passed, violations };
  }

  // Cleanup
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    this.isMonitoring = false;
    logger.info('Performance monitoring stopped');
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  React.useEffect(() => {
    const startTime = performance.now();
    performance.mark(`${componentName}-mount-start`);

    return () => {
      const endTime = performance.now();
      performance.mark(`${componentName}-mount-end`);
      performance.measure(
        `${componentName}-lifecycle`,
        `${componentName}-mount-start`,
        `${componentName}-mount-end`
      );

      const duration = endTime - startTime;
      logger.debug(`Component lifecycle: ${componentName}`, {
        duration,
        component: componentName,
      });
    };
  }, [componentName]);

  return {
    trackRender: (renderTime: number) => {
      performanceMonitor.trackCustomMetric(`${componentName}-render`, renderTime);
    },
    trackUserAction: (action: string, context?: any) => {
      logger.userAction(`${componentName}: ${action}`, context);
    },
  };
};

export default performanceMonitor;