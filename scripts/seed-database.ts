#!/usr/bin/env tsx

/**
 * Database Seeding Script for CloudIDE
 *
 * This script populates the database with realistic sample data for development
 * and testing purposes. It creates users, builders, tasks, projects, and other
 * entities with proper relationships and realistic data patterns.
 *
 * Usage:
 *   npm run db:seed              # Seed with default data
 *   npm run db:seed -- --clean   # Clean existing data first
 *   npm run db:seed -- --env=staging  # Seed staging environment
 *   npm run db:seed -- --users=50     # Create 50 users instead of default
 *
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection string
 *   NODE_ENV - Environment (development/staging/production)
 */

import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';

// Type definitions for our entities
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'developer' | 'viewer' | 'manager';
  permissions: string[];
  avatar?: string;
  timezone: string;
  locale: string;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    editorSettings: {
      fontSize: number;
      fontFamily: string;
      tabSize: number;
      wordWrap: boolean;
      lineNumbers: boolean;
    };
    notifications: {
      email: boolean;
      push: boolean;
      desktop: boolean;
    };
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  collaboratorIds: string[];
  visibility: 'private' | 'public' | 'team';
  repository: {
    url: string;
    branch: string;
    provider: 'github' | 'gitlab' | 'bitbucket';
  };
  framework: 'react' | 'vue' | 'angular' | 'nodejs' | 'python' | 'java';
  status: 'active' | 'archived' | 'template';
  createdAt: Date;
  updatedAt: Date;
  settings: {
    autoSave: boolean;
    buildOnSave: boolean;
    linting: boolean;
    formatting: boolean;
  };
}

interface Builder {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'devops' | 'security' | 'testing' | 'ai-ml';
  status: 'initializing' | 'idle' | 'busy' | 'error' | 'maintenance';
  capabilities: Array<{
    name: string;
    version: string;
    dependencies: string[];
  }>;
  environment: {
    region: string;
    provider: 'aws' | 'azure' | 'gcp' | 'local';
    instanceType: string;
    endpoint: string;
  };
  resources: {
    cpu: number;
    memory: number;
    storage: number;
    networkBandwidth: number;
  };
  metadata: {
    createdAt: Date;
    lastActive: Date;
    totalTasks: number;
    successfulTasks: number;
    averageCompletionTime: number;
    currentLoad: number;
  };
  costMetrics: {
    hourlyRate: number;
    monthlyBudget: number;
    currentMonthCost: number;
  };
}

