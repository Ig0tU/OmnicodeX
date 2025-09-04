import type {
  BuilderDefinition,
  BuildTask,
  TaskId,
  BuilderId,
  TaskType,
  TaskPriority,
  BuilderType,
  TaskStatus,
  WebSocketMessage,
} from '../types';
import { errorHandler, withRetry } from '../utils/errorHandler';
import { performanceMonitor } from '../utils/performance';

interface BuilderCapability {
  type: TaskType;
  languages: string[];
  frameworks: string[];
  estimatedDuration: number;
  resourceRequirement: number;
}

interface BuilderPool {
  available: BuilderDefinition[];
  busy: BuilderDefinition[];
  failed: BuilderDefinition[];
}

interface TaskQueue {
  high: BuildTask[];
  medium: BuildTask[];
  low: BuildTask[];
  critical: BuildTask[];
}

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
  builderId: BuilderId;
  currentLoad: number;
  queuedTasks: number;
  processingCapacity: number;
  lastTaskCompletion: Date;
  averageTaskDuration: number;
  specializations: TaskType[];
}

export class BuilderOrchestrator {
  private static instance: BuilderOrchestrator;
  private builders: Map<BuilderId, BuilderDefinition> = new Map();
  private tasks: Map<TaskId, BuildTask> = new Map();
  private taskQueue: TaskQueue = { high: [], medium: [], low: [], critical: [] };
  private builderPool: BuilderPool = { available: [], busy: [], failed: [] };
  private metrics: OrchestrationMetrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageExecutionTime: 0,
    throughput: 0,
    resourceUtilization: 0,
    successRate: 0,
  };
  private loadBalancers: Map<BuilderId, BuilderLoadBalance> = new Map();
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private orchestrationInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startOrchestration();
    this.startMetricsCollection();
  }

  static getInstance(): BuilderOrchestrator {
    if (!BuilderOrchestrator.instance) {
      BuilderOrchestrator.instance = new BuilderOrchestrator();
    }
    return BuilderOrchestrator.instance;
  }

  // Builder Management
  registerBuilder(builder: BuilderDefinition): void {
    this.builders.set(builder.id, builder);
    this.builderPool.available.push(builder);
    
    // Initialize load balancer for this builder
    this.loadBalancers.set(builder.id, {
      builderId: builder.id,
      currentLoad: 0,
      queuedTasks: 0,
      processingCapacity: this.calculateProcessingCapacity(builder),
      lastTaskCompletion: new Date(),
      averageTaskDuration: 300000, // 5 minutes default
      specializations: this.extractSpecializations(builder),
    });

    this.emit('builder-registered', { builder });
  }

  unregisterBuilder(builderId: BuilderId): void {
    const builder = this.builders.get(builderId);
    if (!builder) return;

    // Cancel any running tasks for this builder
    const builderTasks = Array.from(this.tasks.values())
      .filter(task => task.builderId === builderId && task.status === 'in-progress');
    
    builderTasks.forEach(task => {
      this.failTask(task.id, 'Builder unregistered');
    });

    // Remove from all pools
    this.builderPool.available = this.builderPool.available.filter(b => b.id !== builderId);
    this.builderPool.busy = this.builderPool.busy.filter(b => b.id !== builderId);
    this.builderPool.failed = this.builderPool.failed.filter(b => b.id !== builderId);

    this.builders.delete(builderId);
    this.loadBalancers.delete(builderId);
    this.emit('builder-unregistered', { builderId });
  }

  updateBuilderStatus(builderId: BuilderId, status: BuilderDefinition['status']): void {
    const builder = this.builders.get(builderId);
    if (!builder) return;

    builder.status = status;
    
    // Update builder pools based on status
    this.updateBuilderPools(builder);
    
    this.emit('builder-status-updated', { builderId, status });
  }

  // Task Management
  submitTask(task: BuildTask): TaskId {
    // Validate task
    if (!this.validateTask(task)) {
      throw new Error('Invalid task specification');
    }

    // Add to task registry and queue
    this.tasks.set(task.id, task);
    this.addToQueue(task);
    
    this.metrics.totalTasks++;
    this.emit('task-submitted', { task });

    // Try immediate assignment if possible
    this.tryAssignTask(task);

    return task.id;
  }

  cancelTask(taskId: TaskId): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Remove from queue if queued
    this.removeFromQueue(taskId);

    // Cancel if in progress
    if (task.status === 'in-progress') {
      task.status = 'cancelled';
      this.emit('task-cancelled', { taskId });
      
      // Free up the builder
      const builder = this.builders.get(task.builderId);
      if (builder) {
        this.releaseBuilder(builder);
      }
    }

    this.tasks.delete(taskId);
  }

  failTask(taskId: TaskId, reason: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    this.metrics.failedTasks++;

    // Release builder if assigned
    if (task.builderId) {
      const builder = this.builders.get(task.builderId);
      if (builder) {
        this.releaseBuilder(builder);
      }
    }

    // Handle retry logic
    if (task.requirements.constraints.maxExecutionTime > 0 && this.shouldRetryTask(task)) {
      this.retryTask(task);
    } else {
      this.emit('task-failed', { taskId, reason });
    }
  }

  completeTask(taskId: TaskId): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.progress.percentage = 100;
    task.timeline.completedAt = new Date();
    
    if (task.timeline.startedAt) {
      task.timeline.actualDuration = 
        task.timeline.completedAt.getTime() - task.timeline.startedAt.getTime();
    }

    this.metrics.completedTasks++;
    
    // Update builder metrics
    if (task.builderId) {
      this.updateBuilderMetrics(task.builderId, task);
      const builder = this.builders.get(task.builderId);
      if (builder) {
        this.releaseBuilder(builder);
      }
    }

    this.emit('task-completed', { task });
    
    // Check for dependent tasks
    this.checkDependentTasks(taskId);
  }

  // Smart Task Assignment
  private async assignTaskToBuilder(): Promise<void> {
    const task = this.getNextTask();
    if (!task) return;

    const optimalBuilder = await this.findOptimalBuilder(task);
    if (!optimalBuilder) {
      // No suitable builder available, task remains in queue
      return;
    }

    await this.executeTask(task, optimalBuilder);
  }

  private getNextTask(): BuildTask | null {
    // Priority order: critical > high > medium > low
    if (this.taskQueue.critical.length > 0) return this.taskQueue.critical.shift()!;
    if (this.taskQueue.high.length > 0) return this.taskQueue.high.shift()!;
    if (this.taskQueue.medium.length > 0) return this.taskQueue.medium.shift()!;
    if (this.taskQueue.low.length > 0) return this.taskQueue.low.shift()!;
    
    return null;
  }

  private async findOptimalBuilder(task: BuildTask): Promise<BuilderDefinition | null> {
    const availableBuilders = this.builderPool.available.filter(builder => 
      this.canBuilderHandleTask(builder, task)
    );

    if (availableBuilders.length === 0) {
      return null;
    }

    // Score builders based on various factors
    const scoredBuilders = availableBuilders.map(builder => ({
      builder,
      score: this.calculateBuilderScore(builder, task),
    }));

    // Sort by score (higher is better)
    scoredBuilders.sort((a, b) => b.score - a.score);

    return scoredBuilders[0].builder;
  }

  private calculateBuilderScore(builder: BuilderDefinition, task: BuildTask): number {
    let score = 0;
    const loadBalance = this.loadBalancers.get(builder.id);
    
    if (!loadBalance) return 0;

    // Factor 1: Builder specialization (40% weight)
    const specializationMatch = loadBalance.specializations.includes(task.type) ? 100 : 50;
    score += specializationMatch * 0.4;

    // Factor 2: Current load (30% weight)
    const loadScore = Math.max(0, 100 - loadBalance.currentLoad);
    score += loadScore * 0.3;

    // Factor 3: Historical performance (20% weight)
    const performanceScore = this.getBuilderPerformanceScore(builder.id);
    score += performanceScore * 0.2;

    // Factor 4: Resource availability (10% weight)
    const resourceScore = this.calculateResourceScore(builder, task);
    score += resourceScore * 0.1;

    return score;
  }

  private async executeTask(task: BuildTask, builder: BuilderDefinition): Promise<void> {
    try {
      // Update task and builder status
      task.status = 'in-progress';
      task.builderId = builder.id;
      task.timeline.startedAt = new Date();
      
      // Move builder to busy pool
      this.moveBuilderToBusy(builder);
      
      // Update load balancer
      const loadBalance = this.loadBalancers.get(builder.id);
      if (loadBalance) {
        loadBalance.currentLoad += this.calculateTaskLoad(task);
        loadBalance.queuedTasks--;
      }

      this.emit('task-started', { task, builder });

      // Simulate task execution (in real implementation, this would communicate with actual builders)
      await this.simulateTaskExecution(task, builder);

    } catch (error) {
      this.failTask(task.id, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async simulateTaskExecution(task: BuildTask, builder: BuilderDefinition): Promise<void> {
    const duration = this.estimateTaskDuration(task, builder);
    const updateInterval = Math.max(1000, duration / 10); // Update progress 10 times during execution

    let elapsed = 0;
    
    const progressInterval = setInterval(() => {
      elapsed += updateInterval;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      task.progress.percentage = progress;
      task.progress.estimatedTimeRemaining = Math.max(0, duration - elapsed);
      
      // Update current step based on progress
      if (progress < 20) {
        task.progress.currentStep = 'Analyzing requirements';
      } else if (progress < 40) {
        task.progress.currentStep = 'Setting up environment';
      } else if (progress < 60) {
        task.progress.currentStep = 'Implementing solution';
      } else if (progress < 80) {
        task.progress.currentStep = 'Running tests';
      } else {
        task.progress.currentStep = 'Finalizing and cleanup';
      }
      
      this.emit('task-progress', { task });
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        this.completeTask(task.id);
      }
    }, updateInterval);

    // Handle potential task failure
    if (Math.random() < 0.05) { // 5% chance of failure
      setTimeout(() => {
        clearInterval(progressInterval);
        this.failTask(task.id, 'Simulated task failure');
      }, Math.random() * duration);
    }
  }

  // Builder Pool Management
  private updateBuilderPools(builder: BuilderDefinition): void {
    // Remove from all pools first
    this.builderPool.available = this.builderPool.available.filter(b => b.id !== builder.id);
    this.builderPool.busy = this.builderPool.busy.filter(b => b.id !== builder.id);
    this.builderPool.failed = this.builderPool.failed.filter(b => b.id !== builder.id);

    // Add to appropriate pool based on status
    switch (builder.status) {
      case 'idle':
        this.builderPool.available.push(builder);
        break;
      case 'coding':
      case 'testing':
      case 'building':
      case 'deploying':
        this.builderPool.busy.push(builder);
        break;
      case 'error':
      case 'timeout':
        this.builderPool.failed.push(builder);
        break;
    }
  }

  private moveBuilderToBusy(builder: BuilderDefinition): void {
    builder.status = 'coding';
    this.updateBuilderPools(builder);
  }

  private releaseBuilder(builder: BuilderDefinition): void {
    builder.status = 'idle';
    this.updateBuilderPools(builder);
    
    const loadBalance = this.loadBalancers.get(builder.id);
    if (loadBalance) {
      loadBalance.currentLoad = Math.max(0, loadBalance.currentLoad - 20);
      loadBalance.lastTaskCompletion = new Date();
    }
  }

  // Queue Management
  private addToQueue(task: BuildTask): void {
    const queue = this.getQueueByPriority(task.priority);
    queue.push(task);
    this.sortQueueByComplexity(queue);
  }

  private removeFromQueue(taskId: TaskId): void {
    Object.values(this.taskQueue).forEach(queue => {
      const index = queue.findIndex(task => task.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    });
  }

  private getQueueByPriority(priority: TaskPriority): BuildTask[] {
    switch (priority) {
      case 'critical': return this.taskQueue.critical;
      case 'high': return this.taskQueue.high;
      case 'medium': return this.taskQueue.medium;
      case 'low': return this.taskQueue.low;
      default: return this.taskQueue.medium;
    }
  }

  private sortQueueByComplexity(queue: BuildTask[]): void {
    queue.sort((a, b) => {
      // Sort by estimated duration (shorter tasks first for better throughput)
      const aDuration = a.requirements.constraints.maxExecutionTime;
      const bDuration = b.requirements.constraints.maxExecutionTime;
      return aDuration - bDuration;
    });
  }

  // Dependency Management
  private checkDependentTasks(completedTaskId: TaskId): void {
    const dependentTasks = Array.from(this.tasks.values())
      .filter(task => task.dependencies.includes(completedTaskId));

    dependentTasks.forEach(task => {
      if (this.areAllDependenciesCompleted(task)) {
        this.tryAssignTask(task);
      }
    });
  }

  private areAllDependenciesCompleted(task: BuildTask): boolean {
    return task.dependencies.every(depId => {
      const depTask = this.tasks.get(depId);
      return depTask?.status === 'completed';
    });
  }

  // Utility Methods
  private validateTask(task: BuildTask): boolean {
    return !!(
      task.id &&
      task.type &&
      task.requirements &&
      task.requirements.description &&
      task.requirements.constraints
    );
  }

  private canBuilderHandleTask(builder: BuilderDefinition, task: BuildTask): boolean {
    // Check builder type compatibility
    const typeCompatible = this.isBuilderTypeCompatible(builder.type, task.type);
    if (!typeCompatible) return false;

    // Check resource requirements
    const resourcesAvailable = this.hasRequiredResources(builder, task);
    if (!resourcesAvailable) return false;

    // Check capabilities
    const hasCapabilities = this.hasRequiredCapabilities(builder, task);
    if (!hasCapabilities) return false;

    return true;
  }

  private isBuilderTypeCompatible(builderType: BuilderType, taskType: TaskType): boolean {
    const compatibility: Record<BuilderType, TaskType[]> = {
      'frontend': ['create', 'update', 'test', 'optimize'],
      'backend': ['create', 'update', 'test', 'deploy', 'optimize'],
      'database': ['create', 'update', 'optimize'],
      'devops': ['deploy', 'optimize', 'security-audit'],
      'security': ['security-audit', 'optimize'],
      'testing': ['test'],
      'ai-ml': ['analyze', 'optimize'],
    };

    return compatibility[builderType]?.includes(taskType) ?? false;
  }

  private hasRequiredResources(builder: BuilderDefinition, task: BuildTask): boolean {
    const requiredMemory = task.requirements.constraints.maxMemoryUsage;
    const availableMemory = builder.resources.memory;
    
    return availableMemory >= requiredMemory;
  }

  private hasRequiredCapabilities(builder: BuilderDefinition, task: BuildTask): boolean {
    const requiredCapabilities = task.requirements.constraints.requiredCapabilities;
    const builderCapabilities = builder.capabilities.map(cap => cap.name);
    
    return requiredCapabilities.every(req => builderCapabilities.includes(req));
  }

  private estimateTaskDuration(task: BuildTask, builder: BuilderDefinition): number {
    const baseEstimate = task.requirements.constraints.maxExecutionTime;
    const builderEfficiency = this.getBuilderEfficiency(builder.id);
    
    return baseEstimate * (2 - builderEfficiency); // Efficiency ranges 0-1, so duration is 1x-2x base
  }

  private calculateTaskLoad(task: BuildTask): number {
    // Calculate load as percentage based on resource usage and complexity
    const memoryLoad = (task.requirements.constraints.maxMemoryUsage / 1024) * 10;
    const timeLoad = (task.requirements.constraints.maxExecutionTime / 3600) * 20;
    
    return Math.min(100, memoryLoad + timeLoad);
  }

  private calculateProcessingCapacity(builder: BuilderDefinition): number {
    const cpuFactor = builder.resources.cpu * 25;
    const memoryFactor = (builder.resources.memory / 1024) * 10;
    
    return Math.min(100, cpuFactor + memoryFactor);
  }

  private extractSpecializations(builder: BuilderDefinition): TaskType[] {
    // Extract specializations based on builder type and capabilities
    const specializations: TaskType[] = [];
    
    switch (builder.type) {
      case 'frontend':
        specializations.push('create', 'update', 'optimize');
        break;
      case 'backend':
        specializations.push('create', 'update', 'deploy');
        break;
      case 'testing':
        specializations.push('test');
        break;
      case 'devops':
        specializations.push('deploy');
        break;
      case 'security':
        specializations.push('security-audit');
        break;
    }
    
    return specializations;
  }

  private getBuilderPerformanceScore(builderId: BuilderId): number {
    const builder = this.builders.get(builderId);
    if (!builder) return 0;
    
    const successRate = builder.metadata.totalTasks > 0 
      ? (builder.metadata.successfulTasks / builder.metadata.totalTasks) * 100 
      : 50;
    
    const speedScore = Math.max(0, 100 - (builder.metadata.averageCompletionTime / 60000)); // Convert to minutes
    
    return (successRate + speedScore) / 2;
  }

  private calculateResourceScore(builder: BuilderDefinition, task: BuildTask): number {
    const memoryRatio = builder.resources.memory / task.requirements.constraints.maxMemoryUsage;
    const cpuScore = builder.resources.cpu >= 2 ? 100 : 50;
    
    return Math.min(100, (memoryRatio * 50) + (cpuScore * 0.5));
  }

  private getBuilderEfficiency(builderId: BuilderId): number {
    const builder = this.builders.get(builderId);
    if (!builder) return 0.5;
    
    const successRate = builder.metadata.totalTasks > 0 
      ? builder.metadata.successfulTasks / builder.metadata.totalTasks 
      : 0.5;
    
    return Math.min(1, successRate + 0.2); // Minimum 20% efficiency boost
  }

  private shouldRetryTask(task: BuildTask): boolean {
    // Implement retry logic based on task type and failure reason
    return task.priority === 'critical' || task.priority === 'high';
  }

  private retryTask(task: BuildTask): void {
    // Reset task status and add back to queue with higher priority
    task.status = 'queued';
    task.progress = {
      percentage: 0,
      currentStep: 'Retrying task',
      totalSteps: task.progress.totalSteps,
      completedSteps: 0,
      estimatedTimeRemaining: task.requirements.constraints.maxExecutionTime,
    };
    
    // Increase priority for retry
    if (task.priority === 'low') task.priority = 'medium';
    else if (task.priority === 'medium') task.priority = 'high';
    
    this.addToQueue(task);
    this.emit('task-retried', { task });
  }

  private tryAssignTask(task: BuildTask): void {
    if (task.status !== 'queued') return;
    if (!this.areAllDependenciesCompleted(task)) return;
    
    // Try to assign immediately if resources are available
    setTimeout(() => this.assignTaskToBuilder(), 0);
  }

  private updateBuilderMetrics(builderId: BuilderId, completedTask: BuildTask): void {
    const builder = this.builders.get(builderId);
    if (!builder) return;

    builder.metadata.totalTasks++;
    builder.metadata.successfulTasks++;
    builder.metadata.lastActive = new Date();
    
    if (completedTask.timeline.actualDuration) {
      const currentAvg = builder.metadata.averageCompletionTime;
      const totalTasks = builder.metadata.totalTasks;
      builder.metadata.averageCompletionTime = 
        (currentAvg * (totalTasks - 1) + completedTask.timeline.actualDuration) / totalTasks;
    }

    const loadBalance = this.loadBalancers.get(builderId);
    if (loadBalance && completedTask.timeline.actualDuration) {
      loadBalance.averageTaskDuration = completedTask.timeline.actualDuration;
    }
  }

  // Orchestration Control
  private startOrchestration(): void {
    this.orchestrationInterval = setInterval(() => {
      this.assignTaskToBuilder();
    }, 1000); // Check every second
  }

  private stopOrchestration(): void {
    if (this.orchestrationInterval) {
      clearInterval(this.orchestrationInterval);
      this.orchestrationInterval = null;
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 5000); // Update metrics every 5 seconds
  }

  private stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  private updateMetrics(): void {
    const totalTasks = this.metrics.totalTasks;
    if (totalTasks === 0) return;

    this.metrics.successRate = (this.metrics.completedTasks / totalTasks) * 100;
    
    // Calculate resource utilization
    const totalBuilders = this.builders.size;
    const busyBuilders = this.builderPool.busy.length;
    this.metrics.resourceUtilization = totalBuilders > 0 ? (busyBuilders / totalBuilders) * 100 : 0;
    
    // Calculate throughput (tasks completed per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentCompletions = Array.from(this.tasks.values())
      .filter(task => 
        task.status === 'completed' && 
        task.timeline.completedAt && 
        task.timeline.completedAt.getTime() > oneMinuteAgo
      ).length;
    
    this.metrics.throughput = recentCompletions;
    
    this.emit('metrics-updated', { metrics: this.metrics });
  }

  // Event System
  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  // Public API
  getMetrics(): OrchestrationMetrics {
    return { ...this.metrics };
  }

  getBuilderStatus(): { pool: BuilderPool; loadBalancers: BuilderLoadBalance[] } {
    return {
      pool: {
        available: [...this.builderPool.available],
        busy: [...this.builderPool.busy],
        failed: [...this.builderPool.failed],
      },
      loadBalancers: Array.from(this.loadBalancers.values()),
    };
  }

  getTaskQueue(): { total: number; byPriority: Record<TaskPriority, number> } {
    return {
      total: Object.values(this.taskQueue).reduce((sum, queue) => sum + queue.length, 0),
      byPriority: {
        critical: this.taskQueue.critical.length,
        high: this.taskQueue.high.length,
        medium: this.taskQueue.medium.length,
        low: this.taskQueue.low.length,
      },
    };
  }

  shutdown(): void {
    this.stopOrchestration();
    this.stopMetricsCollection();
    this.eventHandlers.clear();
  }
}

// Export singleton instance
export const builderOrchestrator = BuilderOrchestrator.getInstance();