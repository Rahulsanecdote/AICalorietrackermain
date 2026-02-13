import { useState } from 'react';
import { Settings, Flame, RefreshCw, ArrowRightLeft, Mic2, LogOut } from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import { LanguageSwitcher } from './features/LanguageSwitcher';
import GlowMenuNav from './ui/glow-menu-nav';
import {
  NotificationsBell,
  NotificationsPanel,
} from './ui/notifications-panel';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
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

interface IconTooltipProps {
  label: string;
  children: React.ReactNode;
}

function IconTooltip({ label, children }: IconTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={10}
        className="rounded-full border-border/60 bg-background/90 px-2.5 py-1 text-xs text-foreground backdrop-blur-lg"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
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

  const iconGlassButtonClass =
    'relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background/45 text-muted-foreground backdrop-blur-xl shadow-[0_10px_24px_hsl(var(--foreground)/0.11),inset_0_1px_0_hsl(var(--foreground)/0.08)] transition-all duration-200 hover:text-foreground hover:bg-background/65 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hover:scale-[1.03]';

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
            <div className="flex items-center justify-end gap-1 sm:flex-shrink-0">
              <TooltipProvider delayDuration={120}>
                <div className="flex max-w-full items-center gap-0.5 overflow-x-auto pb-1 pr-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <IconTooltip label="Voice Input">
                    <button
                      onClick={onOpenVoice}
                      className={`${iconGlassButtonClass} border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20`}
                      aria-label="Voice Input"
                    >
                      <Mic2 className="w-4 h-4" />
                    </button>
                  </IconTooltip>

                  <IconTooltip label="Compare Foods">
                    <button
                      onClick={onOpenCompare}
                      className={iconGlassButtonClass}
                      aria-label="Compare Foods"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-primary" />
                    </button>
                  </IconTooltip>

                  <IconTooltip label="Utilities">
                    <button
                      onClick={onOpenUtilities}
                      className={iconGlassButtonClass}
                      aria-label="Utilities"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </IconTooltip>

                  <IconTooltip label="Notifications">
                    <span className="inline-flex">
                      <NotificationsBell
                        unreadCount={unreadCount}
                        onOpen={() => setIsNotificationsOpen(true)}
                      />
                    </span>
                  </IconTooltip>

                  <IconTooltip label="Theme">
                    <span className="inline-flex">
                      <ThemeToggle />
                    </span>
                  </IconTooltip>

                  <IconTooltip label="Language">
                    <span className="inline-flex">
                      <LanguageSwitcher variant="icon" iconTriggerClassName={iconGlassButtonClass} />
                    </span>
                  </IconTooltip>

                  {onSignOut ? (
                    <IconTooltip label={userEmail ? `Sign out (${userEmail})` : 'Sign out'}>
                      <button
                        onClick={onSignOut}
                        className={iconGlassButtonClass}
                        aria-label={userEmail ? `Sign out (${userEmail})` : "Sign out"}
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </IconTooltip>
                  ) : null}

                  <IconTooltip label="Settings">
                    <button
                      onClick={onOpenSettings}
                      className={iconGlassButtonClass}
                      aria-label="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </IconTooltip>
                </div>
              </TooltipProvider>
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
