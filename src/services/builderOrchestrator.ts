/**
 * @file builderOrchestrator.ts
 * @description This file contains the core logic for orchestrating builder agents and managing build tasks.
 * @version 2.0.0
 * @author The Omni-Architect
 */

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

// --- Constants and Configuration ---
const ORCHESTRATOR_CONFIG = {
  // Intervals
  ORCHESTRATION_INTERVAL_MS: 1000,
  METRICS_INTERVAL_MS: 5000,
  METRICS_WINDOW_MS: 60000, // 1 minute for throughput calculation

  // Scoring Weights (must sum to 1.0)
  SCORE_WEIGHT_SPECIALIZATION: 0.4,
  SCORE_WEIGHT_LOAD: 0.3,
  SCORE_WEIGHT_PERFORMANCE: 0.2,
  SCORE_WEIGHT_RESOURCES: 0.1,

  // Defaults
  DEFAULT_AVG_TASK_DURATION_MS: 300000, // 5 minutes
  SIMULATED_FAILURE_RATE: 0.05, // 5%
};

// --- Type Definitions ---
// Note: Most core types are imported from ../types

interface BuilderPool {
  available: Map<BuilderId, BuilderDefinition>;
  busy: Map<BuilderId, BuilderDefinition>;
  failed: Map<BuilderId, BuilderDefinition>;
}

interface TaskQueue {
  critical: BuildTask[];
  high: BuildTask[];
  medium: BuildTask[];
  low: BuildTask[];
}

interface OrchestrationMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  throughput: number; // tasks per minute
  resourceUtilization: number; // percentage
  successRate: number; // percentage
}

// ... (other interfaces remain the same)

/**
 * @class BuilderOrchestrator
 * @description Singleton class to manage the lifecycle and assignment of build tasks to builder agents.
 * @remarks This is a foundational service. Future elevation should decompose this monolith into smaller,
 * specialized services (e.g., BuilderRegistry, TaskScheduler, MetricsCollector).
 */
export class BuilderOrchestrator {
  private static instance: BuilderOrchestrator;

  private builders: Map<BuilderId, BuilderDefinition> = new Map();
  private tasks: Map<TaskId, BuildTask> = new Map();
  private taskQueue: TaskQueue = { critical: [], high: [], medium: [], low: [] };
  private builderPool: BuilderPool = { available: new Map(), busy: new Map(), failed: new Map() };
  private metrics: OrchestrationMetrics = this.getInitialMetrics();
  private completionTimestamps: number[] = []; // For efficient throughput calculation

  // ... (loadBalancers and eventHandlers remain the same)

