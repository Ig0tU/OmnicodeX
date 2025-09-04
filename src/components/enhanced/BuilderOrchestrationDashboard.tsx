import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Cpu,
  Database,
  Gauge,
  Network,
  Play,
  Pause,
  RotateCcw,
  Settings,
  TrendingUp,
  Users,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { builderOrchestrator } from '@/services/builderOrchestrator';
import type { BuilderDefinition, TaskPriority, BuilderType } from '@/types';
import { AnimatedCard } from './AnimatedCard';
import { AccessibleButton } from './AccessibleButton';

interface OrchestrationMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  throughput: number;
  resourceUtilization: number;
  successRate: number;
}

interface BuilderLoadBalance {
  builderId: string;
  currentLoad: number;
  queuedTasks: number;
  processingCapacity: number;
  lastTaskCompletion: Date;
  averageTaskDuration: number;
  specializations: string[];
}

interface BuilderPool {
  available: BuilderDefinition[];
  busy: BuilderDefinition[];
  failed: BuilderDefinition[];
}

export const BuilderOrchestrationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<OrchestrationMetrics>({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageExecutionTime: 0,
    throughput: 0,
    resourceUtilization: 0,
    successRate: 0,
  });

  const [builderStatus, setBuilderStatus] = useState<{
    pool: BuilderPool;
    loadBalancers: BuilderLoadBalance[];
  }>({
    pool: { available: [], busy: [], failed: [] },
    loadBalancers: [],
  });

  const [taskQueue, setTaskQueue] = useState<{
    total: number;
    byPriority: Record<TaskPriority, number>;
  }>({
    total: 0,
    byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
  });

  const [selectedView, setSelectedView] = useState<'overview' | 'builders' | 'tasks' | 'performance'>('overview');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  useEffect(() => {
    const updateData = () => {
      setMetrics(builderOrchestrator.getMetrics());
      setBuilderStatus(builderOrchestrator.getBuilderStatus());
      setTaskQueue(builderOrchestrator.getTaskQueue());
    };

    // Initial load
    updateData();

    // Set up event listeners
    const handleMetricsUpdate = (data: { metrics: OrchestrationMetrics }) => {
      setMetrics(data.metrics);
    };

    builderOrchestrator.on('metrics-updated', handleMetricsUpdate);

    // Auto-refresh interval
    let interval: NodeJS.Timeout | null = null;
    if (isAutoRefresh) {
      interval = setInterval(updateData, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
      builderOrchestrator.off('metrics-updated', handleMetricsUpdate);
    };
  }, [isAutoRefresh]);

  const getBuilderTypeIcon = (type: BuilderType) => {
    switch (type) {
      case 'frontend': return <Zap className="w-4 h-4" />;
      case 'backend': return <Database className="w-4 h-4" />;
      case 'devops': return <Network className="w-4 h-4" />;
      case 'security': return <Settings className="w-4 h-4" />;
      default: return <Cpu className="w-4 h-4" />;
    }
  };

  const getBuilderStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'text-green-400';
      case 'coding':
      case 'testing':
      case 'building':
      case 'deploying': return 'text-blue-400';
      case 'error':
      case 'timeout': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <AnimatedCard className="p-6" glow={metrics.resourceUtilization > 80}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Builders</p>
            <p className="text-2xl font-bold">{builderStatus.pool.busy.length}</p>
            <p className="text-xs text-muted-foreground">
              of {builderStatus.pool.available.length + builderStatus.pool.busy.length} total
            </p>
          </div>
          <Users className="w-8 h-8 text-primary" />
        </div>
      </AnimatedCard>

      <AnimatedCard className="p-6" glow={taskQueue.total > 10}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Queued Tasks</p>
            <p className="text-2xl font-bold">{taskQueue.total}</p>
            <p className="text-xs text-muted-foreground">
              {taskQueue.byPriority.critical + taskQueue.byPriority.high} high priority
            </p>
          </div>
          <Clock className="w-8 h-8 text-accent" />
        </div>
      </AnimatedCard>

      <AnimatedCard className="p-6" glow={metrics.successRate < 95}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">
              {metrics.completedTasks} / {metrics.totalTasks} completed
            </p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
      </AnimatedCard>

      <AnimatedCard className="p-6" glow={metrics.throughput > 5}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Throughput</p>
            <p className="text-2xl font-bold">{metrics.throughput}</p>
            <p className="text-xs text-muted-foreground">tasks per minute</p>
          </div>
          <TrendingUp className="w-8 h-8 text-cyan" />
        </div>
      </AnimatedCard>
    </div>
  );

  const renderBuilders = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Available Builders */}
        <AnimatedCard className="p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            Available ({builderStatus.pool.available.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {builderStatus.pool.available.map((builder) => (
              <motion.div
                key={builder.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 bg-secondary/20 rounded"
              >
                <div className="flex items-center gap-2">
                  {getBuilderTypeIcon(builder.type)}
                  <span className="text-sm font-medium">{builder.name}</span>
                </div>
                <span className={`text-xs ${getBuilderStatusColor(builder.status)}`}>
                  {builder.status}
                </span>
              </motion.div>
            ))}
          </div>
        </AnimatedCard>

        {/* Busy Builders */}
        <AnimatedCard className="p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-400">
            <Activity className="w-5 h-5" />
            Busy ({builderStatus.pool.busy.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {builderStatus.pool.busy.map((builder) => {
              const loadBalance = builderStatus.loadBalancers.find(lb => lb.builderId === builder.id);
              return (
                <motion.div
                  key={builder.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-2 bg-secondary/20 rounded"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getBuilderTypeIcon(builder.type)}
                      <span className="text-sm font-medium">{builder.name}</span>
                    </div>
                    <span className={`text-xs ${getBuilderStatusColor(builder.status)}`}>
                      {builder.status}
                    </span>
                  </div>
                  {loadBalance && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Load: {loadBalance.currentLoad.toFixed(0)}%</span>
                        <span>Queue: {loadBalance.queuedTasks}</span>
                      </div>
                      <div className="w-full bg-background rounded-full h-1.5">
                        <motion.div
                          className="bg-gradient-to-r from-blue-400 to-cyan h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${loadBalance.currentLoad}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatedCard>

        {/* Failed Builders */}
        <AnimatedCard className="p-4" glow={builderStatus.pool.failed.length > 0}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-400">
            <XCircle className="w-5 h-5" />
            Failed ({builderStatus.pool.failed.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {builderStatus.pool.failed.map((builder) => (
              <motion.div
                key={builder.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 bg-secondary/20 rounded border-l-2 border-red-400"
              >
                <div className="flex items-center gap-2">
                  {getBuilderTypeIcon(builder.type)}
                  <span className="text-sm font-medium">{builder.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${getBuilderStatusColor(builder.status)}`}>
                    {builder.status}
                  </span>
                  <AccessibleButton
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      // Reset builder functionality would go here
                      console.log('Resetting builder:', builder.id);
                    }}
                    ariaLabel={`Reset ${builder.name}`}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </AccessibleButton>
                </div>
              </motion.div>
            ))}
            {builderStatus.pool.failed.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-4">
                No failed builders
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnimatedCard className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Task Queue by Priority
        </h3>
        <div className="space-y-3">
          {Object.entries(taskQueue.byPriority).map(([priority, count]) => (
            <div key={priority} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  priority === 'critical' ? 'bg-red-400' :
                  priority === 'high' ? 'bg-orange-400' :
                  priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                }`} />
                <span className="text-sm font-medium capitalize">{priority}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${getPriorityColor(priority as TaskPriority)}`}>
                  {count}
                </span>
                <div className="w-16 bg-background rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${
                      priority === 'critical' ? 'bg-red-400' :
                      priority === 'high' ? 'bg-orange-400' :
                      priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${taskQueue.total > 0 ? (count / taskQueue.total) * 100 : 0}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </AnimatedCard>

      <AnimatedCard className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Performance Metrics
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Resource Utilization</span>
              <span className="text-sm font-bold">{metrics.resourceUtilization.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${
                  metrics.resourceUtilization > 90 ? 'bg-red-400' :
                  metrics.resourceUtilization > 70 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.resourceUtilization}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Success Rate</span>
              <span className="text-sm font-bold">{metrics.successRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${
                  metrics.successRate > 95 ? 'bg-green-400' :
                  metrics.successRate > 80 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.successRate}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{metrics.completedTasks}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">{metrics.failedTasks}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );

  const renderPerformance = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnimatedCard className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Builder Performance
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {builderStatus.loadBalancers.map((loadBalance) => {
            const builder = [
              ...builderStatus.pool.available,
              ...builderStatus.pool.busy,
              ...builderStatus.pool.failed,
            ].find(b => b.id === loadBalance.builderId);

            if (!builder) return null;

            return (
              <motion.div
                key={loadBalance.builderId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-secondary/20 rounded"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getBuilderTypeIcon(builder.type)}
                    <span className="text-sm font-medium">{builder.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(loadBalance.averageTaskDuration)}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="font-bold">{loadBalance.currentLoad.toFixed(0)}%</p>
                    <p className="text-muted-foreground">Load</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{loadBalance.processingCapacity}</p>
                    <p className="text-muted-foreground">Capacity</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{loadBalance.queuedTasks}</p>
                    <p className="text-muted-foreground">Queue</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatedCard>

      <AnimatedCard className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          System Statistics
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-secondary/20 rounded">
              <p className="text-lg font-bold">{formatDuration(metrics.averageExecutionTime)}</p>
              <p className="text-xs text-muted-foreground">Avg Execution</p>
            </div>
            <div className="text-center p-3 bg-secondary/20 rounded">
              <p className="text-lg font-bold">{metrics.throughput}</p>
              <p className="text-xs text-muted-foreground">Tasks/min</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Tasks</span>
              <span className="text-sm font-bold">{metrics.totalTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Active Builders</span>
              <span className="text-sm font-bold">
                {builderStatus.pool.busy.length} / {builderStatus.pool.available.length + builderStatus.pool.busy.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Queue Length</span>
              <span className="text-sm font-bold">{taskQueue.total}</span>
            </div>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Network className="w-6 h-6 text-primary" />
          Builder Orchestration Dashboard
        </h1>
        
        <div className="flex items-center gap-2">
          <AccessibleButton
            variant={isAutoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            icon={isAutoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            ariaLabel={isAutoRefresh ? 'Pause auto-refresh' : 'Start auto-refresh'}
          >
            {isAutoRefresh ? 'Auto' : 'Manual'}
          </AccessibleButton>
          
          <AccessibleButton
            variant="outline"
            size="sm"
            onClick={() => {
              setMetrics(builderOrchestrator.getMetrics());
              setBuilderStatus(builderOrchestrator.getBuilderStatus());
              setTaskQueue(builderOrchestrator.getTaskQueue());
            }}
            icon={<RotateCcw className="w-4 h-4" />}
            ariaLabel="Refresh data"
          >
            Refresh
          </AccessibleButton>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: 'overview', label: 'Overview', icon: Gauge },
          { id: 'builders', label: 'Builders', icon: Users },
          { id: 'tasks', label: 'Tasks', icon: BarChart3 },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
        ].map(({ id, label, icon: Icon }) => (
          <AccessibleButton
            key={id}
            variant={selectedView === id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView(id as any)}
            icon={<Icon className="w-4 h-4" />}
            className="mb-2"
          >
            {label}
          </AccessibleButton>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {selectedView === 'overview' && renderOverview()}
          {selectedView === 'builders' && renderBuilders()}
          {selectedView === 'tasks' && renderTasks()}
          {selectedView === 'performance' && renderPerformance()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};