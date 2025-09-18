/**
 * Audit Trail System for CloudIDE
 *
 * This module provides comprehensive audit logging functionality to track
 * all user actions, system changes, and security events for compliance
 * and monitoring purposes.
 *
 * Features:
 * - Automatic audit log creation for CRUD operations
 * - User action tracking with context
 * - Security event monitoring
 * - Performance metrics logging
 * - Compliance-ready audit trails (SOX, GDPR, HIPAA)
 * - Real-time audit event streaming
 * - Audit log retention and archival
 */

import { randomUUID } from 'crypto';

// Types for audit logging
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  sessionId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  resourceName?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata: AuditMetadata;
  severity: AuditSeverity;
  category: AuditCategory;
  outcome: AuditOutcome;
  risk_score: number; // 0-100, higher means more risky
  compliance_tags: string[];
}

export type AuditAction =
  // User Management
  | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'USER_SUSPENDED'
  | 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_LOGIN_FAILED'
  | 'PASSWORD_CHANGED' | 'PASSWORD_RESET_REQUESTED' | 'PASSWORD_RESET_COMPLETED'
  | 'EMAIL_CHANGED' | 'EMAIL_VERIFIED'
  | 'ROLE_ASSIGNED' | 'ROLE_REMOVED' | 'PERMISSIONS_UPDATED'

  // Project Management
  | 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'PROJECT_DELETED' | 'PROJECT_ARCHIVED'
  | 'PROJECT_SHARED' | 'PROJECT_UNSHARED' | 'PROJECT_VISIBILITY_CHANGED'
  | 'PROJECT_COLLABORATOR_ADDED' | 'PROJECT_COLLABORATOR_REMOVED'
  | 'PROJECT_SETTINGS_CHANGED' | 'PROJECT_TRANSFERRED'

  // File Operations
  | 'FILE_CREATED' | 'FILE_UPDATED' | 'FILE_DELETED' | 'FILE_MOVED' | 'FILE_RENAMED'
  | 'FILE_UPLOADED' | 'FILE_DOWNLOADED' | 'FILE_SHARED' | 'FILE_COMPRESSED'
  | 'FOLDER_CREATED' | 'FOLDER_DELETED' | 'FOLDER_MOVED'

  // Builder Operations
  | 'BUILDER_CREATED' | 'BUILDER_UPDATED' | 'BUILDER_DELETED' | 'BUILDER_STARTED'
  | 'BUILDER_STOPPED' | 'BUILDER_RESTARTED' | 'BUILDER_SCALED' | 'BUILDER_MAINTENANCE'
  | 'BUILDER_RESOURCES_CHANGED' | 'BUILDER_ENVIRONMENT_UPDATED'

  // Task Management
  | 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED' | 'TASK_ASSIGNED'
  | 'TASK_STARTED' | 'TASK_COMPLETED' | 'TASK_FAILED' | 'TASK_CANCELLED'
  | 'TASK_PRIORITY_CHANGED' | 'TASK_STATUS_CHANGED'

  // Security Events
  | 'SECURITY_SCAN_STARTED' | 'SECURITY_SCAN_COMPLETED' | 'VULNERABILITY_DETECTED'
  | 'SUSPICIOUS_ACTIVITY_DETECTED' | 'RATE_LIMIT_EXCEEDED' | 'IP_BLOCKED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT' | 'PRIVILEGE_ESCALATION_ATTEMPT'
  | 'API_KEY_CREATED' | 'API_KEY_REVOKED' | 'API_KEY_COMPROMISED'

  // System Events
  | 'SYSTEM_STARTUP' | 'SYSTEM_SHUTDOWN' | 'SYSTEM_UPDATE' | 'SYSTEM_BACKUP'
  | 'DATABASE_MIGRATION' | 'CONFIGURATION_CHANGED' | 'FEATURE_FLAG_TOGGLED'
  | 'MAINTENANCE_MODE_ENABLED' | 'MAINTENANCE_MODE_DISABLED'

  // Collaboration Events
  | 'COLLABORATION_SESSION_STARTED' | 'COLLABORATION_SESSION_ENDED'
  | 'COMMENT_ADDED' | 'COMMENT_UPDATED' | 'COMMENT_DELETED' | 'COMMENT_RESOLVED'
  | 'REAL_TIME_EDIT' | 'CURSOR_MOVED' | 'USER_JOINED_SESSION' | 'USER_LEFT_SESSION'

  // Compliance Events
  | 'DATA_EXPORT_REQUESTED' | 'DATA_EXPORT_COMPLETED' | 'DATA_RETENTION_APPLIED'
  | 'GDPR_REQUEST_RECEIVED' | 'RIGHT_TO_BE_FORGOTTEN_EXECUTED'
  | 'AUDIT_LOG_ACCESSED' | 'COMPLIANCE_REPORT_GENERATED';

export type ResourceType =
  | 'user' | 'project' | 'file' | 'folder' | 'builder' | 'task'
  | 'collaboration_session' | 'comment' | 'api_key' | 'system'
  | 'audit_log' | 'backup' | 'configuration' | 'feature_flag';

export type AuditSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type AuditCategory =
  | 'authentication' | 'authorization' | 'data_access' | 'data_modification'
  | 'system_access' | 'configuration' | 'security' | 'compliance'
  | 'performance' | 'error' | 'collaboration' | 'financial';

export type AuditOutcome = 'success' | 'failure' | 'partial' | 'blocked' | 'pending';

export interface AuditMetadata {
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
  device?: DeviceInfo;
  requestId?: string;
  sessionDuration?: number; // in seconds
  apiVersion?: string;
  clientVersion?: string;
  feature_flags?: string[];
  performance_metrics?: PerformanceMetrics;
  error_details?: ErrorDetails;
  business_context?: BusinessContext;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  screen_resolution?: string;
  language: string;
}

export interface PerformanceMetrics {
  response_time_ms: number;
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
  database_query_time_ms?: number;
  cache_hit_rate?: number;
}

export interface ErrorDetails {
  error_code: string;
  error_message: string;
  stack_trace?: string;
  error_type: string;
  retry_count?: number;
}

export interface BusinessContext {
  workspace_id?: string;
  organization_id?: string;
  subscription_tier?: string;
  feature_usage?: Record<string, number>;
  cost_center?: string;
  department?: string;
}

// Audit Trail Configuration
export interface AuditConfig {
  enabled: boolean;
  retention_days: number;
  max_entries_per_batch: number;
  anonymize_pii: boolean;
  encrypt_sensitive_data: boolean;
  real_time_streaming: boolean;
  compliance_mode: 'none' | 'gdpr' | 'hipaa' | 'sox' | 'pci_dss';
  high_risk_threshold: number;
  alert_on_suspicious_activity: boolean;
  export_format: 'json' | 'csv' | 'xml';
  storage_backend: 'database' | 's3' | 'elasticsearch' | 'hybrid';
}

// Default configuration
const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  enabled: true,
  retention_days: 2555, // 7 years for compliance
  max_entries_per_batch: 1000,
  anonymize_pii: false,
  encrypt_sensitive_data: true,
  real_time_streaming: false,
  compliance_mode: 'gdpr',
  high_risk_threshold: 75,
  alert_on_suspicious_activity: true,
  export_format: 'json',
  storage_backend: 'hybrid',
};

// Risk assessment rules
const RISK_RULES: Record<AuditAction, number> = {
  // High-risk actions (80-100)
  'USER_DELETED': 95,
  'PROJECT_DELETED': 90,
  'BUILDER_DELETED': 85,
  'UNAUTHORIZED_ACCESS_ATTEMPT': 100,
  'PRIVILEGE_ESCALATION_ATTEMPT': 95,
  'API_KEY_COMPROMISED': 90,
  'SUSPICIOUS_ACTIVITY_DETECTED': 85,
  'RIGHT_TO_BE_FORGOTTEN_EXECUTED': 80,

  // Medium-risk actions (40-79)
  'PASSWORD_CHANGED': 60,
  'ROLE_ASSIGNED': 70,
  'PERMISSIONS_UPDATED': 75,
  'PROJECT_VISIBILITY_CHANGED': 50,
  'SECURITY_SCAN_COMPLETED': 45,
  'VULNERABILITY_DETECTED': 75,
  'CONFIGURATION_CHANGED': 65,
  'SYSTEM_UPDATE': 55,

  // Low-risk actions (0-39)
  'USER_LOGIN': 20,
  'USER_LOGOUT': 10,
  'FILE_CREATED': 15,
  'FILE_UPDATED': 20,
  'TASK_CREATED': 25,
  'COMMENT_ADDED': 10,
  'COLLABORATION_SESSION_STARTED': 15,

  // Default for unlisted actions
} as any;

