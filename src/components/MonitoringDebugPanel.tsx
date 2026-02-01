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
        className="fixed bottom-4 right-4 z-50 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Monitoring Debug</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Environment</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{import.meta.env.MODE}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Recent Errors</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{recentErrors.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Errors */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Recent Errors</h4>
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
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
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
                        <div className="text-xs font-mono text-red-600 dark:text-red-400 truncate">
                          {entry.error.code}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{entry.error.userMessage}</p>
                    {entry.error.context && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800">
                          Context
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-32">
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
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-center text-gray-500 dark:text-gray-400">
            Development Mode Only
          </div>
        </div>
      )}
    </>
  )
}
