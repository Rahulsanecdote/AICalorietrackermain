/**
 * Global Error Handlers
 * Catches unhandled promise rejections and uncaught errors
 */

import { AppError, toAppError, logError, ERROR_CODES, createAppError } from './errors';
import { notifyAppError } from './notifications';

// ============================================================================
// Unhandled Promise Rejection Handler
// ============================================================================

function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  // Prevent the default browser behavior
  event.preventDefault();

  // Convert the rejection reason to an AppError
  const appError = toAppError(event.reason, {
    type: 'unhandled_promise_rejection',
  });

  // Log the error
  logError(appError);

  config.onUnhandledRejection?.(appError);

  // Show a non-blocking notification
  notifyAppError(appError, {
    showReload: !appError.retryable,
    showManualMode: appError.code === ERROR_CODES.NETWORK_OFFLINE,
  });

  // Log to console for debugging
  console.error('[Unhandled Promise Rejection]', {
    errorId: appError.errorId,
    code: appError.code,
    message: appError.userMessage,
    retryable: appError.retryable,
    reason: event.reason,
  });
}

// ============================================================================
// Uncaught Error Handler
// ============================================================================

function handleUncaughtError(event: ErrorEvent): void {
  // Ignore certain types of errors that are handled elsewhere
  const ignoredPatterns = [
    'ResizeObserver',
    'Non-Error promise rejection',
  ];

  if (ignoredPatterns.some(pattern => event.message.includes(pattern))) {
    return;
  }

  // Create an AppError from the error event
  const appError = createAppError(
    ERROR_CODES.UNKNOWN_ERROR,
    event.message || 'An unexpected error occurred',
    true,
    event.error,
    {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }
  );

  // Log the error
  logError(appError, event.error?.stack);

  config.onUncaughtError?.(appError);

  // Show a non-blocking notification
  notifyAppError(appError, {
    showReload: true,
  });

  // Log to console for debugging
  console.error('[Uncaught Error]', {
    errorId: appError.errorId,
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
}

// ============================================================================
// Chunk Load Error Handler
// ============================================================================

interface ChunkErrorInfo extends Record<string, unknown> {
  chunkId?: string;
  moduleId?: string;
  errorId?: string;
}

let chunkErrorInfo: ChunkErrorInfo | null = null;

export function getChunkErrorInfo(): ChunkErrorInfo | null {
  return chunkErrorInfo;
}

export function clearChunkErrorInfo(): void {
  chunkErrorInfo = null;
}



// ============================================================================
// Global Error Handler Setup
// ============================================================================

interface GlobalErrorHandlersConfig {
  enabled?: boolean;
  onUnhandledRejection?: (error: AppError) => void;
  onUncaughtError?: (error: AppError) => void;
  onChunkError?: (error: Error, info: ChunkErrorInfo) => void;
}

let isSetup = false;
let config: GlobalErrorHandlersConfig = {
  enabled: true,
};

export function setupGlobalErrorHandlers(
  userConfig: GlobalErrorHandlersConfig = {}
): void {
  if (isSetup && typeof window !== 'undefined') {
    console.warn('Global error handlers already setup');
    return;
  }

  config = { ...config, ...userConfig };

  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Handle uncaught errors
    window.addEventListener('error', handleUncaughtError);

    isSetup = true;

    console.log('[Global Error Handlers] Initialized');
  }
}

export function teardownGlobalErrorHandlers(): void {
  if (typeof window !== 'undefined') {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleUncaughtError);
  }
  isSetup = false;
}

export function isGlobalErrorHandlersSetup(): boolean {
  return isSetup;
}

// ============================================================================
// Error Recovery Utilities
// ============================================================================

/**
 * Attempt to recover from an error by reloading the page
 */
export function triggerRecoveryReload(): void {
  // Clear any chunk error info
  clearChunkErrorInfo();

  // Attempt to reload
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * Attempt to recover from an error by clearing caches and reloading
 */
export async function triggerHardReload(): Promise<void> {
  // Clear chunk error info
  clearChunkErrorInfo();

  if (typeof window !== 'undefined') {
    // Try to clear service workers and caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch {
        // Ignore cache errors
      }
    }

    // Clear localStorage except for essential data
    const essentialKeys = ['settings', 'userSettings'];
    const dataToKeep: Record<string, string> = {};
    try {
      essentialKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          dataToKeep[key] = value;
        }
      });

      localStorage.clear();

      Object.entries(dataToKeep).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch {
      // If we can't access localStorage, just reload
    }

    // Clear module registry to force fresh loads
    if ('webpackChunk_N_E' in window) {
      try {
        // @ts-expect-error webpack chunk access
        window.webpackChunk_N_E.forEach((chunk: unknown[]) => {
          chunk.forEach((module: unknown) => {
            if ((module as { id?: string }).id?.includes('chunk')) {
              // Mark chunk as failed
            }
          });
        });
      } catch {
        // Ignore
      }
    }

    // Perform the reload
    window.location.reload();
  }
}

// ============================================================================
// Initialization
// ============================================================================

// Note: Global error handlers should be initialized explicitly via setupGlobalErrorHandlers()
// in the main App component to ensure proper timing with React lifecycle
