// Core application types with enhanced type safety and documentation

export interface ApplicationConfig {
  readonly apiUrl: string;
  readonly wsUrl: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly features: FeatureFlags;
  readonly monitoring: MonitoringConfig;
}

export interface FeatureFlags {
  readonly realTimeUpdates: boolean;
  readonly advancedEditor: boolean;
  readonly performanceMonitoring: boolean;
  readonly securityAudit: boolean;
  readonly accessibilityEnhancements: boolean;
}

export interface MonitoringConfig {
  readonly enableAnalytics: boolean;
  readonly enableErrorReporting: boolean;
  readonly performanceThreshold: number;
  readonly logLevel: LogLevel;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Builder System Types
export interface BuilderDefinition {
  readonly id: BuilderId;
  readonly name: string;
  readonly type: BuilderType;
  readonly capabilities: readonly BuilderCapability[];
  readonly environment: CloudEnvironment;
  readonly resources: ResourceAllocation;
  readonly status: BuilderStatus;
  readonly metadata: BuilderMetadata;
}

export type BuilderId = string & { readonly __brand: 'BuilderId' };
export type BuilderType = 'frontend' | 'backend' | 'database' | 'devops' | 'security' | 'testing' | 'ai-ml';

export interface BuilderCapability {
  readonly name: string;
  readonly version: string;
  readonly dependencies: readonly string[];
}

export interface CloudEnvironment {
  readonly region: string;
  readonly provider: 'aws' | 'azure' | 'gcp' | 'local';
  readonly instanceType: string;
  readonly endpoint: string;
  readonly credentials?: EnvironmentCredentials;
}

export interface EnvironmentCredentials {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly sessionToken?: string;
}

export interface ResourceAllocation {
  readonly cpu: number; // cores
  readonly memory: number; // MB
  readonly storage: number; // GB
  readonly networkBandwidth: number; // Mbps
}

export type BuilderStatus = 
  | 'initializing'
  | 'idle' 
  | 'analyzing' 
  | 'coding' 
  | 'testing' 
  | 'building'
  | 'deploying' 
  | 'complete' 
  | 'error' 
  | 'timeout'
  | 'suspended';

export interface BuilderMetadata {
  readonly createdAt: Date;
  readonly lastActive: Date;
  readonly totalTasks: number;
  readonly successfulTasks: number;
  readonly averageCompletionTime: number; // seconds
  readonly currentLoad: number; // percentage
}

// Task Management Types
export interface BuildTask {
  readonly id: TaskId;
  readonly builderId: BuilderId;
  readonly type: TaskType;
  readonly priority: TaskPriority;
  readonly requirements: TaskRequirements;
  readonly status: TaskStatus;
  readonly progress: TaskProgress;
  readonly artifacts: readonly TaskArtifact[];
  readonly dependencies: readonly TaskId[];
  readonly timeline: TaskTimeline;
  readonly metrics: TaskMetrics;
}

export type TaskId = string & { readonly __brand: 'TaskId' };
export type TaskType = 'create' | 'update' | 'delete' | 'test' | 'deploy' | 'analyze' | 'optimize' | 'security-audit';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'queued' | 'in-progress' | 'blocked' | 'completed' | 'failed' | 'cancelled';

export interface TaskRequirements {
  readonly description: string;
  readonly specifications: Record<string, unknown>;
  readonly constraints: TaskConstraints;
  readonly expectedOutcome: string;
}

export interface TaskConstraints {
  readonly maxExecutionTime: number; // seconds
  readonly maxMemoryUsage: number; // MB
  readonly requiredCapabilities: readonly string[];
  readonly securityLevel: SecurityLevel;
}

export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TaskProgress {
  readonly percentage: number;
  readonly currentStep: string;
  readonly totalSteps: number;
  readonly completedSteps: number;
  readonly estimatedTimeRemaining: number; // seconds
}

export interface TaskArtifact {
  readonly id: string;
  readonly name: string;
  readonly type: ArtifactType;
  readonly size: number; // bytes
  readonly url: string;
  readonly checksum: string;
  readonly metadata: Record<string, unknown>;
}

export type ArtifactType = 'source-code' | 'binary' | 'documentation' | 'test-result' | 'deployment-config' | 'report';

export interface TaskTimeline {
  readonly createdAt: Date;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly estimatedDuration: number; // seconds
  readonly actualDuration?: number; // seconds
}

export interface TaskMetrics {
  readonly resourceUsage: ResourceUsage;
  readonly performanceMetrics: PerformanceMetrics;
  readonly qualityMetrics: QualityMetrics;
}

export interface ResourceUsage {
  readonly cpuUtilization: number; // percentage
  readonly memoryUsage: number; // MB
  readonly diskIO: number; // MB/s
  readonly networkIO: number; // MB/s
}

export interface PerformanceMetrics {
  readonly executionTime: number; // seconds
  readonly throughput: number; // tasks/minute
  readonly latency: number; // milliseconds
  readonly errorRate: number; // percentage
}

export interface QualityMetrics {
  readonly codeQuality: number; // 0-100
  readonly testCoverage: number; // percentage
  readonly securityScore: number; // 0-100
  readonly performanceScore: number; // 0-100
}

// Communication Types
export interface WebSocketMessage<T = unknown> {
  readonly id: string;
  readonly type: MessageType;
  readonly timestamp: Date;
  readonly senderId: string;
  readonly receiverId?: string;
  readonly payload: T;
  readonly metadata?: MessageMetadata;
}

export type MessageType = 
  | 'builder-status-update'
  | 'task-progress-update'
  | 'task-completed'
  | 'task-failed'
  | 'system-notification'
  | 'user-action'
  | 'heartbeat'
  | 'error';

export interface MessageMetadata {
  readonly correlationId?: string;
  readonly retryCount?: number;
  readonly priority?: TaskPriority;
  readonly ttl?: number; // seconds
}

// UI State Types
export interface UIState {
  readonly activeTab: TabType;
  readonly selectedFiles: readonly string[];
  readonly editorSettings: EditorSettings;
  readonly layoutConfig: LayoutConfig;
  readonly theme: ThemeSettings;
  readonly accessibility: AccessibilitySettings;
}

export type TabType = 'editor' | 'terminal' | 'file-explorer' | 'builder-panel' | 'chat' | 'settings';

export interface EditorSettings {
  readonly fontSize: number;
  readonly fontFamily: string;
  readonly theme: 'light' | 'dark' | 'high-contrast';
  readonly tabSize: number;
  readonly wordWrap: boolean;
  readonly lineNumbers: boolean;
  readonly minimap: boolean;
  readonly autoSave: boolean;
  readonly formatOnSave: boolean;
}

export interface LayoutConfig {
  readonly sidebarWidth: number;
  readonly panelHeight: number;
  readonly showStatusBar: boolean;
  readonly showActivityBar: boolean;
  readonly workbenchLayout: 'default' | 'compact' | 'expanded';
}

export interface ThemeSettings {
  readonly name: string;
  readonly colors: ThemeColors;
  readonly customizations: Record<string, string>;
}

export interface ThemeColors {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly background: string;
  readonly foreground: string;
  readonly border: string;
  readonly error: string;
  readonly warning: string;
  readonly success: string;
  readonly info: string;
}

export interface AccessibilitySettings {
  readonly enableScreenReader: boolean;
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  readonly announceStatus: boolean;
  readonly keyboardShortcuts: KeyboardShortcuts;
}

export interface KeyboardShortcuts {
  readonly [action: string]: string;
}

// Error Handling Types
export interface AppError {
  readonly id: string;
  readonly type: ErrorType;
  readonly message: string;
  readonly stack?: string;
  readonly context: ErrorContext;
  readonly timestamp: Date;
  readonly severity: ErrorSeverity;
  readonly recoverable: boolean;
}

export type ErrorType = 
  | 'network-error'
  | 'validation-error'
  | 'authentication-error'
  | 'authorization-error'
  | 'builder-error'
  | 'system-error'
  | 'user-error';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  readonly userId?: string;
  readonly sessionId: string;
  readonly builderId?: BuilderId;
  readonly taskId?: TaskId;
  readonly userAgent: string;
  readonly url: string;
  readonly additionalData?: Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly metadata: ResponseMetadata;
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export interface ResponseMetadata {
  readonly requestId: string;
  readonly timestamp: Date;
  readonly version: string;
  readonly processingTime: number; // milliseconds
}

// Utility Types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> & 
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Keys>>;
  }[Keys];

