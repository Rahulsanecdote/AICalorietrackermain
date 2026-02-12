import { useState } from 'react';
import { Settings, Flame, RefreshCw, ArrowRightLeft, Mic2, LogOut } from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import { LanguageSwitcher } from './features/LanguageSwitcher';
import GlowMenuNav from './ui/glow-menu-nav';
import {
  NotificationsBell,
  NotificationsPanel,
} from './ui/notifications-panel';
import { useNotificationCenter } from '../hooks/useNotificationCenter';
import type { ActiveView } from '../types';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenUtilities: () => void;
  onOpenVoice: () => void;
  onOpenCompare: () => void;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  userEmail?: string | null;
  onSignOut?: () => void;
}

export default function Header({
  onOpenSettings,
  onOpenUtilities,
  onOpenVoice,
  onOpenCompare,
  activeView,
  onViewChange,
  userEmail,
  onSignOut,
}: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotificationCenter();

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Branding Section */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex-shrink-0">
                <Flame className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-shrink-0 hidden sm:block">
                <h1 className="text-xl font-bold text-foreground leading-none">NutriAI</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Smart Calorie Tracker</p>
              </div>
              <div className="block sm:hidden">
                <h1 className="text-lg font-bold text-foreground leading-none">NutriAI</h1>
              </div>
            </div>

            {/* Action Buttons - Properly spaced */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Voice Button - Compact and non-overlapping */}
              <button
                onClick={onOpenVoice}
                className="flex items-center gap-1 px-3 py-2 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors"
                title="Voice Input"
                aria-label="Voice Input"
              >
                <Mic2 className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive hidden xs:inline">Voice</span>
              </button>

              {/* Secondary Actions - Icons only to save space */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={onOpenCompare}
                  className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors hover:text-foreground"
                  title="Compare Foods"
                  aria-label="Compare Foods"
                >
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                </button>

                <button
                  onClick={onOpenUtilities}
                  className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors hover:text-foreground"
                  title="Utilities"
                  aria-label="Utilities"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <NotificationsBell
                  unreadCount={unreadCount}
                  onOpen={() => setIsNotificationsOpen(true)}
                  title="Open notifications"
                />

                <ThemeToggle />

                <LanguageSwitcher variant="icon" />

                {onSignOut ? (
                  <button
                    onClick={onSignOut}
                    className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors hover:text-foreground"
                    title={userEmail ? `Sign out (${userEmail})` : "Sign out"}
                    aria-label={userEmail ? `Sign out (${userEmail})` : "Sign out"}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : null}

                <button
                  onClick={onOpenSettings}
                  className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors hover:text-foreground"
                  title="Settings"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <GlowMenuNav activeView={activeView} onViewChange={onViewChange} />
          </div>
        </div>
      </header>

      <NotificationsPanel
        open={isNotificationsOpen}
        onOpenChange={setIsNotificationsOpen}
        notifications={notifications}
        onMarkRead={markAsRead}
        onMarkAllRead={markAllAsRead}
        onClearAll={clearAll}
      />
    </>
  );
}