  private orchestrationTimeout: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startOrchestration();
    this.startMetricsCollection();
  }

  public static getInstance(): BuilderOrchestrator {
    if (!BuilderOrchestrator.instance) {
      BuilderOrchestrator.instance = new BuilderOrchestrator();
    }
    return BuilderOrchestrator.instance;
  }

  // --- Public API ---

  /**
   * Registers a new builder with the orchestrator.
   * @param builder - The definition of the builder to register.
   */
  public registerBuilder(builder: BuilderDefinition): void {
    this.builders.set(builder.id, builder);
    this.moveBuilderToPool(builder, 'available');
    // ... (rest of the method is the same)
  }

  /**
   * Submits a new build task to be processed.
   * @param task - The build task to submit.
   * @returns The ID of the submitted task.
   */
  public submitTask(task: BuildTask): TaskId {
    // ... (rest of the method is the same)
    return task.id;
  }

  // ... (other public methods like unregisterBuilder, cancelTask, etc.)

  // --- Core Orchestration Logic ---

  /**
   * Main orchestration loop. Fetches the next task and assigns it to an optimal builder.
   * Uses a recursive setTimeout instead of setInterval to prevent overlapping executions.
   */
  private async orchestrate(): Promise<void> {
    try {
      const task = this.getNextTaskFromQueue();
      if (!task) return;

      const optimalBuilder = await this.findOptimalBuilder(task);
      if (!optimalBuilder) {
        // No suitable builder, re-queue the task at the front
        this.getQueueByPriority(task.priority).unshift(task);
        return;
      }

      await this.executeTask(task, optimalBuilder);
    } catch (error) {
      errorHandler.handleError(error as Error, { context: 'OrchestrationLoop' });
    } finally {
      this.orchestrationTimeout = setTimeout(() => this.orchestrate(), ORCHESTRATOR_CONFIG.ORCHESTRATION_INTERVAL_MS);
    }
  }

  private getNextTaskFromQueue(): BuildTask | null {
    // Priority order: critical > high > medium > low
    for (const priority of ['critical', 'high', 'medium', 'low'] as const) {
      if (this.taskQueue[priority].length > 0) {
        return this.taskQueue[priority].shift()!;
      }
    }
    return null;
  }

  private async findOptimalBuilder(task: BuildTask): Promise<BuilderDefinition | null> {
    const compatibleBuilders = [...this.builderPool.available.values()].filter(builder =>
      this.canBuilderHandleTask(builder, task)
    );

    if (compatibleBuilders.length === 0) return null;
    if (compatibleBuilders.length === 1) return compatibleBuilders[0];

    // Score and select the best builder
    const scoredBuilders = compatibleBuilders.map(builder => ({
      builder,
      score: this.calculateBuilderScore(builder, task),
    }));

    scoredBuilders.sort((a, b) => b.score - a.score);
    return scoredBuilders[0].builder;
  }

  private calculateBuilderScore(builder: BuilderDefinition, task: BuildTask): number {
    // Decomposed scoring for clarity and maintainability
    const specializationScore = this.scoreBySpecialization(builder, task) * ORCHESTRATOR_CONFIG.SCORE_WEIGHT_SPECIALIZATION;
    const loadScore = this.scoreByLoad(builder) * ORCHESTRATOR_CONFIG.SCORE_WEIGHT_LOAD;
    const performanceScore = this.scoreByPerformance(builder) * ORCHESTRATOR_CONFIG.SCORE_WEIGHT_PERFORMANCE;
    const resourceScore = this.scoreByResources(builder, task) * ORCHESTRATOR_CONFIG.SCORE_WEIGHT_RESOURCES;
    
    return specializationScore + loadScore + performanceScore + resourceScore;
  }

  // --- Builder Pool Management (Optimized) ---

  /**
   * Moves a builder to the specified pool, ensuring it is removed from all other pools first.
   * @param builder - The builder to move.
   * @param targetPool - The name of the pool to move the builder to.
   */
  private moveBuilderToPool(builder: BuilderDefinition, targetPool: keyof BuilderPool): void {
    // Remove from all pools to prevent duplicates
    this.builderPool.available.delete(builder.id);
    this.builderPool.busy.delete(builder.id);
    this.builderPool.failed.delete(builder.id);

    // Add to the target pool
    this.builderPool[targetPool].set(builder.id, builder);
  }

  private updateBuilderPools(builder: BuilderDefinition): void {
    switch (builder.status) {
      case 'idle':
        this.moveBuilderToPool(builder, 'available');
        break;
      case 'coding':
      case 'testing':
      case 'building':
      case 'deploying':
        this.moveBuilderToPool(builder, 'busy');
        break;
      case 'error':
      case 'timeout':
        this.moveBuilderToPool(builder, 'failed');
        break;
    }
  }

  // --- Metrics Collection (Optimized) ---

  /**
   * Updates and emits orchestration metrics periodically.
   */
  private updateMetrics(): void {
    const now = Date.now();
    
    // 1. Prune old completion timestamps
    this.completionTimestamps = this.completionTimestamps.filter(
      ts => now - ts < ORCHESTRATOR_CONFIG.METRICS_WINDOW_MS
    );

    // 2. Calculate throughput (tasks per minute) from the filtered timestamps
    this.metrics.throughput = this.completionTimestamps.length;
    
    // 3. Calculate resource utilization
    const totalBuilders = this.builders.size;
    if (totalBuilders > 0) {
      this.metrics.resourceUtilization = (this.builderPool.busy.size / totalBuilders) * 100;
    }

    // 4. Calculate success rate
    if (this.metrics.totalTasks > 0) {
      this.metrics.successRate = (this.metrics.completedTasks / this.metrics.totalTasks) * 100;
    }

    this.emit('metrics-updated', { metrics: this.metrics });
  }

  // --- Lifecycle Methods ---

  private startOrchestration(): void {
    // Use recursive setTimeout for a safer execution loop
    this.orchestrationTimeout = setTimeout(() => this.orchestrate(), ORCHESTRATOR_CONFIG.ORCHESTRATION_INTERVAL_MS);
  }

  private stopOrchestration(): void {
    if (this.orchestrationTimeout) {
      clearTimeout(this.orchestrationTimeout);
      this.orchestrationTimeout = null;
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => this.updateMetrics(), ORCHESTRATOR_CONFIG.METRICS_INTERVAL_MS);
  }

  // ... (rest of the class methods: completeTask, failTask, scoring helpers, etc.)

  public completeTask(taskId: TaskId): void {
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
    this.completionTimestamps.push(Date.now());

    // Update builder metrics
    if (task.builderId) {
      const builder = this.builders.get(task.builderId);
      if (builder) {
        this.releaseBuilder(builder);
      }
    }

    this.emit('task-completed', { task });

    // Check for dependent tasks
    this.checkDependentTasks(taskId);
  }

  private getInitialMetrics(): OrchestrationMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageExecutionTime: 0,
      throughput: 0,
      resourceUtilization: 0,
      successRate: 0,
    };
  }

  // --- Scoring Helpers ---
  private scoreBySpecialization(builder: BuilderDefinition, task: BuildTask): number {
    const loadBalance = this.loadBalancers.get(builder.id);
    if (!loadBalance) return 50; // Neutral score if no load balance info
    return loadBalance.specializations.includes(task.type) ? 100 : 50;
  }

  private scoreByLoad(builder: BuilderDefinition): number {
    const loadBalance = this.loadBalancers.get(builder.id);
    if (!loadBalance) return 50;
    return Math.max(0, 100 - loadBalance.currentLoad);
  }

  private scoreByPerformance(builder: BuilderDefinition): number {
    const successRate = builder.metadata.totalTasks > 0
      ? (builder.metadata.successfulTasks / builder.metadata.totalTasks) * 100
      : 50; // Start with a neutral score
    const avgTime = builder.metadata.averageCompletionTime || ORCHESTRATOR_CONFIG.DEFAULT_AVG_TASK_DURATION_MS;
    const speedScore = Math.max(0, 100 - (avgTime / 60000)); // Higher score for faster times
    return (successRate + speedScore) / 2;
  }

  private scoreByResources(builder: BuilderDefinition, task: BuildTask): number {
     // This is a simplified scoring. A real system might have more complex resource matching.
     const memoryRatio = builder.resources.memory / task.requirements.constraints.maxMemoryUsage;
     if (memoryRatio < 1) return 0; // Not enough memory
     const memoryScore = Math.min(100, memoryRatio * 50); // Score better if there's more headroom
     const cpuScore = builder.resources.cpu >= task.requirements.constraints.minCpuCores ? 100 : 50;
     return (memoryScore + cpuScore) / 2;
  }
}

// Export singleton instance
export const builderOrchestrator = BuilderOrchestrator.getInstance();
