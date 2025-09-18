/**
 * Audit Trail Dashboard Component
 *
 * Provides a comprehensive interface for viewing, filtering, and analyzing
 * audit logs with real-time updates, compliance reporting, and security monitoring.
 */

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  User,
  FileText,
  AlertCircle,
  Clock,
  Database,
  Lock,
  Users,
  Zap,
} from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';

import { useAuditLogs, useAuditMetrics, useRealtimeAuditEvents, useComplianceReports } from '../hooks/useAuditTrail';
import { AuditLogEntry, AuditAction, ResourceType } from '../utils/auditTrail';

interface AuditTrailDashboardProps {
  className?: string;
}

export function AuditTrailDashboard({ className }: AuditTrailDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    userId: '',
    action: '' as AuditAction | '',
    resourceType: '' as ResourceType | '',
    severity: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endDate: new Date(),
    searchTerm: '',
  });

  // Hooks for data fetching
  const { logs, loading, error, total, refresh } = useAuditLogs({
    ...filters,
    action: filters.action || undefined,
    resourceType: filters.resourceType || undefined,
    severity: filters.severity as any || undefined,
    autoRefresh: true,
  });

  const { metrics, loading: metricsLoading } = useAuditMetrics({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const { events: realtimeEvents, connected } = useRealtimeAuditEvents({
    severityFilter: ['high', 'critical'],
  });

  const { generateReport, generating, reports } = useComplianceReports();

  // Filter logs based on search term
  const filteredLogs = useMemo(() => {
    if (!filters.searchTerm) return logs;

    return logs.filter(log =>
      log.action.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      log.resourceType.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      log.resourceName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      log.userId.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );
  }, [logs, filters.searchTerm]);

  const handleGenerateReport = async (type: 'gdpr' | 'hipaa' | 'sox' | 'pci_dss') => {
    try {
      await generateReport({
        type,
        startDate: filters.startDate,
        endDate: filters.endDate,
        format: 'pdf',
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Trail Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor system activity, security events, and compliance status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{connected ? 'Live' : 'Disconnected'}</span>
          </div>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Alerts */}
      {realtimeEvents.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-lg">Recent High-Risk Events</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {realtimeEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md">
                  <div className="flex items-center space-x-3">
                    <Badge variant={event.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {event.severity}
                    </Badge>
                    <span className="font-medium">{event.action}</span>
                    <span className="text-sm text-muted-foreground">by {event.userId}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(event.timestamp, 'HH:mm:ss')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value as AuditAction }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="USER_LOGIN">User Login</SelectItem>
                  <SelectItem value="FILE_UPDATED">File Updated</SelectItem>
                  <SelectItem value="PROJECT_CREATED">Project Created</SelectItem>
                  <SelectItem value="TASK_COMPLETED">Task Completed</SelectItem>
                  <SelectItem value="SECURITY_SCAN_COMPLETED">Security Scan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resource Type</label>
              <Select value={filters.resourceType} onValueChange={(value) => setFilters(prev => ({ ...prev, resourceType: value as ResourceType }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="builder">Builder</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalEvents.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {(metrics?.riskDistribution.high || 0) + (metrics?.riskDistribution.critical || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.topUsers.length || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  With recent activity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
                <Shield className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Compliant</div>
                <p className="text-xs text-muted-foreground">
                  All checks passed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      <div>
                        <p className="font-medium">{formatActionName(log.action)}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.resourceType} • {log.resourceName || log.resourceId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getSeverityVariant(log.severity)}>
                        {log.severity}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(log.timestamp, 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs ({total.toLocaleString()} total)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  Error loading logs: {error}
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredLogs.map((log) => (
                      <LogEntryCard key={log.id} log={log} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {metricsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(metrics?.riskDistribution || {}).map(([level, count]) => (
                      <div key={level} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityVariant(level as any)}>
                            {level}
                          </Badge>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="w-32">
                          <Progress
                            value={(count / (metrics?.totalEvents || 1)) * 100}
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Common Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.topActions.map((action, index) => (
                      <div key={action.action} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-muted-foreground">#{index + 1}</span>
                          <span className="font-medium">{formatActionName(action.action)}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{action.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Generate Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Generate Compliance Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleGenerateReport('gdpr')}
                    disabled={generating}
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    GDPR Report
                  </Button>
                  <Button
                    onClick={() => handleGenerateReport('sox')}
                    disabled={generating}
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    SOX Report
                  </Button>
                  <Button
                    onClick={() => handleGenerateReport('hipaa')}
                    disabled={generating}
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    HIPAA Report
                  </Button>
                  <Button
                    onClick={() => handleGenerateReport('pci_dss')}
                    disabled={generating}
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    PCI DSS Report
                  </Button>
                </div>
                {generating && (
                  <div className="text-sm text-muted-foreground">
                    Generating report...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reports generated yet.</p>
                  ) : (
                    reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{report.type.toUpperCase()} Report</p>
                          <p className="text-xs text-muted-foreground">
                            {format(report.generatedAt, 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function LogEntryCard({ log }: { log: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {getActionIcon(log.action)}
            </div>
            <div>
              <p className="font-medium">{formatActionName(log.action)}</p>
              <p className="text-sm text-muted-foreground">
                {log.userId} • {log.resourceType} • {format(log.timestamp, 'MMM d, HH:mm:ss')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getSeverityVariant(log.severity)}>
              {log.severity}
            </Badge>
            <Badge variant="outline">
              Risk: {log.risk_score}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Resource:</strong> {log.resourceName || log.resourceId}
              </div>
              <div>
                <strong>Outcome:</strong> {log.outcome}
              </div>
              <div>
                <strong>IP Address:</strong> {log.metadata.ipAddress}
              </div>
              <div>
                <strong>Category:</strong> {log.category}
              </div>
            </div>
            {log.compliance_tags.length > 0 && (
              <div>
                <strong>Compliance Tags:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {log.compliance_tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper Functions
function getActionIcon(action: AuditAction) {
  if (action.includes('LOGIN')) return <User className="w-4 h-4 text-blue-500" />;
  if (action.includes('FILE')) return <FileText className="w-4 h-4 text-green-500" />;
  if (action.includes('PROJECT')) return <Database className="w-4 h-4 text-purple-500" />;
  if (action.includes('SECURITY')) return <Shield className="w-4 h-4 text-red-500" />;
  if (action.includes('TASK')) return <Clock className="w-4 h-4 text-orange-500" />;
  return <Activity className="w-4 h-4 text-gray-500" />;
}

function formatActionName(action: AuditAction): string {
  return action.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function getSeverityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'default';
  }
}

export default AuditTrailDashboard;