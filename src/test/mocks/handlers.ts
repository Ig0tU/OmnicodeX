import { http, HttpResponse } from 'msw'

// Mock API responses for testing
export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read', 'write'],
          profile: {
            firstName: 'Test',
            lastName: 'User',
            timezone: 'UTC',
            locale: 'en-US',
          },
        },
      },
    })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read', 'write'],
      },
    })
  }),

  // Builder endpoints
  http.get('/api/builders', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'builder-1',
          name: 'Frontend Builder',
          type: 'frontend',
          capabilities: [
            { name: 'React', version: '18.3.1', dependencies: [] },
            { name: 'TypeScript', version: '5.5.3', dependencies: [] },
          ],
          environment: {
            region: 'us-east-1',
            provider: 'aws',
            instanceType: 't3.medium',
            endpoint: 'https://builder-1.aws.com',
          },
          resources: {
            cpu: 2,
            memory: 4096,
            storage: 100,
            networkBandwidth: 1000,
          },
          status: 'idle',
          metadata: {
            createdAt: new Date('2024-01-01'),
            lastActive: new Date(),
            totalTasks: 150,
            successfulTasks: 145,
            averageCompletionTime: 300,
            currentLoad: 25,
          },
        },
        {
          id: 'builder-2',
          name: 'Backend Builder',
          type: 'backend',
          capabilities: [
            { name: 'Node.js', version: '20.0.0', dependencies: [] },
            { name: 'Express', version: '4.18.0', dependencies: [] },
          ],
          environment: {
            region: 'us-east-1',
            provider: 'aws',
            instanceType: 't3.large',
            endpoint: 'https://builder-2.aws.com',
          },
          resources: {
            cpu: 4,
            memory: 8192,
            storage: 200,
            networkBandwidth: 2000,
          },
          status: 'coding',
          metadata: {
            createdAt: new Date('2024-01-01'),
            lastActive: new Date(),
            totalTasks: 200,
            successfulTasks: 195,
            averageCompletionTime: 450,
            currentLoad: 75,
          },
        },
      ],
    })
  }),

  // Task endpoints
  http.get('/api/tasks', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'task-1',
          builderId: 'builder-1',
          type: 'create',
          priority: 'high',
          requirements: {
            description: 'Create React component',
            specifications: { framework: 'React', language: 'TypeScript' },
            constraints: {
              maxExecutionTime: 600,
              maxMemoryUsage: 512,
              requiredCapabilities: ['React', 'TypeScript'],
              securityLevel: 'medium',
            },
            expectedOutcome: 'Functional React component with TypeScript',
          },
          status: 'in-progress',
          progress: {
            percentage: 65,
            currentStep: 'Generating component code',
            totalSteps: 4,
            completedSteps: 2,
            estimatedTimeRemaining: 180,
          },
          artifacts: [],
          dependencies: [],
          timeline: {
            createdAt: new Date(),
            startedAt: new Date(),
            estimatedDuration: 600,
          },
          metrics: {
            resourceUsage: {
              cpuUtilization: 45,
              memoryUsage: 256,
              diskIO: 10,
              networkIO: 5,
            },
            performanceMetrics: {
              executionTime: 0,
              throughput: 0,
              latency: 0,
              errorRate: 0,
            },
            qualityMetrics: {
              codeQuality: 85,
              testCoverage: 90,
              securityScore: 88,
              performanceScore: 92,
            },
          },
        },
      ],
    })
  }),

  // File system endpoints
  http.get('/api/files', () => {
    return HttpResponse.json({
      success: true,
      data: {
        files: [
          {
            name: 'src',
            type: 'directory',
            children: [
              { name: 'App.tsx', type: 'file', size: 1024 },
              { name: 'main.tsx', type: 'file', size: 512 },
              {
                name: 'components',
                type: 'directory',
                children: [
                  { name: 'Button.tsx', type: 'file', size: 2048 },
                  { name: 'Modal.tsx', type: 'file', size: 1536 },
                ],
              },
            ],
          },
          { name: 'package.json', type: 'file', size: 1024 },
          { name: 'README.md', type: 'file', size: 512 },
        ],
      },
    })
  }),

  http.get('/api/files/:path', ({ params }) => {
    const { path } = params
    return HttpResponse.json({
      success: true,
      data: {
        path,
        content: `// Mock content for ${path}\nexport default function Component() {\n  return <div>Hello from ${path}</div>\n}`,
        lastModified: new Date(),
        size: 128,
      },
    })
  }),

  // WebSocket mock for testing
  http.get('/ws', () => {
    return new Response('WebSocket connection established', { status: 101 })
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: 'connected',
          redis: 'connected',
          websocket: 'connected',
        },
      },
    })
  }),

  // Error handling test endpoint
  http.get('/api/error-test', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'This is a test error for error handling',
          details: { testCase: 'error-boundary' },
        },
      },
      { status: 500 }
    )
  }),
]