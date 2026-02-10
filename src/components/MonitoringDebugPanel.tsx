"use client"

import { useState, useEffect } from "react"
import { Bug, Activity, AlertCircle, CheckCircle, X } from "lucide-react"
import { getRecentErrors, clearRecentErrors } from "../utils/errors"

/**
 * Developer debug panel for monitoring errors and performance
 * Only shown in development mode
 */
export function MonitoringDebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [recentErrors, setRecentErrors] = useState<ReturnType<typeof getRecentErrors>>([])
  const isDev = import.meta.env.DEV

  useEffect(() => {
    return;
    if (isDev && isOpen) {
      const interval = setInterval(() => {
        setRecentErrors(getRecentErrors())
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isDev, isOpen])

  if (!isDev) {
    return null
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 z-50 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:bottom-4"
        title="Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed right-4 z-50 w-96 max-h-[600px] bg-card dark:bg-card rounded-lg shadow-2xl border border-border border-border flex flex-col bottom-[calc(11rem+env(safe-area-inset-bottom))] md:bottom-20">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border border-border">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-foreground dark:text-white">Monitoring Debug</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-accent dark:hover:bg-gray-700 rounded" aria-label="Close debug panel">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-border border-border">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground">Environment</div>
                  <div className="text-sm font-medium text-foreground dark:text-white">{import.meta.env.MODE}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <div>
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground">Recent Errors</div>
                  <div className="text-sm font-medium text-foreground dark:text-white">{recentErrors.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Errors */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground dark:text-white">Recent Errors</h4>
              {recentErrors.length > 0 && (
                <button
                  onClick={() => {
                    clearRecentErrors()
                    setRecentErrors([])
                  }}
                  className="text-xs text-purple-600 hover:text-purple-700"
                >
                  Clear
                </button>
              )}
            </div>

            {recentErrors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground dark:text-muted-foreground text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No errors logged
              </div>
            ) : (
              <div className="space-y-3">
                {recentErrors.map((entry) => (
                  <div
                    key={entry.errorId}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-destructive dark:text-red-400 truncate">
                          {entry.error.code}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-foreground dark:text-muted-foreground mb-2">{entry.error.userMessage}</p>
                    {entry.error.context && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground dark:text-muted-foreground hover:text-foreground">
                          Context
                        </summary>
                        <pre className="mt-2 p-2 bg-accent dark:bg-card rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(entry.error.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border border-border text-xs text-center text-muted-foreground dark:text-muted-foreground">
            Development Mode Only
          </div>
        </div>
      )}
    </>
  )
}
