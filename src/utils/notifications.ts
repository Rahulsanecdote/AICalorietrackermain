import type { AppError } from "./errors"
import { downloadDataExport } from "./errorRecovery"

export type NotificationVariant = "error" | "warning" | "success" | "info"

export type NotificationActionType = "manualMode" | "backup" | "reload"

export type NotificationActionHandler = () => void | Promise<void>

export interface NotificationAction {
  type: NotificationActionType
  label?: string
  handler?: NotificationActionHandler
}

export interface NotificationState {
  visible: boolean
  message: string
  variant: NotificationVariant
  errorId?: string
  actions: NotificationAction[]
  autoDismissMs?: number | null
}

export interface NotificationOptions {
  message: string
  variant?: NotificationVariant
  errorId?: string
  actions?: NotificationAction[]
  autoDismissMs?: number
}

export interface ErrorNotificationOptions {
  errorId?: string
  showReload?: boolean
  showManualMode?: boolean
  includeBackup?: boolean
  actions?: NotificationAction[]
  onManualMode?: NotificationActionHandler
  onReload?: NotificationActionHandler
  autoDismissMs?: number
}

export const NOTIFICATION_ACTION_LABELS: Record<NotificationActionType, string> = {
  manualMode: "Manual Mode",
  backup: "Backup Data",
  reload: "Reload",
}

const DEFAULT_STATE: NotificationState = {
  visible: false,
  message: "",
  variant: "info",
  actions: [],
  autoDismissMs: null,
}

const DEFAULT_SUCCESS_DISMISS_MS = 4000
const DEFAULT_INFO_DISMISS_MS = 4000
const DEFAULT_WARNING_DISMISS_MS = 6000

let currentState: NotificationState = { ...DEFAULT_STATE }
const listeners: Set<(state: NotificationState) => void> = new Set()
let dismissTimer: ReturnType<typeof setTimeout> | null = null

type ActionHandlerMap = Partial<Record<NotificationActionType, NotificationActionHandler>>
let actionHandlers: ActionHandlerMap = {}

const clearDismissTimer = () => {
  if (dismissTimer) {
    clearTimeout(dismissTimer)
    dismissTimer = null
  }
}

const emitState = () => {
  listeners.forEach((listener) => listener(currentState))
}

export function subscribeToNotifications(listener: (state: NotificationState) => void): () => void {
  listeners.add(listener)
  listener(currentState)
  return () => listeners.delete(listener)
}

export function hideNotification(): void {
  clearDismissTimer()
  currentState = { ...DEFAULT_STATE }
  emitState()
}

export function showNotification(options: NotificationOptions): void {
  clearDismissTimer()

  currentState = {
    ...DEFAULT_STATE,
    visible: true,
    message: options.message,
    variant: options.variant ?? "info",
    errorId: options.errorId,
    actions: options.actions ?? [],
    autoDismissMs: options.autoDismissMs ?? null,
  }

  emitState()

  if (currentState.autoDismissMs && currentState.autoDismissMs > 0) {
    dismissTimer = setTimeout(() => {
      hideNotification()
    }, currentState.autoDismissMs)
  }
}

type NotificationOverrides = Omit<NotificationOptions, "message" | "variant">

export function notifySuccess(message: string, overrides: NotificationOverrides = {}): void {
  showNotification({
    message,
    variant: "success",
    autoDismissMs: overrides.autoDismissMs ?? DEFAULT_SUCCESS_DISMISS_MS,
    ...overrides,
  })
}

export function notifyInfo(message: string, overrides: NotificationOverrides = {}): void {
  showNotification({
    message,
    variant: "info",
    autoDismissMs: overrides.autoDismissMs ?? DEFAULT_INFO_DISMISS_MS,
    ...overrides,
  })
}

export function notifyWarning(message: string, overrides: NotificationOverrides = {}): void {
  showNotification({
    message,
    variant: "warning",
    autoDismissMs: overrides.autoDismissMs ?? DEFAULT_WARNING_DISMISS_MS,
    ...overrides,
  })
}

export function notifyError(message: string, overrides: NotificationOverrides = {}): void {
  showNotification({
    message,
    variant: "error",
    ...overrides,
  })
}

export function notifyAppError(appError: AppError, options: ErrorNotificationOptions = {}): void {
  const actions: NotificationAction[] = [...(options.actions ?? [])]

  if (options.showManualMode) {
    actions.push({
      type: "manualMode",
      label: NOTIFICATION_ACTION_LABELS.manualMode,
      handler: options.onManualMode,
    })
  }

  if (options.includeBackup ?? true) {
    actions.push({
      type: "backup",
      label: NOTIFICATION_ACTION_LABELS.backup,
    })
  }

  if (options.showReload) {
    actions.push({
      type: "reload",
      label: NOTIFICATION_ACTION_LABELS.reload,
      handler: options.onReload,
    })
  }

  showNotification({
    message: appError.userMessage,
    variant: "error",
    errorId: options.errorId ?? appError.errorId,
    actions,
    autoDismissMs: options.autoDismissMs,
  })
}

export function getNotificationActionLabel(action: NotificationAction): string {
  return action.label ?? NOTIFICATION_ACTION_LABELS[action.type]
}

export function configureNotificationActions(handlers: ActionHandlerMap): void {
  actionHandlers = { ...actionHandlers, ...handlers }
}

export function canHandleNotificationAction(action: NotificationAction): boolean {
  if (action.handler) return true
  if (actionHandlers[action.type]) return true
  return action.type === "reload" && typeof window !== "undefined"
}

export async function runNotificationAction(action: NotificationAction): Promise<void> {
  hideNotification()

  const handler = action.handler ?? actionHandlers[action.type]
  if (!handler) {
    if (action.type === "reload" && typeof window !== "undefined") {
      window.location.reload()
    }
    return
  }

  try {
    await handler()
  } catch (error) {
    console.error("[Notifications] Action failed", error)
    notifyError("Action failed. Please try again.")
  }
}

export function handleBackupDownload(): void {
  const success = downloadDataExport()

  if (!success) {
    notifyError("Failed to export data. Please try again.")
    return
  }

  notifySuccess("Backup downloaded.")
}

actionHandlers = {
  backup: handleBackupDownload,
}
