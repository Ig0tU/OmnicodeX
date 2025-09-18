/**
 * React Hooks for Audit Trail Integration
 *
 * Provides easy-to-use hooks for components to log audit events
 * and query audit data with automatic context detection.
 */

import { useCallback, useContext, useEffect, useState } from 'react';
import { auditTrail, auditHelpers, AuditAction, AuditLogEntry, ResourceType } from '../utils/auditTrail';

// Context for current user and session
interface AuditContext {
  userId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

// Hook for logging audit events with automatic context
export function useAuditLogger() {
  // In a real app, get these from auth context or props
  const auditContext: AuditContext = {
    userId: 'current-user-id',
    sessionId: 'current-session-id',
    ipAddress: '127.0.0.1',
    userAgent: navigator.userAgent,
  };

  const logEvent = useCallback(async (
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string,
    options: {
      resourceName?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
      category?: string;
      outcome?: 'success' | 'failure' | 'partial' | 'blocked' | 'pending';
      performanceMetrics?: {
        response_time_ms: number;
        memory_usage_mb?: number;
      };
      errorDetails?: {
        error_code: string;
        error_message: string;
        error_type: string;
      };
    } = {}
  ) => {
    try {
      await auditTrail.logEvent({
        userId: auditContext.userId,
        sessionId: auditContext.sessionId,
        action,
        resourceType,
        resourceId,
        resourceName: options.resourceName,
        oldValues: options.oldValues,
        newValues: options.newValues,
        metadata: {
          ipAddress: auditContext.ipAddress || '127.0.0.1',
          userAgent: auditContext.userAgent || 'Unknown',
          performance_metrics: options.performanceMetrics,
          error_details: options.errorDetails,
        },
        severity: options.severity,
        outcome: options.outcome,
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }, [auditContext]);

  // Specific helpers for common operations
  const logUserAction = useCallback((action: AuditAction, resourceId: string) => {
    return auditHelpers.logUserAction(
      auditContext.userId,
      auditContext.sessionId,
      action,
      resourceId,
      {
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      }
    );
  }, [auditContext]);

  const logProjectChange = useCallback((
    projectId: string,
    action: AuditAction,
    oldValues?: any,
    newValues?: any
  ) => {
    return auditHelpers.logProjectChange(
      auditContext.userId,
      auditContext.sessionId,
      projectId,
      action,
      oldValues,
      newValues
    );
  }, [auditContext]);

  const logSecurityEvent = useCallback((action: AuditAction, details: any) => {
    return auditHelpers.logSecurityEvent(
      auditContext.userId,
      auditContext.sessionId,
      action,
      details
    );
  }, [auditContext]);

  return {
    logEvent,
    logUserAction,
    logProjectChange,
    logSecurityEvent,
  };
}

// Hook for querying audit logs with pagination and filtering
export function useAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  autoRefresh?: boolean;
} = {}) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const result = await auditTrail.queryAuditLogs({
        ...filters,
        limit: filters.limit || 50,
        offset: (page - 1) * (filters.limit || 50),
      });

      setLogs(result.entries);
      setTotal(result.total);
      setCurrentPage(page);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchLogs(currentPage + 1);
    }
  }, [hasMore, loading, currentPage, fetchLogs]);

  const refresh = useCallback(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (filters.autoRefresh) {
      const interval = setInterval(refresh, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [filters.autoRefresh, refresh]);

  // Initial load
  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    total,
    currentPage,
    hasMore,
    loadMore,
    refresh,
  };
}

// Hook for real-time audit events (using WebSocket or SSE)
export function useRealtimeAuditEvents(options: {
  userId?: string;
  resourceType?: ResourceType;
  severityFilter?: ('info' | 'low' | 'medium' | 'high' | 'critical')[];
} = {}) {
  const [events, setEvents] = useState<AuditLogEntry[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // In a real implementation, this would connect to WebSocket or SSE
    setConnected(true);

    // Mock real-time events for demonstration
    const interval = setInterval(() => {
      const mockEvent: AuditLogEntry = {
        id: Math.random().toString(36),
        timestamp: new Date(),
        userId: options.userId || 'user-123',
        sessionId: 'session-123',
        action: 'FILE_UPDATED',
        resourceType: 'file',
        resourceId: 'file-123',
        resourceName: 'App.tsx',
        metadata: {
          ipAddress: '127.0.0.1',
          userAgent: 'Chrome/120.0.0.0',
        },
        severity: 'info',
        category: 'data_modification',
        outcome: 'success',
        risk_score: 15,
        compliance_tags: ['gdpr:data_subject'],
      };

      setEvents(prev => [mockEvent, ...prev.slice(0, 99)]); // Keep last 100 events
    }, 5000);

    return () => {
      clearInterval(interval);
      setConnected(false);
    };
  }, [options]);

  return {
    events,
    connected,
  };
}

// Hook for audit statistics and metrics
export function useAuditMetrics(timeRange: {
  startDate: Date;
  endDate: Date;
}) {
  const [metrics, setMetrics] = useState<{
    totalEvents: number;
    riskDistribution: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
    hourlyActivity: Array<{ hour: number; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call an analytics API
      // For now, return mock data
      setMetrics({
        totalEvents: 1234,
        riskDistribution: {
          low: 800,
          medium: 300,
          high: 100,
          critical: 34,
        },
        categoryBreakdown: {
          data_modification: 500,
          authentication: 300,
          data_access: 200,
          security: 150,
          collaboration: 84,
        },
        topActions: [
          { action: 'FILE_UPDATED', count: 245 },
          { action: 'USER_LOGIN', count: 189 },
          { action: 'PROJECT_CREATED', count: 156 },
          { action: 'TASK_CREATED', count: 134 },
          { action: 'COMMENT_ADDED', count: 98 },
        ],
        topUsers: [
          { userId: 'user-1', count: 234 },
          { userId: 'user-2', count: 189 },
          { userId: 'user-3', count: 156 },
          { userId: 'user-4', count: 134 },
          { userId: 'user-5', count: 98 },
        ],
        hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: Math.floor(Math.random() * 100),
        })),
      });
    } catch (error) {
      console.error('Failed to fetch audit metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    refresh: fetchMetrics,
  };
}

// Hook for generating compliance reports
export function useComplianceReports() {
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<Array<{
    id: string;
    type: string;
    generatedAt: Date;
    status: 'generating' | 'completed' | 'failed';
    downloadUrl?: string;
  }>>([]);

  const generateReport = useCallback(async (params: {
    type: 'gdpr' | 'hipaa' | 'sox' | 'pci_dss';
    startDate: Date;
    endDate: Date;
    userId?: string;
    format?: 'json' | 'csv' | 'pdf';
  }) => {
    setGenerating(true);
    try {
      const result = await auditTrail.generateComplianceReport(params);

      setReports(prev => [...prev, {
        id: result.reportId,
        type: params.type,
        generatedAt: result.generatedAt,
        status: 'completed',
        downloadUrl: result.downloadUrl,
      }]);

      return result;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  }, []);

  return {
    generateReport,
    generating,
    reports,
  };
}

// HOC for automatic audit logging of component interactions
export function withAuditLogging<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  auditConfig: {
    action: AuditAction;
    resourceType: ResourceType;
    getResourceId: (props: T) => string;
    getResourceName?: (props: T) => string;
    logOnMount?: boolean;
    logOnUnmount?: boolean;
    logOnPropsChange?: boolean;
  }
) {
  return function AuditLoggedComponent(props: T) {
    const { logEvent } = useAuditLogger();

    const resourceId = auditConfig.getResourceId(props);
    const resourceName = auditConfig.getResourceName?.(props);

    useEffect(() => {
      if (auditConfig.logOnMount) {
        logEvent(
          auditConfig.action,
          auditConfig.resourceType,
          resourceId,
          { resourceName }
        );
      }

      return () => {
        if (auditConfig.logOnUnmount) {
          logEvent(
            auditConfig.action,
            auditConfig.resourceType,
            resourceId,
            { resourceName }
          );
        }
      };
    }, []);

    useEffect(() => {
      if (auditConfig.logOnPropsChange) {
        logEvent(
          auditConfig.action,
          auditConfig.resourceType,
          resourceId,
          { resourceName }
        );
      }
    }, [props]);

    return <Component {...props} />;
  };
}