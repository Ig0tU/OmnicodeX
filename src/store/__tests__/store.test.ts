import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore, useAuth, useBuilders, useTaskActions } from '../index';
import { createMockUser, createMockBuilder, createMockTask } from '@/test/utils';

// Reset store before each test
const resetStore = () => {
  useAppStore.getState().reset();
};

describe('App Store', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should initialize with no user', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set user and authentication state', () => {
      const { result } = renderHook(() => useAuth());
      const mockUser = createMockUser();

      act(() => {
        result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      // Since login is async, we need to wait for it
      act(() => {
        useAppStore.getState().setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle logout correctly', () => {
      const { result } = renderHook(() => useAuth());
      const mockUser = createMockUser();

      act(() => {
        useAppStore.getState().setUser(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle login with valid credentials', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.email).toBe('test@example.com');
    });
  });

  describe('Builders Management', () => {
    it('should initialize with empty builders', () => {
      const { result } = renderHook(() => useBuilders());
      
      expect(result.current).toEqual([]);
    });

    it('should add builder correctly', () => {
      const { result: buildersResult } = renderHook(() => useBuilders());
      const mockBuilder = createMockBuilder();

      act(() => {
        useAppStore.getState().addBuilder(mockBuilder);
      });

      expect(buildersResult.current).toContain(mockBuilder);
    });

    it('should update builder status', () => {
      const mockBuilder = createMockBuilder({ status: 'idle' });

      act(() => {
        useAppStore.getState().addBuilder(mockBuilder);
      });

      act(() => {
        useAppStore.getState().updateBuilderStatus(mockBuilder.id, 'coding');
      });

      const updatedBuilder = useAppStore.getState().builders[mockBuilder.id];
      expect(updatedBuilder.status).toBe('coding');
    });

    it('should update builder with partial data', () => {
      const mockBuilder = createMockBuilder({ name: 'Original Name' });

      act(() => {
        useAppStore.getState().addBuilder(mockBuilder);
      });

      act(() => {
        useAppStore.getState().updateBuilder(mockBuilder.id, { name: 'Updated Name' });
      });

      const updatedBuilder = useAppStore.getState().builders[mockBuilder.id];
      expect(updatedBuilder.name).toBe('Updated Name');
    });

    it('should remove builder correctly', () => {
      const mockBuilder = createMockBuilder();

      act(() => {
        useAppStore.getState().addBuilder(mockBuilder);
      });

      expect(useAppStore.getState().builders[mockBuilder.id]).toBeDefined();

      act(() => {
        useAppStore.getState().removeBuilder(mockBuilder.id);
      });

      expect(useAppStore.getState().builders[mockBuilder.id]).toBeUndefined();
    });
  });

  describe('Task Management', () => {
    it('should handle task creation', () => {
      const { result } = renderHook(() => useTaskActions());
      const mockTask = createMockTask();

      act(() => {
        result.current.createTask(mockTask);
      });

      const tasks = useAppStore.getState().activeTasks;
      expect(tasks[mockTask.id]).toEqual(mockTask);
    });

    it('should update task correctly', () => {
      const { result } = renderHook(() => useTaskActions());
      const mockTask = createMockTask({ status: 'queued' });

      act(() => {
        result.current.createTask(mockTask);
      });

      act(() => {
        result.current.updateTask(mockTask.id, { status: 'in-progress' });
      });

      const updatedTask = useAppStore.getState().activeTasks[mockTask.id];
      expect(updatedTask.status).toBe('in-progress');
    });

    it('should complete task correctly', () => {
      const { result } = renderHook(() => useTaskActions());
      const mockTask = createMockTask({ status: 'in-progress', progress: { percentage: 50, currentStep: 'Working', totalSteps: 5, completedSteps: 2, estimatedTimeRemaining: 100 } });

      act(() => {
        result.current.createTask(mockTask);
      });

      act(() => {
        result.current.completeTask(mockTask.id);
      });

      const completedTask = useAppStore.getState().activeTasks[mockTask.id];
      expect(completedTask.status).toBe('completed');
      expect(completedTask.progress.percentage).toBe(100);
    });

    it('should handle task failure with error', () => {
      const { result } = renderHook(() => useTaskActions());
      const mockTask = createMockTask({ status: 'in-progress' });

      act(() => {
        result.current.createTask(mockTask);
      });

      act(() => {
        result.current.failTask(mockTask.id, 'Test error');
      });

      const failedTask = useAppStore.getState().activeTasks[mockTask.id];
      expect(failedTask.status).toBe('failed');
      
      // Should also create an error
      const errors = useAppStore.getState().errors;
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Test error');
    });
  });

  describe('UI State Management', () => {
    it('should update UI settings', () => {
      const store = useAppStore.getState();

      act(() => {
        store.updateUI({ activeTab: 'terminal' });
      });

      expect(store.ui.activeTab).toBe('terminal');
    });

    it('should set active tab', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setActiveTab('chat');
      });

      expect(store.ui.activeTab).toBe('chat');
    });

    it('should toggle sidebar', () => {
      const store = useAppStore.getState();
      const initialWidth = store.ui.layoutConfig.sidebarWidth;

      act(() => {
        store.toggleSidebar();
      });

      expect(store.ui.layoutConfig.sidebarWidth).toBe(0);

      act(() => {
        store.toggleSidebar();
      });

      expect(store.ui.layoutConfig.sidebarWidth).toBe(280);
    });

    it('should update theme', () => {
      const store = useAppStore.getState();
      const newColors = { primary: '#ff0000' };

      act(() => {
        store.updateTheme({ colors: { ...store.ui.theme.colors, ...newColors } });
      });

      expect(store.ui.theme.colors.primary).toBe('#ff0000');
    });
  });

  describe('Error Management', () => {
    it('should add errors correctly', () => {
      const store = useAppStore.getState();
      const mockError = {
        id: 'error-1',
        type: 'system-error' as const,
        message: 'Test error',
        context: {
          sessionId: 'session-1',
          userAgent: 'test',
          url: 'http://test.com',
        },
        timestamp: new Date(),
        severity: 'medium' as const,
        recoverable: true,
      };

      act(() => {
        store.addError(mockError);
      });

      expect(store.errors).toContain(mockError);
    });

    it('should remove errors', () => {
      const store = useAppStore.getState();
      const mockError = {
        id: 'error-1',
        type: 'system-error' as const,
        message: 'Test error',
        context: {
          sessionId: 'session-1',
          userAgent: 'test',
          url: 'http://test.com',
        },
        timestamp: new Date(),
        severity: 'medium' as const,
        recoverable: true,
      };

      act(() => {
        store.addError(mockError);
      });

      expect(store.errors).toContain(mockError);

      act(() => {
        store.removeError(mockError.id);
      });

      expect(store.errors).not.toContain(mockError);
    });

    it('should clear all errors', () => {
      const store = useAppStore.getState();
      const mockError1 = {
        id: 'error-1',
        type: 'system-error' as const,
        message: 'Test error 1',
        context: { sessionId: 'session-1', userAgent: 'test', url: 'http://test.com' },
        timestamp: new Date(),
        severity: 'medium' as const,
        recoverable: true,
      };
      const mockError2 = {
        id: 'error-2',
        type: 'network-error' as const,
        message: 'Test error 2',
        context: { sessionId: 'session-1', userAgent: 'test', url: 'http://test.com' },
        timestamp: new Date(),
        severity: 'high' as const,
        recoverable: false,
      };

      act(() => {
        store.addError(mockError1);
        store.addError(mockError2);
      });

      expect(store.errors.length).toBe(2);

      act(() => {
        store.clearErrors();
      });

      expect(store.errors.length).toBe(0);
    });

    it('should limit error storage to 100 items', () => {
      const store = useAppStore.getState();

      // Add 101 errors
      for (let i = 0; i < 101; i++) {
        act(() => {
          store.addError({
            id: `error-${i}`,
            type: 'system-error',
            message: `Test error ${i}`,
            context: { sessionId: 'session-1', userAgent: 'test', url: 'http://test.com' },
            timestamp: new Date(),
            severity: 'medium',
            recoverable: true,
          });
        });
      }

      expect(store.errors.length).toBe(100);
      expect(store.errors[0].id).toBe('error-1'); // First error should be removed
      expect(store.errors[99].id).toBe('error-100'); // Last error should be kept
    });
  });

  describe('Notification Management', () => {
    it('should add notifications', () => {
      const store = useAppStore.getState();
      const notification = {
        type: 'success' as const,
        title: 'Test Success',
        message: 'Operation completed successfully',
        autoHide: true,
        duration: 5000,
      };

      act(() => {
        store.addNotification(notification);
      });

      expect(store.notifications.length).toBe(1);
      expect(store.notifications[0].title).toBe('Test Success');
      expect(store.notifications[0].dismissed).toBe(false);
    });

    it('should dismiss notifications', () => {
      const store = useAppStore.getState();
      const notification = {
        type: 'info' as const,
        title: 'Test Info',
        message: 'Information message',
        autoHide: false,
      };

      act(() => {
        store.addNotification(notification);
      });

      const notificationId = store.notifications[0].id;

      act(() => {
        store.dismissNotification(notificationId);
      });

      expect(store.notifications[0].dismissed).toBe(true);
    });

    it('should clear all notifications', () => {
      const store = useAppStore.getState();

      act(() => {
        store.addNotification({
          type: 'success',
          title: 'Success',
          message: 'Success message',
          autoHide: true,
        });
        store.addNotification({
          type: 'error',
          title: 'Error',
          message: 'Error message',
          autoHide: false,
        });
      });

      expect(store.notifications.length).toBe(2);

      act(() => {
        store.clearNotifications();
      });

      expect(store.notifications.length).toBe(0);
    });
  });

  describe('WebSocket Message Handling', () => {
    it('should handle builder status update messages', () => {
      const store = useAppStore.getState();
      const mockBuilder = createMockBuilder({ status: 'idle' });

      act(() => {
        store.addBuilder(mockBuilder);
      });

      const message = {
        id: 'msg-1',
        type: 'builder-status-update' as const,
        timestamp: new Date(),
        senderId: 'server',
        payload: {
          builderId: mockBuilder.id,
          status: 'coding',
        },
      };

      act(() => {
        store.handleMessage(message);
      });

      const updatedBuilder = store.builders[mockBuilder.id];
      expect(updatedBuilder.status).toBe('coding');
    });

    it('should handle task progress update messages', () => {
      const store = useAppStore.getState();
      const mockTask = createMockTask({ progress: { percentage: 25, currentStep: 'Starting', totalSteps: 5, completedSteps: 1, estimatedTimeRemaining: 200 } });

      act(() => {
        store.createTask(mockTask);
      });

      const message = {
        id: 'msg-2',
        type: 'task-progress-update' as const,
        timestamp: new Date(),
        senderId: 'server',
        payload: {
          taskId: mockTask.id,
          progress: {
            percentage: 75,
            currentStep: 'Almost done',
            totalSteps: 5,
            completedSteps: 4,
            estimatedTimeRemaining: 50,
          },
        },
      };

      act(() => {
        store.handleMessage(message);
      });

      const updatedTask = store.activeTasks[mockTask.id];
      expect(updatedTask.progress.percentage).toBe(75);
      expect(updatedTask.progress.currentStep).toBe('Almost done');
    });

    it('should handle system notification messages', () => {
      const store = useAppStore.getState();

      const message = {
        id: 'msg-3',
        type: 'system-notification' as const,
        timestamp: new Date(),
        senderId: 'server',
        payload: {
          notification: {
            type: 'warning',
            title: 'System Alert',
            message: 'High resource usage detected',
            autoHide: false,
          },
        },
      };

      act(() => {
        store.handleMessage(message);
      });

      expect(store.notifications.length).toBe(1);
      expect(store.notifications[0].title).toBe('System Alert');
      expect(store.notifications[0].type).toBe('warning');
    });
  });

  describe('Performance Metrics', () => {
    it('should update performance metrics', () => {
      const store = useAppStore.getState();
      const newMetrics = {
        renderTime: 16.5,
        memoryUsage: 50.2,
        activeConnections: 3,
        tasksPerSecond: 2.1,
      };

      act(() => {
        store.updateMetrics(newMetrics);
      });

      expect(store.metrics).toEqual(newMetrics);
    });

    it('should partially update performance metrics', () => {
      const store = useAppStore.getState();
      const initialMetrics = store.metrics;

      act(() => {
        store.updateMetrics({ renderTime: 20.0 });
      });

      expect(store.metrics.renderTime).toBe(20.0);
      expect(store.metrics.memoryUsage).toBe(initialMetrics.memoryUsage);
      expect(store.metrics.activeConnections).toBe(initialMetrics.activeConnections);
    });
  });

  describe('Store Reset', () => {
    it('should reset store to initial state', () => {
      const store = useAppStore.getState();
      const mockUser = createMockUser();
      const mockBuilder = createMockBuilder();

      // Modify store state
      act(() => {
        store.setUser(mockUser);
        store.addBuilder(mockBuilder);
        store.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
          autoHide: true,
        });
      });

      // Verify state is modified
      expect(store.user).toEqual(mockUser);
      expect(Object.keys(store.builders).length).toBe(1);
      expect(store.notifications.length).toBe(1);

      // Reset store
      act(() => {
        store.reset();
      });

      // Verify state is reset
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(Object.keys(store.builders).length).toBe(0);
      expect(store.notifications.length).toBe(0);
      expect(store.errors.length).toBe(0);
    });
  });
});