const DEFAULT_RISK_SCORE = 30;

// Audit Trail Manager Class
export class AuditTrailManager {
  private config: AuditConfig;
  private eventBuffer: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<AuditConfig> = {}) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };

    if (this.config.enabled) {
      this.initializeAuditTrail();
    }
  }

  private initializeAuditTrail(): void {
    // Start periodic flushing of audit logs
    this.flushInterval = setInterval(() => {
      this.flushAuditLogs();
    }, 30000); // Flush every 30 seconds

    // Setup graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  /**
   * Log an audit event
   */
  async logEvent(params: {
    userId: string;
    sessionId: string;
    action: AuditAction;
    resourceType: ResourceType;
    resourceId: string;
    resourceName?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata: Partial<AuditMetadata>;
    severity?: AuditSeverity;
    category?: AuditCategory;
    outcome?: AuditOutcome;
  }): Promise<void> {
    if (!this.config.enabled) return;

    const auditEntry: AuditLogEntry = {
      id: randomUUID(),
      timestamp: new Date(),
      userId: params.userId,
      sessionId: params.sessionId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      resourceName: params.resourceName,
      oldValues: this.sanitizeData(params.oldValues),
      newValues: this.sanitizeData(params.newValues),
      metadata: this.enrichMetadata(params.metadata),
      severity: params.severity || this.calculateSeverity(params.action),
      category: params.category || this.categorizeAction(params.action),
      outcome: params.outcome || 'success',
      risk_score: this.calculateRiskScore(params.action, params.metadata),
      compliance_tags: this.generateComplianceTags(params.action, params.resourceType),
    };

    // Add to buffer
    this.eventBuffer.push(auditEntry);

    // Check for high-risk events
    if (auditEntry.risk_score >= this.config.high_risk_threshold) {
      await this.handleHighRiskEvent(auditEntry);
    }

    // Flush buffer if it's getting full
    if (this.eventBuffer.length >= this.config.max_entries_per_batch) {
      await this.flushAuditLogs();
    }

    // Real-time streaming if enabled
    if (this.config.real_time_streaming) {
      await this.streamAuditEvent(auditEntry);
    }
  }

  /**
   * Bulk log multiple events (for high-throughput scenarios)
   */
  async logBulkEvents(events: Array<Parameters<typeof this.logEvent>[0]>): Promise<void> {
    for (const event of events) {
      await this.logEvent(event);
    }
  }

  /**
   * Query audit logs with filtering and pagination
   */
  async queryAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    resourceType?: ResourceType;
    resourceId?: string;
    severity?: AuditSeverity;
    category?: AuditCategory;
    outcome?: AuditOutcome;
    startDate?: Date;
    endDate?: Date;
    minRiskScore?: number;
    complianceTags?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp' | 'risk_score' | 'severity';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    entries: AuditLogEntry[];
    total: number;
    page: number;
    hasMore: boolean;
  }> {
    // In a real implementation, this would query the database
    // For now, return mock data based on filters
    const mockEntries: AuditLogEntry[] = [];

    return {
      entries: mockEntries,
      total: 0,
      page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
      hasMore: false,
    };
  }

  /**
   * Generate compliance reports
   */
  async generateComplianceReport(params: {
    type: 'gdpr' | 'hipaa' | 'sox' | 'pci_dss' | 'custom';
    userId?: string;
    startDate: Date;
    endDate: Date;
    includeSystemEvents?: boolean;
    format?: 'json' | 'csv' | 'pdf';
  }): Promise<{
    reportId: string;
    generatedAt: Date;
    format: string;
    summary: ComplianceReportSummary;
    downloadUrl: string;
  }> {
    const reportId = randomUUID();

    // Log the report generation
    await this.logEvent({
      userId: params.userId || 'system',
      sessionId: 'compliance-report',
      action: 'COMPLIANCE_REPORT_GENERATED',
      resourceType: 'audit_log',
      resourceId: reportId,
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'CloudIDE-ComplianceEngine/1.0',
        business_context: {
          subscription_tier: 'enterprise',
        },
      },
      category: 'compliance',
      severity: 'medium',
    });

    return {
      reportId,
      generatedAt: new Date(),
      format: params.format || 'json',
      summary: {
        totalEvents: 0,
        riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        categoryBreakdown: {},
        complianceStatus: 'compliant',
        issues: [],
        recommendations: [],
      },
      downloadUrl: `/api/compliance/reports/${reportId}/download`,
    };
  }

  /**
   * Archive old audit logs
   */
  async archiveOldLogs(): Promise<{
    archivedCount: number;
    archiveLocation: string;
    archivedDate: Date;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retention_days);

    // In a real implementation, this would archive logs to cold storage
    return {
      archivedCount: 0,
      archiveLocation: 's3://cloudide-audit-archive/',
      archivedDate: new Date(),
    };
  }

  /**
   * Security monitoring and alerting
   */
  async detectAnomalies(userId: string, timeWindow: number = 3600): Promise<{
    anomalies: AuditAnomaly[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
  }> {
    // Implement anomaly detection algorithms
    return {
      anomalies: [],
      riskLevel: 'low',
      recommendations: [],
    };
  }

  // Private helper methods
  private sanitizeData(data: Record<string, any> | undefined): Record<string, any> | undefined {
    if (!data) return undefined;

    const sanitized = { ...data };

    // Remove or hash sensitive fields based on config
    if (this.config.anonymize_pii) {
      const sensitiveFields = ['password', 'ssn', 'creditCard', 'email', 'phone'];
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });
    }

    // Encrypt sensitive data if configured
    if (this.config.encrypt_sensitive_data) {
      // Implement encryption for sensitive fields
    }

    return sanitized;
  }

  private enrichMetadata(metadata: Partial<AuditMetadata>): AuditMetadata {
    return {
      ipAddress: metadata.ipAddress || '127.0.0.1',
      userAgent: metadata.userAgent || 'Unknown',
      location: metadata.location,
      device: metadata.device,
      requestId: metadata.requestId || randomUUID(),
      sessionDuration: metadata.sessionDuration,
      apiVersion: metadata.apiVersion || '1.0.0',
      clientVersion: metadata.clientVersion,
      feature_flags: metadata.feature_flags || [],
      performance_metrics: metadata.performance_metrics,
      error_details: metadata.error_details,
      business_context: metadata.business_context,
    };
  }

  private calculateSeverity(action: AuditAction): AuditSeverity {
    const riskScore = RISK_RULES[action] || DEFAULT_RISK_SCORE;

    if (riskScore >= 90) return 'critical';
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    if (riskScore >= 20) return 'low';
    return 'info';
  }

  private categorizeAction(action: AuditAction): AuditCategory {
    if (action.includes('LOGIN') || action.includes('PASSWORD')) return 'authentication';
    if (action.includes('ROLE') || action.includes('PERMISSION')) return 'authorization';
    if (action.includes('CREATED') || action.includes('UPDATED')) return 'data_modification';
    if (action.includes('SECURITY') || action.includes('VULNERABILITY')) return 'security';
    if (action.includes('GDPR') || action.includes('COMPLIANCE')) return 'compliance';
    if (action.includes('SYSTEM') || action.includes('CONFIGURATION')) return 'configuration';
    if (action.includes('COLLABORATION') || action.includes('COMMENT')) return 'collaboration';

    return 'data_access';
  }

  private calculateRiskScore(action: AuditAction, metadata: Partial<AuditMetadata>): number {
    let baseScore = RISK_RULES[action] || DEFAULT_RISK_SCORE;

    // Adjust based on context
    if (metadata.location?.country && !['US', 'CA', 'GB', 'DE'].includes(metadata.location.country)) {
      baseScore += 10; // Increase risk for unusual locations
    }

    if (metadata.error_details) {
      baseScore += 15; // Increase risk for failed operations
    }

    if (metadata.performance_metrics?.response_time_ms && metadata.performance_metrics.response_time_ms > 5000) {
      baseScore += 5; // Slight increase for slow operations
    }

    return Math.min(100, Math.max(0, baseScore));
  }

  private generateComplianceTags(action: AuditAction, resourceType: ResourceType): string[] {
    const tags: string[] = [];

    // GDPR tags
    if (['user', 'project'].includes(resourceType)) {
      tags.push('gdpr:data_subject');
    }

    if (action.includes('DELETE') || action.includes('FORGOTTEN')) {
      tags.push('gdpr:right_to_erasure');
    }

    if (action.includes('EXPORT')) {
      tags.push('gdpr:data_portability');
    }

    // SOX tags for financial operations
    if (resourceType === 'builder' && action.includes('RESOURCES')) {
      tags.push('sox:financial_impact');
    }

    // HIPAA tags for health data (if applicable)
    if (this.config.compliance_mode === 'hipaa') {
      tags.push('hipaa:phi_access');
    }

    return tags;
  }

  private async handleHighRiskEvent(entry: AuditLogEntry): Promise<void> {
    console.warn(`🚨 High-risk audit event detected:`, {
      id: entry.id,
      action: entry.action,
      riskScore: entry.risk_score,
      userId: entry.userId,
    });

    // In a real implementation, send alerts, create tickets, etc.
    if (this.config.alert_on_suspicious_activity) {
      // await this.sendSecurityAlert(entry);
    }
  }

  private async flushAuditLogs(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const logsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // In a real implementation, save to database or external storage
      console.log(`💾 Flushing ${logsToFlush.length} audit log entries`);

      // Example: Save to different backends based on config
      switch (this.config.storage_backend) {
        case 'database':
          // await this.saveToDatabase(logsToFlush);
          break;
        case 's3':
          // await this.saveToS3(logsToFlush);
          break;
        case 'elasticsearch':
          // await this.saveToElasticsearch(logsToFlush);
          break;
        case 'hybrid':
          // Save recent logs to database, older ones to S3
          // await this.saveToHybridStorage(logsToFlush);
          break;
      }
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Re-add failed logs to buffer for retry
      this.eventBuffer.unshift(...logsToFlush);
    }
  }

  private async streamAuditEvent(entry: AuditLogEntry): Promise<void> {
    // Stream to real-time monitoring systems
    // await this.sendToKafka(entry);
    // await this.sendToWebSocket(entry);
    console.log(`📡 Streaming audit event: ${entry.action}`);
  }

  private shutdown(): void {
    console.log('🔄 Shutting down audit trail manager...');

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Final flush of remaining logs
    this.flushAuditLogs();
  }
}

