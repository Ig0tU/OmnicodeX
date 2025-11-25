import { StateCreator } from 'zustand';
import { AppState, AppActions } from './index'; // Assuming combined types are in index

export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const createAuthSlice: StateCreator<
  AppState & AppActions,
  [['zustand/immer', never]],
  [],
  AuthSlice
> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set((state) => {
    state.user = user;
    state.isAuthenticated = user !== null;
  }),
  login: async (credentials) => {
    try {
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
  logout: () => {
    get().reset();
  },
});