export type NonEmptyArray<T> = [T, ...T[]];

// Event System Types
export interface EventBus {
  subscribe<T>(event: EventType, handler: EventHandler<T>): UnsubscribeFunction;
  emit<T>(event: EventType, data: T): void;
  removeAllListeners(event?: EventType): void;
}

export type EventType = string & { readonly __brand: 'EventType' };
export type EventHandler<T> = (data: T) => void | Promise<void>;
export type UnsubscribeFunction = () => void;

// Performance Monitoring Types
export interface PerformanceMonitor {
  readonly metrics: PerformanceMetrics;
  readonly vitals: WebVitals;
  readonly resourceTiming: ResourceTiming[];
}

export interface WebVitals {
  readonly FCP: number; // First Contentful Paint
  readonly LCP: number; // Largest Contentful Paint
  readonly FID: number; // First Input Delay
  readonly CLS: number; // Cumulative Layout Shift
  readonly TTFB: number; // Time to First Byte
}

export interface ResourceTiming {
  readonly name: string;
  readonly duration: number;
  readonly size: number;
  readonly type: 'navigation' | 'resource';
}

// Authentication Types
export interface User {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly roles: readonly Role[];
  readonly permissions: readonly Permission[];
  readonly profile: UserProfile;
  readonly preferences: UserPreferences;
}

export interface Role {
  readonly id: string;
  readonly name: string;
  readonly permissions: readonly Permission[];
}

export interface Permission {
  readonly id: string;
  readonly resource: string;
  readonly action: string;
}

export interface UserProfile {
  readonly firstName: string;
  readonly lastName: string;
  readonly avatar?: string;
  readonly timezone: string;
  readonly locale: string;
}

export interface UserPreferences {
  readonly theme: string;
  readonly language: string;
  readonly notifications: NotificationPreferences;
  readonly privacy: PrivacySettings;
}

export interface NotificationPreferences {
  readonly email: boolean;
  readonly push: boolean;
  readonly desktop: boolean;
  readonly sound: boolean;
}

export interface PrivacySettings {
  readonly shareUsageData: boolean;
  readonly allowCookies: boolean;
  readonly trackingEnabled: boolean;
}

// Component Props Types
export interface BaseComponentProps {
  readonly className?: string;
  readonly testId?: string;
  readonly ariaLabel?: string;
  readonly ariaDescribedBy?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly onClick?: (event: React.MouseEvent) => void;
  readonly onKeyDown?: (event: React.KeyboardEvent) => void;
}

export interface FormComponentProps extends InteractiveComponentProps {
  readonly name: string;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (value: string) => void;
  readonly onBlur?: (event: React.FocusEvent) => void;
  readonly error?: string;
  readonly required?: boolean;
}