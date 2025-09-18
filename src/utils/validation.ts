/**
 * Comprehensive validation utilities for CloudIDE
 * Provides type-safe validation schemas and error handling
 */

import { z } from 'zod';
import { logger } from './logger';

// Base validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email is too long');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username is too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// User validation schemas
export const userRegistrationSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const userProfileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  timezone: z.string().min(1, 'Timezone is required'),
  locale: z.string().min(1, 'Locale is required'),
  avatar: z.string().url().optional(),
});

// Builder validation schemas
export const builderCapabilitySchema = z.object({
  name: z.string().min(1, 'Capability name is required'),
  version: z.string().min(1, 'Version is required'),
  dependencies: z.array(z.string()),
});

export const resourceAllocationSchema = z.object({
  cpu: z.number().min(0.1, 'CPU must be at least 0.1 cores').max(32, 'CPU cannot exceed 32 cores'),
  memory: z.number().min(128, 'Memory must be at least 128MB').max(32768, 'Memory cannot exceed 32GB'),
  storage: z.number().min(1, 'Storage must be at least 1GB').max(1000, 'Storage cannot exceed 1TB'),
  networkBandwidth: z.number().min(1, 'Network bandwidth must be at least 1Mbps').max(10000, 'Network bandwidth cannot exceed 10Gbps'),
});

export const builderDefinitionSchema = z.object({
  name: z.string().min(1, 'Builder name is required').max(100, 'Builder name is too long'),
  type: z.enum(['frontend', 'backend', 'database', 'devops', 'security', 'testing', 'ai-ml']),
  capabilities: z.array(builderCapabilitySchema),
  environment: z.object({
    region: z.string().min(1, 'Region is required'),
    provider: z.enum(['aws', 'azure', 'gcp', 'local']),
    instanceType: z.string().min(1, 'Instance type is required'),
    endpoint: z.string().url('Invalid endpoint URL'),
  }),
  resources: resourceAllocationSchema,
});

// Task validation schemas
export const taskRequirementsSchema = z.object({
  description: z.string().min(1, 'Task description is required').max(1000, 'Description is too long'),
  specifications: z.record(z.unknown()),
  constraints: z.object({
    maxExecutionTime: z.number().min(1, 'Execution time must be at least 1 second').max(86400, 'Execution time cannot exceed 24 hours'),
    maxMemoryUsage: z.number().min(1, 'Memory usage must be at least 1MB').max(8192, 'Memory usage cannot exceed 8GB'),
    requiredCapabilities: z.array(z.string()),
    securityLevel: z.enum(['low', 'medium', 'high', 'critical']),
  }),
  expectedOutcome: z.string().min(1, 'Expected outcome is required').max(500, 'Expected outcome is too long'),
});

export const taskCreationSchema = z.object({
  builderId: z.string().min(1, 'Builder ID is required'),
  type: z.enum(['create', 'update', 'delete', 'test', 'deploy', 'analyze', 'optimize', 'security-audit']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  requirements: taskRequirementsSchema,
});

// File validation schemas
export const filePathSchema = z
  .string()
  .min(1, 'File path is required')
  .max(1000, 'File path is too long')
  .regex(/^[^<>:"|?*]+$/, 'File path contains invalid characters');

export const fileContentSchema = z
  .string()
  .max(10 * 1024 * 1024, 'File content cannot exceed 10MB'); // 10MB limit

export const fileOperationSchema = z.object({
  path: filePathSchema,
  content: fileContentSchema.optional(),
  operation: z.enum(['create', 'read', 'update', 'delete', 'rename', 'copy', 'move']),
  metadata: z.object({
    size: z.number().min(0).optional(),
    lastModified: z.date().optional(),
    permissions: z.string().optional(),
  }).optional(),
});

// API validation schemas
export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').max(1000, 'Page cannot exceed 1000').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200, 'Search query is too long'),
  filters: z.record(z.unknown()).optional(),
  ...paginationSchema.shape,
});

// Environment variable validation
export const envConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_API_URL: z.string().url('Invalid API URL').optional(),
  VITE_WS_URL: z.string().url('Invalid WebSocket URL').optional(),
  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  VITE_APP_VERSION: z.string().optional(),
  VITE_BUILD_DATE: z.string().optional(),
  VITE_GIT_HASH: z.string().optional(),
});

// Validation result types
export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  errors: Array<{
    path: string[];
    message: string;
    code: string;
  }>;
};

// Generic validation function
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          path: err.path.map(String),
          message: err.message,
          code: err.code,
        })),
      };
    }

    logger.error('Unexpected validation error', error as Error);
    return {
      success: false,
      errors: [{
        path: [],
        message: 'An unexpected validation error occurred',
        code: 'unexpected_error',
      }],
    };
  }
}

// Safe validation function that logs errors
export function validateWithLogging<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): ValidationResult<T> {
  const result = validate(schema, data);

  if (!result.success) {
    logger.warn('Validation failed', undefined, {
      context,
      errors: result.errors,
      data: typeof data === 'object' ? JSON.stringify(data) : String(data),
    });
  }

  return result;
}

// Type guards
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function isValidUsername(username: string): boolean {
  return usernameSchema.safeParse(username).success;
}

export function isValidFilePath(path: string): boolean {
  return filePathSchema.safeParse(path).success;
}

// Sanitization functions
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"|?*]/g, '') // Remove invalid file characters
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/^\./, '') // Remove leading dots
    .trim();
}

export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

// Rate limiting validation
export function validateRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  requests: Map<string, number[]> = new Map()
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  const userRequests = requests.get(key) || [];
  const validRequests = userRequests.filter(time => time > windowStart);

  if (validRequests.length >= limit) {
    return false;
  }

  validRequests.push(now);
  requests.set(key, validRequests);

  return true;
}

// Validation error formatting
export function formatValidationErrors(errors: ValidationResult<any>['errors']): string {
  if (!Array.isArray(errors)) return 'Unknown validation error';

  return errors
    .map(error => {
      const path = error.path.length > 0 ? `${error.path.join('.')}: ` : '';
      return `${path}${error.message}`;
    })
    .join(', ');
}

// Form validation hook for React components
export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  return {
    validate: (data: unknown) => validate(schema, data),
    validateField: (fieldSchema: z.ZodSchema<any>, value: unknown) => validate(fieldSchema, value),
    isValid: (data: unknown) => schema.safeParse(data).success,
  };
}

// Export all schemas for use in other modules
export const validationSchemas = {
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  userRegistration: userRegistrationSchema,
  userLogin: userLoginSchema,
  userProfileUpdate: userProfileUpdateSchema,
  builderDefinition: builderDefinitionSchema,
  taskCreation: taskCreationSchema,
  fileOperation: fileOperationSchema,
  pagination: paginationSchema,
  search: searchSchema,
  envConfig: envConfigSchema,
} as const;

export default validationSchemas;