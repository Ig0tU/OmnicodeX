import { StateCreator } from 'zustand';
import { AppState, AppActions } from './index';
import { Notification } from '../types';

export interface NotificationSlice {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const createNotificationSlice: StateCreator<
  AppState & AppActions,
  [['zustand/immer', never]],
  [],
  NotificationSlice
> = (set, get) => ({
  notifications: [],
  addNotification: (notification) => set((state) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      dismissed: false,
    };
    state.notifications.unshift(newNotification);

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
});