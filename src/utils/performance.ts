interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  type: 'navigation' | 'resource' | 'measure' | 'mark';
  metadata?: Record<string, unknown>;
}

interface WebVitals {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTFB: number; // Time to First Byte
}

interface ResourceTiming {
  name: string;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  initiatorType: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: Map<string, PerformanceObserver> = new Map();
  private vitals: Partial<WebVitals> = {};
  private marks: Map<string, number> = new Map();
  private measurements: PerformanceEntry[] = [];
  private resourceTimings: ResourceTiming[] = [];

  private constructor() {
    this.initializeObservers();
    this.measureWebVitals();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processNavigationEntry(entry as PerformanceNavigationTiming);
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error);
      }

      // Observe resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processResourceEntry(entry as PerformanceResourceTiming);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('Resource timing observer not supported:', error);
      }

      // Observe layout shifts (CLS)
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.vitals.CLS = (this.vitals.CLS || 0) + clsValue;
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', layoutShiftObserver);
      } catch (error) {
        console.warn('Layout shift observer not supported:', error);
      }

      // Observe long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.warn('Long task detected:', {
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration,
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    // Calculate TTFB
    this.vitals.TTFB = entry.responseStart - entry.requestStart;

    // Store navigation timing for analysis
    this.measurements.push({
      name: 'navigation',
      startTime: entry.startTime,
      duration: entry.loadEventEnd - entry.startTime,
      type: 'navigation',
      metadata: {
        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        domComplete: entry.domComplete - entry.navigationStart,
        loadComplete: entry.loadEventEnd - entry.loadEventStart,
      },
    });
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const resourceTiming: ResourceTiming = {
      name: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize || 0,
      encodedBodySize: entry.encodedBodySize || 0,
      decodedBodySize: entry.decodedBodySize || 0,
      initiatorType: entry.initiatorType,
    };

    this.resourceTimings.push(resourceTiming);

    // Keep only the latest 100 resource timings
    if (this.resourceTimings.length > 100) {
      this.resourceTimings = this.resourceTimings.slice(-100);
    }
  }

  private measureWebVitals(): void {
    // FCP - First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.vitals.FCP = entry.startTime;
            }
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', fcpObserver);
      } catch (error) {
        console.warn('Paint timing observer not supported:', error);
      }

      // LCP - Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.vitals.LCP = entry.startTime;
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('largest-contentful-paint', lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // FID - First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.vitals.FID = (entry as any).processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('first-input', fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }
    }
  }

  // Public API
  mark(name: string): void {
    performance.mark(name);
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark?: string, endMark?: string): number {
    try {
      if (startMark && endMark) {
        performance.measure(name, startMark, endMark);
      } else if (startMark) {
        performance.measure(name, startMark);
      } else {
        performance.measure(name);
      }

      const entries = performance.getEntriesByName(name, 'measure');
      const entry = entries[entries.length - 1];
      
      if (entry) {
        const measurement: PerformanceEntry = {
          name,
          startTime: entry.startTime,
          duration: entry.duration,
          type: 'measure',
        };
        
        this.measurements.push(measurement);
        return entry.duration;
      }
    } catch (error) {
      console.warn('Performance measure failed:', error);
    }
    
    return 0;
  }

  measureFunction<T extends (...args: any[]) => any>(
    fn: T,
    name?: string
  ): T {
    const functionName = name || fn.name || 'anonymous';
    
    return ((...args: Parameters<T>) => {
      const startTime = performance.now();
      const markName = `${functionName}-start`;
      
      this.mark(markName);
      
      try {
        const result = fn(...args);
        
        if (result && typeof result.then === 'function') {
          // Handle async functions
          return result
            .then((value: any) => {
              this.measure(functionName, markName);
              return value;
            })
            .catch((error: any) => {
              this.measure(`${functionName}-error`, markName);
              throw error;
            });
        } else {
          // Handle sync functions
          this.measure(functionName, markName);
          return result;
        }
      } catch (error) {
        this.measure(`${functionName}-error`, markName);
        throw error;
      }
    }) as T;
  }

  measureComponent<P>(
    Component: React.ComponentType<P>,
    name?: string
  ): React.ComponentType<P> {
    const componentName = name || Component.displayName || Component.name || 'Component';
    
    return React.memo((props: P) => {
      const startTime = React.useRef<number>();
      
      React.useLayoutEffect(() => {
        startTime.current = performance.now();
        this.mark(`${componentName}-render-start`);
      });
      
      React.useLayoutEffect(() => {
        if (startTime.current) {
          this.measure(`${componentName}-render`, `${componentName}-render-start`);
        }
      });
      
      return React.createElement(Component, props);
    });
  }

  // Memory monitoring
  getMemoryInfo(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  // Bundle size analysis
  analyzeChunks(): { name: string; size: number }[] {
    const chunks: { name: string; size: number }[] = [];
    
    for (const entry of this.resourceTimings) {
      if (entry.name.includes('.js') || entry.name.includes('.css')) {
        chunks.push({
          name: entry.name.split('/').pop() || entry.name,
          size: entry.transferSize,
        });
      }
    }
    
    return chunks.sort((a, b) => b.size - a.size);
  }

  // Get comprehensive report
  getReport(): {
    vitals: Partial<WebVitals>;
    measurements: PerformanceEntry[];
    resourceTimings: ResourceTiming[];
    memoryInfo: any;
    chunks: { name: string; size: number }[];
  } {
    return {
      vitals: this.vitals,
      measurements: this.measurements,
      resourceTimings: this.resourceTimings,
      memoryInfo: this.getMemoryInfo(),
      chunks: this.analyzeChunks(),
    };
  }

  // Clear stored data
  clear(): void {
    this.measurements = [];
    this.resourceTimings = [];
    this.marks.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }

  // Clean up observers
  disconnect(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  const [report, setReport] = React.useState(monitor.getReport());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setReport(monitor.getReport());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [monitor]);

  const measureRender = React.useCallback((componentName: string) => {
    return monitor.measureComponent;
  }, [monitor]);

  const measureFunction = React.useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    name?: string
  ) => {
    return monitor.measureFunction(fn, name);
  }, [monitor]);

  return {
    report,
    measureRender,
    measureFunction,
    mark: monitor.mark.bind(monitor),
    measure: monitor.measure.bind(monitor),
    clear: monitor.clear.bind(monitor),
  };
}

// Performance optimization utilities
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Web Worker utilities for performance
export function createWorker(
  workerFunction: (...args: any[]) => any,
  dependencies: string[] = []
): Worker {
  const blob = new Blob([
    ...dependencies.map(dep => `importScripts('${dep}');`),
    `self.onmessage = function(e) {
      const result = (${workerFunction.toString()})(...e.data);
      self.postMessage(result);
    };`
  ], { type: 'application/javascript' });
  
  return new Worker(URL.createObjectURL(blob));
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();