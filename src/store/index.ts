import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  BuilderDefinition,
  BuildTask,
  UIState,
  User,
  AppError,
  TaskId,
  BuilderId,
  WebSocketMessage,
} from '../types';

// Application State Interface
interface AppState {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  
  // Builders
  builders: Record<BuilderId, BuilderDefinition>;
  activeTasks: Record<TaskId, BuildTask>;
  
  // UI State
  ui: UIState;
  
  // Communication
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastMessage: WebSocketMessage | null;
  
  // Error Handling
  errors: AppError[];
  notifications: Notification[];
  
  // Performance
  metrics: PerformanceMetrics;
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
  autoHide: boolean;
  duration?: number;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  activeConnections: number;
  tasksPerSecond: number;
}

// Actions Interface
interface AppActions {
  // Authentication Actions
  setUser: (user: User | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  
  // Builder Actions
  addBuilder: (builder: BuilderDefinition) => void;
  updateBuilder: (id: BuilderId, updates: Partial<BuilderDefinition>) => void;
  removeBuilder: (id: BuilderId) => void;
  updateBuilderStatus: (id: BuilderId, status: BuilderDefinition['status']) => void;
  
  // Task Actions
  createTask: (task: BuildTask) => void;
  updateTask: (id: TaskId, updates: Partial<BuildTask>) => void;
  completeTask: (id: TaskId) => void;
  failTask: (id: TaskId, error: string) => void;
  
  // UI Actions
  updateUI: (updates: Partial<UIState>) => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
  toggleSidebar: () => void;
  updateTheme: (theme: Partial<UIState['theme']>) => void;
  
  // Communication Actions
  setConnectionStatus: (status: AppState['connectionStatus']) => void;
  handleMessage: (message: WebSocketMessage) => void;
  
  // Error Actions
  addError: (error: AppError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  
  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Performance Actions
  updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  
  // Utility Actions
  reset: () => void;
}

interface LoginCredentials {
  email: string;
  password: string;
}

// Initial State
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  builders: {},
  activeTasks: {},
  ui: {
    activeTab: 'editor',
    selectedFiles: [],
    editorSettings: {
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
      theme: 'dark',
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true,
      minimap: true,
      autoSave: true,
      formatOnSave: true,
    },
    layoutConfig: {
      sidebarWidth: 280,
      panelHeight: 250,
      showStatusBar: true,
      showActivityBar: true,
      workbenchLayout: 'default',
    },
    theme: {
      name: 'Dark Pro',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#10b981',
        background: '#0f172a',
        foreground: '#f1f5f9',
        border: '#334155',
        error: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        info: '#3b82f6',
      },
      customizations: {},
    },
    accessibility: {
      enableScreenReader: false,
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
      announceStatus: true,
      keyboardShortcuts: {
        'editor.save': 'Ctrl+S',
        'editor.find': 'Ctrl+F',
        'editor.replace': 'Ctrl+H',
        'workbench.toggleSidebar': 'Ctrl+B',
        'workbench.togglePanel': 'Ctrl+J',
      },
    },
  },
  connectionStatus: 'disconnected',
  lastMessage: null,
  errors: [],
  notifications: [],
  metrics: {
    renderTime: 0,
    memoryUsage: 0,
    activeConnections: 0,
    tasksPerSecond: 0,
  },
};

