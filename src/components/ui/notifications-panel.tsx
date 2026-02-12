'use client';

import * as React from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export type AppNotification = {
  id: string;
  title: string;
  description?: string;
  createdAt: string | Date;
  read: boolean;
  href?: string;
  icon?: React.ReactNode;
};

const formatRelativeTime = (dateValue: string | Date): string => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const deltaMs = Date.now() - date.getTime();
  const minutes = Math.floor(deltaMs / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

interface NotificationsBellProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  unreadCount: number;
  onOpen: () => void;
}

export function NotificationsBell({
  unreadCount,
  onOpen,
  className,
  ...props
}: NotificationsBellProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background/45 text-muted-foreground backdrop-blur-xl',
        'shadow-[0_10px_24px_hsl(var(--foreground)/0.11),inset_0_1px_0_hsl(var(--foreground)/0.08)]',
        'transition-all duration-200 hover:text-foreground hover:bg-background/65 hover:brightness-110',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'supports-[selector(:focus-visible)]:focus-visible:scale-[1.02] md:hover:scale-[1.03]',
        className
      )}
      {...props}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 ? (
        <span
          className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border border-background bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
          aria-hidden
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </button>
  );
}

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll?: () => void;
}

type SheetSide = 'right' | 'bottom';

const useResponsiveSheetSide = (): SheetSide => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const query = window.matchMedia('(max-width: 767px)');
    const sync = (matches: boolean) => setIsMobile(matches);
    sync(query.matches);

    const listener = (event: MediaQueryListEvent) => sync(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  return isMobile ? 'bottom' : 'right';
};

export function NotificationsPanel({
  open,
  onOpenChange,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
}: NotificationsPanelProps) {
  const side = useResponsiveSheetSide();
  const unreadCount = React.useMemo(
    () => notifications.reduce((count, item) => (item.read ? count : count + 1), 0),
    [notifications]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          'p-0 border-border/40 bg-background/65 supports-[backdrop-filter]:bg-background/45 backdrop-blur-2xl',
          'shadow-[0_24px_54px_hsl(var(--foreground)/0.23),inset_0_1px_0_hsl(var(--foreground)/0.14)]',
          side === 'right' &&
            'w-[min(92vw,410px)] sm:max-w-[410px] rounded-l-3xl border-y border-l border-r-0 mr-4 my-4 h-[calc(100vh-2rem)]',
          side === 'bottom' &&
            'h-[min(74vh,620px)] rounded-t-3xl border-x border-t border-b-0 px-0 pb-0'
        )}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-[inherit]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-foreground/[0.08] via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/45 via-background/20 to-transparent" />

          {side === 'bottom' ? (
            <div className="relative flex justify-center pt-3">
              <span className="h-1 w-12 rounded-full bg-muted-foreground/45" aria-hidden />
            </div>
          ) : null}

          <SheetHeader className="relative border-b border-border/45 p-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-base">Notifications</SheetTitle>
                <SheetDescription className="mt-1">
                  {unreadCount > 0
                    ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}`
                    : 'Everything is up to date'}
                </SheetDescription>
              </div>
              <div className="rounded-full border border-border/40 bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {notifications.length}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMarkAllRead}
                disabled={notifications.length === 0 || unreadCount === 0}
                className="h-8 rounded-full border-border/55 bg-background/45 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/35"
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Mark all read
              </Button>
              {onClearAll ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  disabled={notifications.length === 0}
                  className="h-8 rounded-full border border-border/45 bg-background/40 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/35"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Clear all
                </Button>
              ) : null}
            </div>
          </SheetHeader>

          <div
            className="relative flex-1 overflow-y-auto p-4"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            {notifications.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/55 bg-background/35 p-8 text-center">
                <Bell className="mb-3 h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">No notifications</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Alerts and activity updates will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {notifications.map((notification) => (
                  <li key={notification.id} className="group flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onMarkRead(notification.id);
                        if (notification.href && typeof window !== 'undefined') {
                          window.location.href = notification.href;
                        }
                      }}
                      className={cn(
                        'relative flex-1 rounded-xl border p-3 text-left transition-all duration-200',
                        'hover:bg-muted/30 hover:border-border/65 hover:shadow-[0_10px_22px_hsl(var(--foreground)/0.11)]',
                        notification.read
                          ? 'border-border/40 bg-background/32'
                          : 'border-border/65 bg-background/68'
                      )}
                      aria-label={`${notification.title}${notification.read ? '' : ', unread'}`}
                    >
                      {!notification.read ? (
                        <span className="absolute left-0 top-3 h-6 w-1 rounded-r-full bg-primary/75" aria-hidden />
                      ) : null}
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/55',
                            notification.read ? 'bg-background/35' : 'bg-primary/15 text-primary'
                          )}
                        >
                          {notification.icon ?? <Info className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              'text-sm leading-snug',
                              notification.read ? 'text-foreground/90' : 'font-medium text-foreground'
                            )}
                          >
                            {notification.title}
                          </p>
                          {notification.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {notification.description}
                            </p>
                          ) : null}
                          <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground/90">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onMarkRead(notification.id)}
                      disabled={notification.read}
                      className={cn(
                        'h-9 w-9 shrink-0 rounded-full border border-border/40 bg-background/40 text-muted-foreground',
                        'transition-all hover:text-foreground hover:bg-muted/35',
                        'disabled:opacity-45'
                      )}
                      aria-label={
                        notification.read
                          ? `${notification.title} is already read`
                          : `Mark ${notification.title} as read`
                      }
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