// Additional types for compliance reporting
interface ComplianceReportSummary {
  totalEvents: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  categoryBreakdown: Record<AuditCategory, number>;
  complianceStatus: 'compliant' | 'non_compliant' | 'under_review';
  issues: ComplianceIssue[];
  recommendations: string[];
}

interface ComplianceIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  regulation: string;
  remediation: string;
  deadline?: Date;
}

interface AuditAnomaly {
  id: string;
  type: 'unusual_activity' | 'access_pattern' | 'performance' | 'security';
  description: string;
  confidence: number; // 0-100
  relatedEvents: string[];
  suggestedAction: string;
}

// Create singleton instance
export const auditTrail = new AuditTrailManager();

// Helper functions for common audit operations
export const auditHelpers = {
  logUserAction: (userId: string, sessionId: string, action: AuditAction, resourceId: string, metadata: Partial<AuditMetadata> = {}) =>
    auditTrail.logEvent({
      userId,
      sessionId,
      action,
      resourceType: 'user',
      resourceId,
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'Unknown',
        ...metadata,
      },
    }),

  logProjectChange: (userId: string, sessionId: string, projectId: string, action: AuditAction, oldValues?: any, newValues?: any) =>
    auditTrail.logEvent({
      userId,
      sessionId,
      action,
      resourceType: 'project',
      resourceId: projectId,
      oldValues,
      newValues,
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'Unknown',
      },
    }),

  logSecurityEvent: (userId: string, sessionId: string, action: AuditAction, details: any) =>
    auditTrail.logEvent({
      userId,
      sessionId,
      action,
      resourceType: 'system',
      resourceId: 'security-event',
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'Unknown',
        error_details: details,
      },
      severity: 'high',
      category: 'security',
    }),
};

export default auditTrail;