// Create Store with Middleware
export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Authentication Actions
          setUser: (user) => set((state) => {
            state.user = user;
            state.isAuthenticated = user !== null;
          }),

          login: async (credentials) => {
            try {
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const mockUser: User = {
                id: 'user-1',
                username: credentials.email.split('@')[0],
                email: credentials.email,
                roles: [],
                permissions: [],
                profile: {
                  firstName: 'John',
                  lastName: 'Doe',
                  timezone: 'UTC',
                  locale: 'en-US',
                },
                preferences: {
                  theme: 'dark',
                  language: 'en',
                  notifications: {
                    email: true,
                    push: true,
                    desktop: false,
                    sound: false,
                  },
                  privacy: {
                    shareUsageData: false,
                    allowCookies: true,
                    trackingEnabled: false,
                  },
                },
              };
              
              get().setUser(mockUser);
              get().addNotification({
                type: 'success',
                title: 'Login Successful',
                message: `Welcome back, ${mockUser.profile.firstName}!`,
                autoHide: true,
                duration: 5000,
              });
            } catch (error) {
              get().addError({
                id: crypto.randomUUID(),
                type: 'authentication-error',
                message: 'Login failed. Please check your credentials.',
                context: {
                  sessionId: 'session-1',
                  userAgent: navigator.userAgent,
                  url: window.location.href,
                  additionalData: { credentials: credentials.email },
                },
                timestamp: new Date(),
                severity: 'high',
                recoverable: true,
              });
            }
          },

          logout: () => set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.builders = {};
            state.activeTasks = {};
          }),

          // Builder Actions
          addBuilder: (builder) => set((state) => {
            state.builders[builder.id] = builder;
          }),

          updateBuilder: (id, updates) => set((state) => {
            if (state.builders[id]) {
              Object.assign(state.builders[id], updates);
            }
          }),

          removeBuilder: (id) => set((state) => {
            delete state.builders[id];
          }),

          updateBuilderStatus: (id, status) => set((state) => {
            if (state.builders[id]) {
              state.builders[id].status = status;
            }
          }),

          // Task Actions
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

          // UI Actions
          updateUI: (updates) => set((state) => {
            Object.assign(state.ui, updates);
          }),

          setActiveTab: (tab) => set((state) => {
            state.ui.activeTab = tab;
          }),

          toggleSidebar: () => set((state) => {
            state.ui.layoutConfig.sidebarWidth = state.ui.layoutConfig.sidebarWidth > 0 ? 0 : 280;
          }),

          updateTheme: (theme) => set((state) => {
            Object.assign(state.ui.theme, theme);
          }),

          // Communication Actions
          setConnectionStatus: (status) => set((state) => {
            state.connectionStatus = status;
          }),

          handleMessage: (message) => set((state) => {
            state.lastMessage = message;
            
            // Handle different message types
            switch (message.type) {
              case 'builder-status-update':
                if (message.payload && typeof message.payload === 'object' && 'builderId' in message.payload) {
                  const { builderId, status } = message.payload as { builderId: BuilderId; status: any };
                  get().updateBuilderStatus(builderId, status);
                }
                break;
              
              case 'task-progress-update':
                if (message.payload && typeof message.payload === 'object' && 'taskId' in message.payload) {
                  const { taskId, progress } = message.payload as { taskId: TaskId; progress: any };
                  get().updateTask(taskId, { progress });
                }
                break;
              
              case 'system-notification':
                if (message.payload && typeof message.payload === 'object' && 'notification' in message.payload) {
                  const { notification } = message.payload as { notification: Omit<Notification, 'id' | 'timestamp' | 'dismissed'> };
                  get().addNotification(notification);
                }
                break;
            }
          }),

          // Error Actions
          addError: (error) => set((state) => {
            state.errors.push(error);
            // Keep only last 100 errors
            if (state.errors.length > 100) {
              state.errors = state.errors.slice(-100);
            }
          }),

          removeError: (id) => set((state) => {
            state.errors = state.errors.filter(error => error.id !== id);
          }),

          clearErrors: () => set((state) => {
            state.errors = [];
          }),

          // Notification Actions
          addNotification: (notification) => set((state) => {
            const newNotification: Notification = {
              ...notification,
              id: crypto.randomUUID(),
              timestamp: new Date(),
              dismissed: false,
            };
            state.notifications.unshift(newNotification);
            
            // Auto-hide if specified
            if (newNotification.autoHide && newNotification.duration) {
              setTimeout(() => {
                get().dismissNotification(newNotification.id);
              }, newNotification.duration);
            }
          }),

          dismissNotification: (id) => set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            if (notification) {
              notification.dismissed = true;
            }
          }),

          clearNotifications: () => set((state) => {
            state.notifications = [];
          }),

          // Performance Actions
          updateMetrics: (metrics) => set((state) => {
            Object.assign(state.metrics, metrics);
          }),

          // Utility Actions
          reset: () => set(() => ({ ...initialState })),
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

// Selectors
export const useBuilders = () => useAppStore(state => Object.values(state.builders));
export const useActiveTasks = () => useAppStore(state => Object.values(state.activeTasks));
export const useUI = () => useAppStore(state => state.ui);
export const useUser = () => useAppStore(state => state.user);
export const useErrors = () => useAppStore(state => state.errors);
export const useNotifications = () => useAppStore(state => state.notifications.filter(n => !n.dismissed));
export const useConnectionStatus = () => useAppStore(state => state.connectionStatus);

// Action Hooks
export const useAuth = () => {
  const login = useAppStore(state => state.login);
  const logout = useAppStore(state => state.logout);
  const user = useAppStore(state => state.user);
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  
  return { login, logout, user, isAuthenticated };
};

export const useBuilderActions = () => {
  const addBuilder = useAppStore(state => state.addBuilder);
  const updateBuilder = useAppStore(state => state.updateBuilder);
  const removeBuilder = useAppStore(state => state.removeBuilder);
  const updateBuilderStatus = useAppStore(state => state.updateBuilderStatus);
  
  return { addBuilder, updateBuilder, removeBuilder, updateBuilderStatus };
};

export const useTaskActions = () => {
  const createTask = useAppStore(state => state.createTask);
  const updateTask = useAppStore(state => state.updateTask);
  const completeTask = useAppStore(state => state.completeTask);
  const failTask = useAppStore(state => state.failTask);
  
  return { createTask, updateTask, completeTask, failTask };
};