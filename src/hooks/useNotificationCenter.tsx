import * as React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCheck,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  subscribeToNotifications,
  type NotificationState,
  type NotificationVariant,
} from '@/utils/notifications';
import type { AppNotification } from '@/components/ui/notifications-panel';

interface NotificationCenterState {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const variantIconMap: Record<NotificationVariant, React.ReactNode> = {
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  success: <CheckCheck className="h-4 w-4 text-primary" />,
  info: <Info className="h-4 w-4 text-muted-foreground" />,
};

const variantTitleMap: Record<NotificationVariant, string> = {
  error: 'System Alert',
  warning: 'Attention Needed',
  success: 'Update Completed',
  info: 'Notification',
};

// Placeholder list for environments that do not yet persist a notification feed.
export const demoNotifications: AppNotification[] = [
  {
    id: 'demo-insights-refresh',
    title: 'Insights refreshed',
    description: 'New recommendations are ready for your current nutrition trend.',
    createdAt: new Date(Date.now() - 8 * 60 * 1000),
    read: false,
    icon: <Sparkles className="h-4 w-4 text-primary" />,
  },
  {
    id: 'demo-meal-plan',
    title: 'Meal plan generated',
    description: 'Your weekly meal plan draft is available in Meal Prep.',
    createdAt: new Date(Date.now() - 55 * 60 * 1000),
    read: true,
    icon: <CheckCheck className="h-4 w-4 text-emerald-500" />,
  },
];

const createNotificationId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const mapStateToNotification = (state: NotificationState): AppNotification => ({
  id: state.errorId ? `${state.errorId}-${Date.now()}` : createNotificationId(),
  title: variantTitleMap[state.variant],
  description: state.message,
  createdAt: new Date(),
  read: false,
  icon: variantIconMap[state.variant],
});

export function useNotificationCenter(initial: AppNotification[] = demoNotifications): NotificationCenterState {
  const [notifications, setNotifications] = React.useState<AppNotification[]>(initial);
  const lastMessageRef = React.useRef<{ key: string; timestamp: number } | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToNotifications((state) => {
      if (!state.visible || !state.message) return;

      const dedupeKey = `${state.variant}:${state.errorId ?? ''}:${state.message}`;
      const now = Date.now();
      const last = lastMessageRef.current;
      if (last && last.key === dedupeKey && now - last.timestamp < 1200) {
        return;
      }
      lastMessageRef.current = { key: dedupeKey, timestamp: now };

      setNotifications((prev) => [mapStateToNotification(state), ...prev]);
    });

    return unsubscribe;
  }, []);

  const unreadCount = React.useMemo(
    () => notifications.reduce((count, item) => (item.read ? count : count + 1), 0),
    [notifications]
  );

  const markAsRead = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const markAllAsRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((item) => (item.read ? item : { ...item, read: true })));
  }, []);

  const clearAll = React.useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
