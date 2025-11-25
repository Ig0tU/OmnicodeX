import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createAuthSlice, AuthSlice } from './authSlice';
import { createBuilderSlice, BuilderSlice } from './builderSlice';
import { createTaskSlice, TaskSlice } from './taskSlice';
import { createUiSlice, UiSlice } from './uiSlice';
import { createNotificationSlice, NotificationSlice } from './notificationSlice';
import { shallow } from 'zustand/shallow';
import {
  BuilderDefinition,
  BuildTask,
  UIState,
  User,
  AppError,
  TaskId,
  BuilderId,
  WebSocketMessage,
  Notification,
  PerformanceMetrics
} from '../types';

export type AppState = AuthSlice & BuilderSlice & TaskSlice & UiSlice & NotificationSlice & {
    connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
    lastMessage: WebSocketMessage | null;
    errors: AppError[];
    metrics: PerformanceMetrics;
  };

export type AppActions = {
  setConnectionStatus: (status: AppState['connectionStatus']) => void;
  handleMessage: (message: WebSocketMessage) => void;
  addError: (error: AppError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  reset: () => void;
};

const initialState = {
    connectionStatus: 'disconnected' as 'connected' | 'connecting' | 'disconnected' | 'error',
    lastMessage: null,
    errors: [],
    metrics: {
      renderTime: 0,
      memoryUsage: 0,
      activeConnections: 0,
      tasksPerSecond: 0,
    },
  };

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((...a) => ({
          ...createAuthSlice(...a),
          ...createBuilderSlice(...a),
          ...createTaskSlice(...a),
          ...createUiSlice(...a),
          ...createNotificationSlice(...a),
          ...initialState,
          setConnectionStatus: (status) => a[0]((state) => {
            state.connectionStatus = status;
          }),
          handleMessage: (message) => a[0]((state) => {
            state.lastMessage = message;
          }),
          addError: (error) => a[0]((state) => {
            state.errors.push(error);
          }),
          removeError: (id) => a[0]((state) => {
            state.errors = state.errors.filter(e => e.id !== id);
          }),
          clearErrors: () => a[0]((state) => {
            state.errors = [];
          }),
          updateMetrics: (metrics) => a[0]((state) => {
            state.metrics = { ...state.metrics, ...metrics };
          }),
          reset: () => a[0]((state) => {
            Object.assign(state, {
                ...initialState,
                user: null,
                isAuthenticated: false,
                builders: {},
                activeTasks: {},
                notifications: [],
                ui: createUiSlice(...a).ui,
            })
          }),
        }))
      ),
      {
        name: 'cloudide-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          ui: state.ui,
        }),
      }
    ),
    { name: 'CloudIDE Store' }
  )
);

// Memoized Selectors
export const useBuilders = () => useAppStore(state => Object.values(state.builders));
export const useActiveTasks = () => useAppStore(state => Object.values(state.activeTasks));
export const useUI = () => useAppStore(state => state.ui, shallow);
export const useUser = () => useAppStore(state => state.user, shallow);
export const useErrors = () => useAppStore(state => state.errors);
export const useNotifications = () => useAppStore(state => state.notifications.filter(n => !n.dismissed));
export const useConnectionStatus = () => useAppStore(state => state.connectionStatus);

// Action Hooks
export const useAuth = () => useAppStore(state => ({
  login: state.login,
  logout: state.logout,
  user: state.user,
  isAuthenticated: state.isAuthenticated,
}), shallow);

export const useBuilderActions = () => useAppStore(state => ({
  addBuilder: state.addBuilder,
  updateBuilder: state.updateBuilder,
  removeBuilder: state.removeBuilder,
  updateBuilderStatus: state.updateBuilderStatus,
}), shallow);

export const useTaskActions = () => useAppStore(state => ({
  createTask: state.createTask,
  updateTask: state.updateTask,
  completeTask: state.completeTask,
  failTask: state.failTask,
}), shallow);