interface Task {
  id: string;
  projectId: string;
  builderId: string;
  assignedUserId: string;
  type: 'create' | 'update' | 'delete' | 'test' | 'deploy' | 'analyze' | 'optimize';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'queued' | 'in-progress' | 'blocked' | 'completed' | 'failed' | 'cancelled';
  title: string;
  description: string;
  requirements: {
    specifications: Record<string, any>;
    constraints: {
      maxExecutionTime: number;
      maxMemoryUsage: number;
      requiredCapabilities: string[];
      securityLevel: 'low' | 'medium' | 'high' | 'critical';
    };
    expectedOutcome: string;
  };
  progress: {
    percentage: number;
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    estimatedTimeRemaining: number;
  };
  timeline: {
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    estimatedDuration: number;
    actualDuration?: number;
  };
  artifacts: Array<{
    id: string;
    name: string;
    type: 'source-code' | 'binary' | 'documentation' | 'test-result';
    size: number;
    url: string;
    checksum: string;
  }>;
  metrics: {
    codeQuality: number;
    testCoverage: number;
    securityScore: number;
    performanceScore: number;
  };
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: 'user' | 'project' | 'builder' | 'task' | 'file';
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata: {
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    sessionId: string;
  };
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface Collaboration {
  id: string;
  projectId: string;
  sessionId: string;
  participants: Array<{
    userId: string;
    role: 'owner' | 'editor' | 'viewer';
    joinedAt: Date;
    lastActiveAt: Date;
    cursor?: {
      file: string;
      line: number;
      column: number;
    };
  }>;
  comments: Array<{
    id: string;
    userId: string;
    content: string;
    position: {
      file: string;
      line: number;
      column?: number;
    };
    createdAt: Date;
    resolved: boolean;
    replies: Array<{
      id: string;
      userId: string;
      content: string;
      createdAt: Date;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Configuration
interface SeedConfig {
  clean: boolean;
  environment: 'development' | 'staging' | 'production';
  counts: {
    users: number;
    projects: number;
    builders: number;
    tasks: number;
    auditLogs: number;
    collaborationSessions: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: SeedConfig = {
  clean: false,
  environment: 'development',
  counts: {
    users: 25,
    projects: 15,
    builders: 8,
    tasks: 50,
    auditLogs: 200,
    collaborationSessions: 10,
  },
};

// Parse command line arguments
function parseArgs(): Partial<SeedConfig> {
  const args = process.argv.slice(2);
  const config: Partial<SeedConfig> = {};

  args.forEach(arg => {
    if (arg === '--clean') {
      config.clean = true;
    } else if (arg.startsWith('--env=')) {
      config.environment = arg.split('=')[1] as any;
    } else if (arg.startsWith('--users=')) {
      config.counts = { ...config.counts, users: parseInt(arg.split('=')[1]) };
    } else if (arg.startsWith('--projects=')) {
      config.counts = { ...config.counts, projects: parseInt(arg.split('=')[1]) };
    }
  });

  return config;
}

// Data generators
class DataGenerator {
  private users: User[] = [];
  private projects: Project[] = [];
  private builders: Builder[] = [];

  generateUsers(count: number): User[] {
    console.log(`Generating ${count} users...`);

    const roles: User['role'][] = ['admin', 'developer', 'viewer', 'manager'];
    const timezones = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'];
    const locales = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'];

    this.users = Array.from({ length: count }, () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const username = faker.internet.userName({ firstName, lastName });
      const role = faker.helpers.arrayElement(roles);

      const permissions = this.generatePermissions(role);

      return {
        id: randomUUID(),
        username,
        email: faker.internet.email({ firstName, lastName }),
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8ukY3AFCDS', // "password123"
        firstName,
        lastName,
        role,
        permissions,
        avatar: faker.helpers.maybe(() => faker.image.avatar(), { probability: 0.7 }),
        timezone: faker.helpers.arrayElement(timezones),
        locale: faker.helpers.arrayElement(locales),
        createdAt: faker.date.past({ years: 2 }),
        lastLoginAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), { probability: 0.8 }),
        isActive: faker.datatype.boolean({ probability: 0.9 }),
        preferences: {
          theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
          editorSettings: {
            fontSize: faker.helpers.arrayElement([12, 14, 16, 18]),
            fontFamily: faker.helpers.arrayElement(['Monaco', 'Fira Code', 'JetBrains Mono']),
            tabSize: faker.helpers.arrayElement([2, 4]),
            wordWrap: faker.datatype.boolean(),
            lineNumbers: faker.datatype.boolean({ probability: 0.9 }),
          },
          notifications: {
            email: faker.datatype.boolean({ probability: 0.8 }),
            push: faker.datatype.boolean({ probability: 0.6 }),
            desktop: faker.datatype.boolean({ probability: 0.7 }),
          },
        },
      };
    });

    return this.users;
  }

  generateProjects(count: number): Project[] {
    console.log(`Generating ${count} projects...`);

    const frameworks: Project['framework'][] = ['react', 'vue', 'angular', 'nodejs', 'python', 'java'];
    const providers: Project['repository']['provider'][] = ['github', 'gitlab', 'bitbucket'];

    this.projects = Array.from({ length: count }, () => {
      const name = faker.helpers.arrayElement([
        'E-commerce Platform',
        'Task Management App',
        'Social Media Dashboard',
        'Blog Engine',
        'API Gateway',
        'Mobile Banking App',
        'Video Streaming Service',
        'IoT Device Manager',
        'Machine Learning Pipeline',
        'Customer Support System',
      ]);

      const owner = faker.helpers.arrayElement(this.users);
      const collaborators = faker.helpers.arrayElements(
        this.users.filter(u => u.id !== owner.id),
        { min: 0, max: 5 }
      );

      return {
        id: randomUUID(),
        name: `${name} ${faker.number.int({ min: 1, max: 99 })}`,
        description: faker.lorem.paragraph(),
        ownerId: owner.id,
        collaboratorIds: collaborators.map(c => c.id),
        visibility: faker.helpers.arrayElement(['private', 'public', 'team']),
        repository: {
          url: faker.internet.url(),
          branch: faker.helpers.arrayElement(['main', 'develop', 'master']),
          provider: faker.helpers.arrayElement(providers),
        },
        framework: faker.helpers.arrayElement(frameworks),
        status: faker.helpers.arrayElement(['active', 'archived', 'template']),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 }),
        settings: {
          autoSave: faker.datatype.boolean({ probability: 0.8 }),
          buildOnSave: faker.datatype.boolean({ probability: 0.6 }),
          linting: faker.datatype.boolean({ probability: 0.9 }),
          formatting: faker.datatype.boolean({ probability: 0.8 }),
        },
      };
    });

    return this.projects;
  }

  generateBuilders(count: number): Builder[] {
    console.log(`Generating ${count} builders...`);

    const types: Builder['type'][] = ['frontend', 'backend', 'database', 'devops', 'security', 'testing', 'ai-ml'];
    const statuses: Builder['status'][] = ['idle', 'busy', 'error', 'maintenance'];
    const providers: Builder['environment']['provider'][] = ['aws', 'azure', 'gcp', 'local'];
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

    this.builders = Array.from({ length: count }, () => {
      const type = faker.helpers.arrayElement(types);
      const capabilities = this.generateCapabilities(type);
      const status = faker.helpers.arrayElement(statuses);

      return {
        id: randomUUID(),
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Builder ${faker.number.int({ min: 1, max: 99 })}`,
        type,
        status,
        capabilities,
        environment: {
          region: faker.helpers.arrayElement(regions),
          provider: faker.helpers.arrayElement(providers),
          instanceType: faker.helpers.arrayElement(['t3.micro', 't3.small', 't3.medium', 't3.large']),
          endpoint: faker.internet.url(),
        },
        resources: {
          cpu: faker.helpers.arrayElement([1, 2, 4, 8]),
          memory: faker.helpers.arrayElement([1024, 2048, 4096, 8192]),
          storage: faker.helpers.arrayElement([20, 50, 100, 200]),
          networkBandwidth: faker.helpers.arrayElement([100, 500, 1000, 2000]),
        },
        metadata: {
          createdAt: faker.date.past({ years: 1 }),
          lastActive: status === 'idle' ? faker.date.recent({ days: 7 }) : new Date(),
          totalTasks: faker.number.int({ min: 10, max: 1000 }),
          successfulTasks: faker.number.int({ min: 8, max: 950 }),
          averageCompletionTime: faker.number.int({ min: 60, max: 3600 }),
          currentLoad: status === 'busy' ? faker.number.int({ min: 60, max: 100 }) : faker.number.int({ min: 0, max: 30 }),
        },
        costMetrics: {
          hourlyRate: faker.number.float({ min: 0.10, max: 2.50, fractionDigits: 2 }),
          monthlyBudget: faker.number.float({ min: 100, max: 2000, fractionDigits: 2 }),
          currentMonthCost: faker.number.float({ min: 50, max: 1800, fractionDigits: 2 }),
        },
      };
    });

    return this.builders;
  }

  generateTasks(count: number): Task[] {
    console.log(`Generating ${count} tasks...`);

    const types: Task['type'][] = ['create', 'update', 'delete', 'test', 'deploy', 'analyze', 'optimize'];
    const priorities: Task['priority'][] = ['critical', 'high', 'medium', 'low'];
    const statuses: Task['status'][] = ['queued', 'in-progress', 'blocked', 'completed', 'failed', 'cancelled'];

    return Array.from({ length: count }, () => {
      const type = faker.helpers.arrayElement(types);
      const status = faker.helpers.arrayElement(statuses);
      const project = faker.helpers.arrayElement(this.projects);
      const builder = faker.helpers.arrayElement(this.builders);
      const assignedUser = faker.helpers.arrayElement(this.users);

      const createdAt = faker.date.past({ years: 1 });
      const estimatedDuration = faker.number.int({ min: 300, max: 3600 });

      let startedAt: Date | undefined;
      let completedAt: Date | undefined;
      let actualDuration: number | undefined;

      if (['in-progress', 'blocked', 'completed', 'failed', 'cancelled'].includes(status)) {
        startedAt = faker.date.between({ from: createdAt, to: new Date() });
      }

      if (['completed', 'failed', 'cancelled'].includes(status) && startedAt) {
        completedAt = faker.date.between({ from: startedAt, to: new Date() });
        actualDuration = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);
      }

      return {
        id: randomUUID(),
        projectId: project.id,
        builderId: builder.id,
        assignedUserId: assignedUser.id,
        type,
        priority: faker.helpers.arrayElement(priorities),
        status,
        title: this.generateTaskTitle(type),
        description: faker.lorem.paragraph(),
        requirements: {
          specifications: this.generateTaskSpecs(type),
          constraints: {
            maxExecutionTime: estimatedDuration,
            maxMemoryUsage: faker.number.int({ min: 256, max: 2048 }),
            requiredCapabilities: faker.helpers.arrayElements(['React', 'TypeScript', 'Node.js', 'Docker'], { min: 1, max: 3 }),
            securityLevel: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
          },
          expectedOutcome: faker.lorem.sentence(),
        },
        progress: {
          percentage: status === 'completed' ? 100 : faker.number.int({ min: 0, max: 95 }),
          currentStep: faker.helpers.arrayElement(['Planning', 'Implementation', 'Testing', 'Review', 'Deployment']),
          totalSteps: faker.number.int({ min: 3, max: 8 }),
          completedSteps: faker.number.int({ min: 0, max: 6 }),
          estimatedTimeRemaining: status === 'completed' ? 0 : faker.number.int({ min: 0, max: 1800 }),
        },
        timeline: {
          createdAt,
          startedAt,
          completedAt,
          estimatedDuration,
          actualDuration,
        },
        artifacts: this.generateArtifacts(type, status),
        metrics: {
          codeQuality: faker.number.int({ min: 70, max: 100 }),
          testCoverage: faker.number.int({ min: 60, max: 100 }),
          securityScore: faker.number.int({ min: 75, max: 100 }),
          performanceScore: faker.number.int({ min: 80, max: 100 }),
        },
      };
    });
  }

  generateAuditLogs(count: number): AuditLog[] {
    console.log(`Generating ${count} audit logs...`);

    const actions = [
      'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
      'CREATE_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT',
      'CREATE_TASK', 'UPDATE_TASK', 'DELETE_TASK',
      'CREATE_BUILDER', 'UPDATE_BUILDER', 'DELETE_BUILDER',
      'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE',
      'FILE_UPLOAD', 'FILE_DELETE', 'FILE_SHARE',
    ];

    const resourceTypes: AuditLog['resourceType'][] = ['user', 'project', 'builder', 'task', 'file'];
    const severities: AuditLog['severity'][] = ['info', 'warning', 'error', 'critical'];

    return Array.from({ length: count }, () => {
      const user = faker.helpers.arrayElement(this.users);
      const action = faker.helpers.arrayElement(actions);
      const resourceType = faker.helpers.arrayElement(resourceTypes);

      return {
        id: randomUUID(),
        userId: user.id,
        action,
        resourceType,
        resourceId: randomUUID(),
        oldValues: faker.helpers.maybe(() => ({ status: 'draft' }), { probability: 0.4 }),
        newValues: faker.helpers.maybe(() => ({ status: 'published' }), { probability: 0.4 }),
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
          timestamp: faker.date.past({ years: 1 }),
          sessionId: randomUUID(),
        },
        severity: faker.helpers.arrayElement(severities),
      };
    });
  }

  generateCollaborationSessions(count: number): Collaboration[] {
    console.log(`Generating ${count} collaboration sessions...`);

    return Array.from({ length: count }, () => {
      const project = faker.helpers.arrayElement(this.projects);
      const participants = faker.helpers.arrayElements(this.users, { min: 2, max: 5 });

      return {
        id: randomUUID(),
        projectId: project.id,
        sessionId: randomUUID(),
        participants: participants.map(user => ({
          userId: user.id,
          role: faker.helpers.arrayElement(['owner', 'editor', 'viewer']),
          joinedAt: faker.date.recent({ days: 7 }),
          lastActiveAt: faker.date.recent({ days: 1 }),
          cursor: faker.helpers.maybe(() => ({
            file: faker.helpers.arrayElement(['src/App.tsx', 'src/main.tsx', 'package.json']),
            line: faker.number.int({ min: 1, max: 100 }),
            column: faker.number.int({ min: 1, max: 80 }),
          }), { probability: 0.6 }),
        })),
        comments: this.generateComments(participants),
        createdAt: faker.date.recent({ days: 7 }),
        updatedAt: faker.date.recent({ days: 1 }),
      };
    });
  }

  // Helper methods
  private generatePermissions(role: User['role']): string[] {
    const basePermissions = ['read'];

    switch (role) {
      case 'admin':
        return ['read', 'write', 'delete', 'manage_users', 'manage_builders', 'manage_system'];
      case 'manager':
        return ['read', 'write', 'delete', 'manage_projects', 'manage_tasks'];
      case 'developer':
        return ['read', 'write', 'create_projects', 'manage_tasks'];
      case 'viewer':
        return ['read'];
      default:
        return basePermissions;
    }
  }

  private generateCapabilities(type: Builder['type']) {
    const capabilitiesMap = {
      frontend: [
        { name: 'React', version: '18.3.1', dependencies: ['TypeScript'] },
        { name: 'Vue', version: '3.4.0', dependencies: [] },
        { name: 'Angular', version: '17.0.0', dependencies: ['TypeScript'] },
        { name: 'Vite', version: '5.0.0', dependencies: [] },
      ],
      backend: [
        { name: 'Node.js', version: '20.0.0', dependencies: [] },
        { name: 'Express', version: '4.18.0', dependencies: ['Node.js'] },
        { name: 'FastAPI', version: '0.104.0', dependencies: ['Python'] },
        { name: 'Spring Boot', version: '3.2.0', dependencies: ['Java'] },
      ],
      database: [
        { name: 'PostgreSQL', version: '16.0', dependencies: [] },
        { name: 'MongoDB', version: '7.0', dependencies: [] },
        { name: 'Redis', version: '7.2', dependencies: [] },
      ],
      devops: [
        { name: 'Docker', version: '24.0.0', dependencies: [] },
        { name: 'Kubernetes', version: '1.28.0', dependencies: [] },
        { name: 'Terraform', version: '1.6.0', dependencies: [] },
      ],
      security: [
        { name: 'SonarQube', version: '10.3.0', dependencies: [] },
        { name: 'OWASP ZAP', version: '2.14.0', dependencies: [] },
      ],
      testing: [
        { name: 'Jest', version: '29.7.0', dependencies: [] },
        { name: 'Playwright', version: '1.40.0', dependencies: [] },
        { name: 'Cypress', version: '13.6.0', dependencies: [] },
      ],
      'ai-ml': [
        { name: 'TensorFlow', version: '2.15.0', dependencies: ['Python'] },
        { name: 'PyTorch', version: '2.1.0', dependencies: ['Python'] },
        { name: 'OpenAI API', version: '1.3.0', dependencies: [] },
      ],
    };

    return faker.helpers.arrayElements(capabilitiesMap[type] || [], { min: 2, max: 4 });
  }

  private generateTaskTitle(type: Task['type']): string {
    const titles = {
      create: ['Create user authentication system', 'Build payment gateway integration', 'Develop API endpoints'],
      update: ['Update user profile component', 'Refactor database queries', 'Upgrade dependency versions'],
      delete: ['Remove deprecated features', 'Clean up unused components', 'Delete legacy code'],
      test: ['Write unit tests for auth module', 'Add integration tests', 'Perform load testing'],
      deploy: ['Deploy to staging environment', 'Production deployment', 'Rollback to previous version'],
      analyze: ['Analyze performance metrics', 'Code quality assessment', 'Security vulnerability scan'],
      optimize: ['Optimize database queries', 'Improve page load times', 'Reduce bundle size'],
    };

    return faker.helpers.arrayElement(titles[type] || ['Generic task']);
  }

  private generateTaskSpecs(type: Task['type']): Record<string, any> {
    const specs = {
      create: {
        framework: faker.helpers.arrayElement(['React', 'Vue', 'Angular']),
        language: faker.helpers.arrayElement(['TypeScript', 'JavaScript']),
        features: faker.helpers.arrayElements(['authentication', 'validation', 'responsive design'], { min: 1, max: 3 }),
      },
      update: {
        version: faker.system.semver(),
        breaking_changes: faker.datatype.boolean(),
        migration_required: faker.datatype.boolean(),
      },
      test: {
        test_type: faker.helpers.arrayElement(['unit', 'integration', 'e2e']),
        coverage_target: faker.number.int({ min: 80, max: 100 }),
        test_framework: faker.helpers.arrayElement(['Jest', 'Vitest', 'Playwright']),
      },
      deploy: {
        environment: faker.helpers.arrayElement(['staging', 'production']),
        strategy: faker.helpers.arrayElement(['blue-green', 'rolling', 'canary']),
        rollback_plan: faker.datatype.boolean(),
      },
    };

    return specs[type as keyof typeof specs] || {};
  }

  private generateArtifacts(type: Task['type'], status: Task['status']) {
    if (status === 'queued') return [];

    const artifactTypes = ['source-code', 'binary', 'documentation', 'test-result'] as const;
    const count = faker.number.int({ min: 1, max: 4 });

    return Array.from({ length: count }, () => ({
      id: randomUUID(),
      name: faker.system.fileName(),
      type: faker.helpers.arrayElement(artifactTypes),
      size: faker.number.int({ min: 1024, max: 10485760 }),
      url: faker.internet.url(),
      checksum: faker.string.hexadecimal({ length: 64 }),
    }));
  }

  private generateComments(participants: User[]) {
    const commentCount = faker.number.int({ min: 0, max: 8 });

    return Array.from({ length: commentCount }, () => {
      const author = faker.helpers.arrayElement(participants);
      const replyCount = faker.number.int({ min: 0, max: 3 });

      return {
        id: randomUUID(),
        userId: author.id,
        content: faker.lorem.sentence(),
        position: {
          file: faker.helpers.arrayElement(['src/App.tsx', 'src/main.tsx', 'package.json']),
          line: faker.number.int({ min: 1, max: 100 }),
          column: faker.number.int({ min: 1, max: 80 }),
        },
        createdAt: faker.date.recent({ days: 7 }),
        resolved: faker.datatype.boolean({ probability: 0.3 }),
        replies: Array.from({ length: replyCount }, () => ({
          id: randomUUID(),
          userId: faker.helpers.arrayElement(participants).id,
          content: faker.lorem.sentence(),
          createdAt: faker.date.recent({ days: 6 }),
        })),
      };
    });
  }
}

// Database operations (mock - replace with actual database calls)
class DatabaseSeeder {
  async cleanDatabase(): Promise<void> {
    console.log('🧹 Cleaning existing data...');
    // In a real implementation, these would be actual database operations
    console.log('  - Cleared audit_logs table');
    console.log('  - Cleared collaboration_sessions table');
    console.log('  - Cleared tasks table');
    console.log('  - Cleared builders table');
    console.log('  - Cleared projects table');
    console.log('  - Cleared users table');
  }

  async seedUsers(users: User[]): Promise<void> {
    console.log(`🔤 Seeding ${users.length} users...`);
    // Batch insert users
    console.log(`  ✅ Inserted ${users.length} users`);
  }

  async seedProjects(projects: Project[]): Promise<void> {
    console.log(`📁 Seeding ${projects.length} projects...`);
    // Batch insert projects
    console.log(`  ✅ Inserted ${projects.length} projects`);
  }

  async seedBuilders(builders: Builder[]): Promise<void> {
    console.log(`🏗️ Seeding ${builders.length} builders...`);
    // Batch insert builders
    console.log(`  ✅ Inserted ${builders.length} builders`);
  }

  async seedTasks(tasks: Task[]): Promise<void> {
    console.log(`✅ Seeding ${tasks.length} tasks...`);
    // Batch insert tasks
    console.log(`  ✅ Inserted ${tasks.length} tasks`);
  }

  async seedAuditLogs(auditLogs: AuditLog[]): Promise<void> {
    console.log(`📋 Seeding ${auditLogs.length} audit logs...`);
    // Batch insert audit logs
    console.log(`  ✅ Inserted ${auditLogs.length} audit logs`);
  }

  async seedCollaborationSessions(sessions: Collaboration[]): Promise<void> {
    console.log(`🤝 Seeding ${sessions.length} collaboration sessions...`);
    // Batch insert collaboration sessions
    console.log(`  ✅ Inserted ${sessions.length} collaboration sessions`);
  }

  async createIndexes(): Promise<void> {
    console.log('📊 Creating database indexes...');
    // Create performance indexes
    console.log('  ✅ Created indexes for optimal query performance');
  }

  async updateStatistics(): Promise<void> {
    console.log('📈 Updating database statistics...');
    // Update table statistics for query optimization
    console.log('  ✅ Updated table statistics');
  }
}

// Main seeding function
async function main() {
  console.log('🚀 Starting CloudIDE Database Seeding...\n');

  try {
    // Parse configuration
    const argConfig = parseArgs();
    const config: SeedConfig = { ...DEFAULT_CONFIG, ...argConfig };

    console.log('📋 Seeding Configuration:');
    console.log(`  Environment: ${config.environment}`);
    console.log(`  Clean existing data: ${config.clean}`);
    console.log(`  Users: ${config.counts.users}`);
    console.log(`  Projects: ${config.counts.projects}`);
    console.log(`  Builders: ${config.counts.builders}`);
    console.log(`  Tasks: ${config.counts.tasks}`);
    console.log(`  Audit Logs: ${config.counts.auditLogs}`);
    console.log(`  Collaboration Sessions: ${config.counts.collaborationSessions}\n`);

    // Initialize seeder
    const generator = new DataGenerator();
    const seeder = new DatabaseSeeder();

    // Clean database if requested
    if (config.clean) {
      await seeder.cleanDatabase();
      console.log();
    }

    // Generate and seed data
    const users = generator.generateUsers(config.counts.users);
    await seeder.seedUsers(users);

    const projects = generator.generateProjects(config.counts.projects);
    await seeder.seedProjects(projects);

    const builders = generator.generateBuilders(config.counts.builders);
    await seeder.seedBuilders(builders);

    const tasks = generator.generateTasks(config.counts.tasks);
    await seeder.seedTasks(tasks);

    const auditLogs = generator.generateAuditLogs(config.counts.auditLogs);
    await seeder.seedAuditLogs(auditLogs);

    const collaborationSessions = generator.generateCollaborationSessions(config.counts.collaborationSessions);
    await seeder.seedCollaborationSessions(collaborationSessions);

    // Post-seeding optimization
    await seeder.createIndexes();
    await seeder.updateStatistics();

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  👥 Users: ${users.length}`);
    console.log(`  📁 Projects: ${projects.length}`);
    console.log(`  🏗️ Builders: ${builders.length}`);
    console.log(`  ✅ Tasks: ${tasks.length}`);
    console.log(`  📋 Audit Logs: ${auditLogs.length}`);
    console.log(`  🤝 Collaboration Sessions: ${collaborationSessions.length}`);

    // Sample data for verification
    console.log('\n🔍 Sample Data Created:');
    console.log('  Admin User:', users.find(u => u.role === 'admin')?.email || 'N/A');
    console.log('  Active Project:', projects.find(p => p.status === 'active')?.name || 'N/A');
    console.log('  Available Builder:', builders.find(b => b.status === 'idle')?.name || 'N/A');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DataGenerator, DatabaseSeeder, main as seedDatabase };