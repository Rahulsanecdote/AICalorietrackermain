/**
 * Notification Banner Component
 * Displays global notifications to users
 */

import React, { useEffect, useMemo, useState } from "react"
import {
  canHandleNotificationAction,
  getNotificationActionLabel,
  hideNotification,
  runNotificationAction,
  subscribeToNotifications,
  type NotificationAction,
  type NotificationActionType,
  type NotificationState,
  type NotificationVariant,
} from "@/utils/notifications"
import { AlertCircle, AlertTriangle, CheckCircle, Download, Info, RefreshCw, WifiOff, X } from "lucide-react"

const variantStyles: Record<
  NotificationVariant,
  { container: string; iconWrap: string; icon: string }
> = {
  error: {
    container: "border border-red-200 dark:border-red-800",
    iconWrap: "bg-destructive/20 dark:bg-red-900/30",
    icon: "text-destructive dark:text-red-400",
  },
  warning: {
    container: "border border-amber-200 dark:border-amber-700",
    iconWrap: "bg-amber-100 dark:bg-amber-900/30",
    icon: "text-amber-600 dark:text-amber-400",
  },
  success: {
    container: "border border-emerald-200 dark:border-emerald-700",
    iconWrap: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  info: {
    container: "border border-blue-200 dark:border-blue-700",
    iconWrap: "bg-blue-100 dark:bg-blue-900/30",
    icon: "text-blue-600 dark:text-blue-400",
  },
}

const variantIcons: Record<NotificationVariant, React.ElementType> = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
}

const actionIcons: Record<NotificationActionType, React.ElementType> = {
  manualMode: WifiOff,
  backup: Download,
  reload: RefreshCw,
}

const reloadVariantClasses: Record<NotificationVariant, string> = {
  error: "bg-red-600 hover:bg-red-700",
  warning: "bg-amber-600 hover:bg-amber-700",
  success: "bg-emerald-600 hover:bg-emerald-700",
  info: "bg-blue-600 hover:bg-blue-700",
}

const getActionClasses = (actionType: NotificationActionType, variant: NotificationVariant): string => {
  if (actionType === "reload") {
    return `inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors ${reloadVariantClasses[variant]}`
  }

  if (actionType === "manualMode") {
    return "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground dark:text-muted-foreground bg-accent dark:bg-card rounded-lg hover:bg-accent dark:hover:bg-gray-600 transition-colors"
  }

  return "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground dark:text-muted-foreground border border-border border-border rounded-lg hover:bg-card dark:hover:bg-gray-700 transition-colors"
}

export function ErrorBanner(): React.ReactElement | null {
  const [state, setState] = useState<NotificationState>({
    visible: false,
    message: "",
    variant: "info",
    actions: [],
  })

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(setState)
    return unsubscribe
  }, [])

  const availableActions = useMemo(
    () => state.actions.filter((action) => canHandleNotificationAction(action)),
    [state.actions]
  )

  if (!state.visible) {
    return null
  }

  const Icon = variantIcons[state.variant]
  const styles = variantStyles[state.variant]

  const handleDismiss = () => {
    hideNotification()
  }

  const handleAction = (action: NotificationAction) => {
    void runNotificationAction(action)
  }

  return (
    <div
      className="fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto animate-slide-down"
      role="alert"
      aria-live={state.variant === "error" ? "assertive" : "polite"}
    >
      <div
        className={`bg-card dark:bg-card rounded-xl shadow-lg ${styles.container} overflow-hidden`}
      >
        <div className="flex items-start gap-3 p-4">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${styles.iconWrap}`}
          >
            <Icon className={`w-5 h-5 ${styles.icon}`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground dark:text-white">{state.message}</p>

            {state.errorId && (
              <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">Error ID: {state.errorId}</p>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-accent dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
          </button>
        </div>

        {availableActions.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-4 pb-4">
            {availableActions.map((action) => {
              const ActionIcon = actionIcons[action.type]
              return (
                <button
                  key={action.type}
                  onClick={() => handleAction(action)}
                  className={getActionClasses(action.type, state.variant)}
                >
                  <ActionIcon className="w-3.5 h-3.5" />
                  {getNotificationActionLabel(action)}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorBanner
