"use client"

import { useEffect, useCallback, useRef } from "react"
import { startTransaction, measurePerformance, addBreadcrumb } from "../utils/monitoring"

/**
 * Hook to measure component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0)
  const mountTime = useRef<number>(Date.now())

  useEffect(() => {
    renderCount.current += 1

    // Log slow initial render (>500ms)
    if (renderCount.current === 1) {
      const renderTime = Date.now() - mountTime.current
      if (renderTime > 500) {
        addBreadcrumb(`Slow render: ${componentName}`, "performance", "warning", {
          renderTime,
          componentName,
        })
      }
    }

    return () => {
      // Component unmounted
      if (renderCount.current > 0) {
        addBreadcrumb(`Component unmounted: ${componentName}`, "lifecycle", "info", {
          totalRenders: renderCount.current,
        })
      }
    }
  }, [componentName])

  return renderCount.current
}

/**
 * Hook to measure async operation performance
 */
export function usePerformanceTracker() {
  const track = useCallback(async <T,>(operationName: string, operation: () => Promise<T>): Promise<T> => {
    return measurePerformance(operationName, operation)
  }, [])

  return { track }
}

/**
 * Hook to track API call performance
 */
export function useAPIPerformance(apiName: string) {
  const callCount = useRef(0)
  const totalTime = useRef(0)

  const trackCall = useCallback(
    async <T,>(apiCall: () => Promise<T>): Promise<T> => {
      const startTime = Date.now()
      callCount.current += 1

      try {
        const result = await apiCall()
        const duration = Date.now() - startTime
        totalTime.current += duration

        // Log slow API calls (>2s)
        if (duration > 2000) {
          addBreadcrumb(`Slow API call: ${apiName}`, "http", "warning", {
            duration,
            apiName,
            callCount: callCount.current,
          })
        }

        return result
      } catch (error) {
        const duration = Date.now() - startTime
        addBreadcrumb(`Failed API call: ${apiName}`, "http", "error", {
          duration,
          apiName,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    [apiName],
  )

  return {
    trackCall,
    getStats: () => ({
      callCount: callCount.current,
      averageTime: callCount.current > 0 ? totalTime.current / callCount.current : 0,
    }),
  }
}

/**
 * Hook to measure user interaction latency
 */
export function useInteractionTracking(interactionName: string) {
  const trackInteraction = useCallback(
    async <T,>(action: () => Promise<T> | T): Promise<T> => {
      const transaction = startTransaction(`interaction.${interactionName}`, "user")
      const startTime = Date.now()

      try {
        const result = await action()
        const duration = Date.now() - startTime

        transaction?.setStatus("ok")
        transaction?.setData("duration", duration)

        // Log slow interactions (>300ms feels laggy)
        if (duration > 300) {
          addBreadcrumb(`Slow interaction: ${interactionName}`, "ui", "warning", {
            duration,
            interactionName,
          })
        }

        return result
      } catch (error) {
        transaction?.setStatus("internal_error")
        throw error
      } finally {
        transaction?.finish()
      }
    },
    [interactionName],
  )

  return { trackInteraction }
}
