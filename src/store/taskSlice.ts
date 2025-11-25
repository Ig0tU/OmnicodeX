import { StateCreator } from 'zustand';
import { AppState, AppActions } from './index';
import { BuildTask, TaskId } from '../types';

export interface TaskSlice {
  activeTasks: Record<TaskId, BuildTask>;
  createTask: (task: BuildTask) => void;
  updateTask: (id: TaskId, updates: Partial<BuildTask>) => void;
  completeTask: (id: TaskId) => void;
  failTask: (id: TaskId, error: string) => void;
}

export const createTaskSlice: StateCreator<
  AppState & AppActions,
  [['zustand/immer', never]],
  [],
  TaskSlice
> = (set, get) => ({
  activeTasks: {},
  createTask: (task) => set((state) => {
    state.activeTasks[task.id] = task;
  }),
  updateTask: (id, updates) => set((state) => {
    if (state.activeTasks[id]) {
      Object.assign(state.activeTasks[id], updates);
    }
  }),
  completeTask: (id) => set((state) => {
    if (state.activeTasks[id]) {
      state.activeTasks[id].status = 'completed';
      state.activeTasks[id].progress.percentage = 100;
    }
  }),
  failTask: (id, error) => set((state) => {
    if (state.activeTasks[id]) {
      state.activeTasks[id].status = 'failed';
      get().addError({
        id: crypto.randomUUID(),
        type: 'builder-error',
        message: `Task ${id} failed: ${error}`,
        context: {
          sessionId: 'session-1',
          taskId: id,
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
        timestamp: new Date(),
        severity: 'medium',
        recoverable: true,
      });
    }
  }),
});