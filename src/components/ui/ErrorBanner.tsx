/**
 * Error Banner Component
 * Displays non-blocking error notifications to users
 */

import React, { useState, useEffect, useCallback } from 'react';
import { subscribeToErrorBanner, hideErrorBanner, type ErrorBannerState } from '../../utils/globalErrorHandlers';
import { RefreshCw, AlertCircle, X, Download, WifiOff } from 'lucide-react';

interface ErrorBannerProps {
  onManualMode?: () => void;
  onReload?: () => void;
}

export function ErrorBanner({ onManualMode, onReload }: ErrorBannerProps): React.ReactElement | null {
  const [state, setState] = useState<ErrorBannerState>({
    visible: false,
    message: '',
    showReload: false,
    showManualMode: false,
  });

  useEffect(() => {
    const unsubscribe = subscribeToErrorBanner(setState);
    return unsubscribe;
  }, []);

  if (!state.visible) {
    return null;
  }

  const handleDismiss = () => {
    hideErrorBanner();
  };

  const handleManualMode = () => {
    hideErrorBanner();
    onManualMode?.();
  };

  const handleReload = () => {
    hideErrorBanner();
    onReload?.();
    // Default reload behavior
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleDownload = () => {
    // Import dynamically to avoid circular dependencies
    import('../../utils/globalErrorHandlers').then(({ downloadRecoveryData }) => {
      downloadRecoveryData();
    });
  };

  return (
    <div
      className="fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto animate-slide-down"
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-200 dark:border-red-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {state.message}
            </p>
            
            {state.errorId && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Error ID: {state.errorId}
              </p>
            )}
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 pb-4">
          {state.showManualMode && (
            <button
              onClick={handleManualMode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <WifiOff className="w-3.5 h-3.5" />
              Manual Mode
            </button>
          )}
          
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Backup Data
          </button>
          
          {state.showReload && (
            <button
              onClick={handleReload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorBanner;
