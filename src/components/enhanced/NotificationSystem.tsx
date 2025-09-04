import React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications, useAppStore } from '../../store';

interface NotificationProps {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoHide: boolean;
  duration?: number;
  onDismiss: (id: string) => void;
}

const notificationIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const notificationColors = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-900 dark:text-green-100',
    message: 'text-green-700 dark:text-green-200',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-900 dark:text-yellow-100',
    message: 'text-yellow-700 dark:text-yellow-200',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
    message: 'text-red-700 dark:text-red-200',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
    message: 'text-blue-700 dark:text-blue-200',
  },
};

const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  timestamp,
  autoHide,
  duration = 5000,
  onDismiss,
}) => {
  const [progress, setProgress] = React.useState(100);
  const [isPaused, setIsPaused] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = React.useRef<number>(Date.now());
  const remainingTimeRef = React.useRef<number>(duration);

  const Icon = notificationIcons[type];
  const colors = notificationColors[type];

  const startTimer = React.useCallback(() => {
    if (!autoHide || isPaused) return;

    startTimeRef.current = Date.now();
    const updateInterval = 50; // Update every 50ms for smooth progress

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingTimeRef.current - elapsed);
      const progressPercentage = (remaining / duration) * 100;

      setProgress(progressPercentage);

      if (remaining <= 0) {
        onDismiss(id);
      }
    }, updateInterval);
  }, [autoHide, isPaused, duration, id, onDismiss]);

  const pauseTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
    setIsPaused(true);
  }, []);

  const resumeTimer = React.useCallback(() => {
    setIsPaused(false);
  }, []);

  React.useEffect(() => {
    if (!isPaused) {
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTimer, isPaused]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100 || info.offset.x < -100) {
      onDismiss(id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      drag="x"
      dragConstraints={{ left: -200, right: 200 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05, rotate: 2 }}
      className={`
        relative max-w-sm w-full p-4 rounded-lg shadow-lg border backdrop-blur-sm cursor-pointer
        ${colors.bg} ${colors.border}
        hover:shadow-xl transition-shadow duration-200
      `}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      whileHover={{ scale: 1.02 }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 300,
      }}
    >
      {/* Progress bar */}
      {autoHide && (
        <motion.div
          className="absolute top-0 left-0 h-1 bg-current opacity-30 rounded-t-lg origin-left"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      )}

      <div className="flex items-start space-x-3">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className={`flex-shrink-0 ${colors.icon}`}
        >
          <Icon className="w-5 h-5" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <motion.h4
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-sm font-semibold ${colors.title}`}
          >
            {title}
          </motion.h4>
          
          <motion.p
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-sm mt-1 ${colors.message}`}
          >
            {message}
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-muted-foreground mt-2"
          >
            {timestamp.toLocaleTimeString()}
          </motion.p>
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => onDismiss(id)}
          className={`
            flex-shrink-0 p-1 rounded-md transition-colors duration-200
            ${colors.icon} hover:bg-current hover:bg-opacity-10
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export const NotificationSystem: React.FC = () => {
  const notifications = useNotifications();
  const dismissNotification = useAppStore(state => state.dismissNotification);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            id={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            timestamp={notification.timestamp}
            autoHide={notification.autoHide}
            duration={notification.duration}
            onDismiss={dismissNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast notification hook for easy usage
export const useToast = () => {
  const addNotification = useAppStore(state => state.addNotification);

  const toast = React.useCallback((
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message: string,
    options?: {
      autoHide?: boolean;
      duration?: number;
    }
  ) => {
    addNotification({
      type,
      title,
      message,
      autoHide: options?.autoHide ?? true,
      duration: options?.duration ?? 5000,
    });
  }, [addNotification]);

  return {
    toast,
    success: (title: string, message: string, options?: { autoHide?: boolean; duration?: number }) =>
      toast('success', title, message, options),
    warning: (title: string, message: string, options?: { autoHide?: boolean; duration?: number }) =>
      toast('warning', title, message, options),
    error: (title: string, message: string, options?: { autoHide?: boolean; duration?: number }) =>
      toast('error', title, message, options),
    info: (title: string, message: string, options?: { autoHide?: boolean; duration?: number }) =>
      toast('info', title, message, options),
  };
};

// Global notification manager
export class NotificationManager {
  private static instance: NotificationManager;
  private addNotification: ((notification: any) => void) | null = null;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  setNotificationHandler(handler: (notification: any) => void) {
    this.addNotification = handler;
  }

  notify(
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message: string,
    options?: { autoHide?: boolean; duration?: number }
  ) {
    if (this.addNotification) {
      this.addNotification({
        type,
        title,
        message,
        autoHide: options?.autoHide ?? true,
        duration: options?.duration ?? 5000,
      });
    }
  }

  success(title: string, message: string, options?: { autoHide?: boolean; duration?: number }) {
    this.notify('success', title, message, options);
  }

  warning(title: string, message: string, options?: { autoHide?: boolean; duration?: number }) {
    this.notify('warning', title, message, options);
  }

  error(title: string, message: string, options?: { autoHide?: boolean; duration?: number }) {
    this.notify('error', title, message, options);
  }

  info(title: string, message: string, options?: { autoHide?: boolean; duration?: number }) {
    this.notify('info', title, message, options);
  }
}

export const notificationManager = NotificationManager.getInstance();