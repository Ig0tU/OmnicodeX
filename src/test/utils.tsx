import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { SecurityProvider } from '@/components/enhanced/SecurityProvider';
import type { User, BuilderDefinition, BuildTask } from '@/types';

// Mock data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  roles: [],
  permissions: [],
  profile: {
    firstName: 'Test',
    lastName: 'User',
    timezone: 'UTC',
    locale: 'en-US',
  },
  preferences: {
    theme: 'dark',
    language: 'en',
    notifications: {
      email: true,
      push: false,
      desktop: false,
      sound: false,
    },
    privacy: {
      shareUsageData: false,
      allowCookies: true,
      trackingEnabled: false,
    },
  },
  ...overrides,
});

export const createMockBuilder = (overrides: Partial<BuilderDefinition> = {}): BuilderDefinition => ({
  id: 'builder-1' as any,
  name: 'Test Builder',
  type: 'frontend',
  capabilities: [],
  environment: {
    region: 'us-east-1',
    provider: 'aws',
    instanceType: 't2.micro',
    endpoint: 'https://test.aws.dev',
  },
  resources: {
    cpu: 2,
    memory: 4096,
    storage: 20,
    networkBandwidth: 100,
  },
  status: 'idle',
  metadata: {
    createdAt: new Date(),
    lastActive: new Date(),
    totalTasks: 0,
    successfulTasks: 0,
    averageCompletionTime: 0,
    currentLoad: 0,
  },
  ...overrides,
});

export const createMockTask = (overrides: Partial<BuildTask> = {}): BuildTask => ({
  id: 'task-1' as any,
  builderId: 'builder-1' as any,
  type: 'create',
  priority: 'medium',
  requirements: {
    description: 'Test task',
    specifications: {},
    constraints: {
      maxExecutionTime: 300,
      maxMemoryUsage: 1024,
      requiredCapabilities: [],
      securityLevel: 'medium',
    },
    expectedOutcome: 'Task completion',
  },
  status: 'queued',
  progress: {
    percentage: 0,
    currentStep: 'Initializing',
    totalSteps: 5,
    completedSteps: 0,
    estimatedTimeRemaining: 300,
  },
  artifacts: [],
  dependencies: [],
  timeline: {
    createdAt: new Date(),
    estimatedDuration: 300,
  },
  metrics: {
    resourceUsage: {
      cpuUtilization: 0,
      memoryUsage: 0,
      diskIO: 0,
      networkIO: 0,
    },
    performanceMetrics: {
      executionTime: 0,
      throughput: 0,
      latency: 0,
      errorRate: 0,
    },
    qualityMetrics: {
      codeQuality: 85,
      testCoverage: 80,
      securityScore: 90,
      performanceScore: 85,
    },
  },
  ...overrides,
});

// Custom render function with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
  withSecurity?: boolean;
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    initialEntries = ['/'],
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
    withSecurity = false,
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    const content = (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    if (withSecurity) {
      return <SecurityProvider>{content}</SecurityProvider>;
    }

    return content;
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

// Mock WebSocket for testing
export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  protocol: string;
  
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  private listeners: { [key: string]: ((event: any) => void)[] } = {};

  constructor(url: string, protocol?: string | string[]) {
    this.url = url;
    this.protocol = Array.isArray(protocol) ? protocol[0] : protocol || '';
    
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      const event = new Event('open');
      this.onopen?.(event);
      this.dispatchEvent('open', event);
    }, 10);
  }

  send(data: string | ArrayBuffer | Blob) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // In real implementation, this would send data to server
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      const event = new CloseEvent('close', { code: code || 1000, reason: reason || '' });
      this.onclose?.(event);
      this.dispatchEvent('close', event);
    }, 10);
  }

  addEventListener(type: string, listener: (event: any) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(l => l !== listener);
    }
  }

  private dispatchEvent(type: string, event: any) {
    this.listeners[type]?.forEach(listener => listener(event));
  }

  // Helper method for tests to simulate incoming messages
  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      const event = new MessageEvent('message', { data: JSON.stringify(data) });
      this.onmessage?.(event);
      this.dispatchEvent('message', event);
    }
  }

  // Helper method for tests to simulate errors
  simulateError() {
    const event = new Event('error');
    this.onerror?.(event);
    this.dispatchEvent('error', event);
  }
}

// Test utilities for async operations
export const waitFor = (condition: () => boolean, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkCondition = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
      } else {
        setTimeout(checkCondition, 10);
      }
    };
    checkCondition();
  });
};

// Mock performance observer
export class MockPerformanceObserver {
  private callback: (entries: any[], observer: MockPerformanceObserver) => void;
  private observing = false;
  
  constructor(callback: (entries: any[], observer: MockPerformanceObserver) => void) {
    this.callback = callback;
  }

  observe(options: { entryTypes: string[] }) {
    this.observing = true;
  }

  disconnect() {
    this.observing = false;
  }

  takeRecords() {
    return [];
  }

  // Helper method for tests to simulate entries
  simulateEntries(entries: any[]) {
    if (this.observing) {
      this.callback(entries, this);
    }
  }
}

// Mock mutation observer
export class MockMutationObserver {
  private callback: (mutations: MutationRecord[], observer: MockMutationObserver) => void;
  private observing = false;
  
  constructor(callback: (mutations: MutationRecord[], observer: MockMutationObserver) => void) {
    this.callback = callback;
  }

  observe(target: Node, options?: MutationObserverInit) {
    this.observing = true;
  }

  disconnect() {
    this.observing = false;
  }

  takeRecords(): MutationRecord[] {
    return [];
  }

  // Helper method for tests to simulate mutations
  simulateMutations(mutations: Partial<MutationRecord>[]) {
    if (this.observing) {
      this.callback(mutations as MutationRecord[], this);
    }
  }
}

// Mock file system for testing file operations
export class MockFileSystem {
  private files: Map<string, string> = new Map();
  
  writeFile(path: string, content: string) {
    this.files.set(path, content);
  }
  
  readFile(path: string): string | null {
    return this.files.get(path) || null;
  }
  
  exists(path: string): boolean {
    return this.files.has(path);
  }
  
  delete(path: string): boolean {
    return this.files.delete(path);
  }
  
  list(): string[] {
    return Array.from(this.files.keys());
  }
  
  clear() {
    this.files.clear();
  }
}

// Test data generators
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Custom matchers
export const customMatchers = {
  toBeAccessible: (element: HTMLElement) => {
    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
    const hasTitle = element.hasAttribute('title');
    const hasTextContent = element.textContent && element.textContent.trim().length > 0;
    
    const isAccessible = hasAriaLabel || hasAriaLabelledBy || hasTitle || hasTextContent;
    
    return {
      pass: isAccessible,
      message: () => 
        isAccessible 
          ? `Expected element not to be accessible`
          : `Expected element to have aria-label, aria-labelledby, title, or text content`,
    };
  },
  
  toHaveLoadingState: (element: HTMLElement) => {
    const hasLoadingAttribute = element.hasAttribute('aria-busy');
    const hasLoadingClass = element.className.includes('loading');
    const hasLoadingText = element.textContent?.includes('loading');
    
    const hasLoadingState = hasLoadingAttribute || hasLoadingClass || hasLoadingText;
    
    return {
      pass: hasLoadingState,
      message: () =>
        hasLoadingState
          ? `Expected element not to have loading state`
          : `Expected element to have loading state (aria-busy, loading class, or loading text)`,
    };
  },
};