import { monitoringService } from "./monitoring"
import { getAIHealth } from "./aiClient"

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  version: string
  checks: {
    api: HealthStatus
    storage: HealthStatus
    performance: HealthStatus
  }
  uptime: number
  environment: string
}

interface HealthStatus {
  status: "pass" | "warn" | "fail"
  message: string
  responseTime?: number
}

class HealthCheckService {
  private startTime = Date.now()

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.all([this.checkAPI(), this.checkStorage(), this.checkPerformance()])

    const [api, storage, performance] = checks

    const status = this.determineOverallStatus([api, storage, performance])

    return {
      status,
      timestamp: new Date().toISOString(),
      version: import.meta.env.VITE_APP_VERSION || "1.0.0",
      checks: { api, storage, performance },
      uptime: Date.now() - this.startTime,
      environment: import.meta.env.VITE_APP_ENV || "development",
    }
  }

  private async checkAPI(): Promise<HealthStatus> {
    const start = performance.now()

    try {
      // Test AI proxy endpoint with a minimal request
      const response = await getAIHealth({
        signal: AbortSignal.timeout(5000),
      })

      const responseTime = performance.now() - start

      if (response.ok) {
        return {
          status: responseTime < 1000 ? "pass" : "warn",
          message: responseTime < 1000 ? "API responding normally" : "API responding slowly",
          responseTime,
        }
      }

      const message =
        response.status === 503
          ? "AI proxy is running but missing server configuration"
          : `AI proxy returned status ${response.status}`

      return {
        status: "warn",
        message,
        responseTime,
      }
    } catch (error) {
      const responseTime = performance.now() - start
      monitoringService.captureException(error as Error, {
        context: "health_check",
        check: "api",
      })

      return {
        status: "fail",
        message: error instanceof Error ? error.message : "API check failed",
        responseTime,
      }
    }
  }

  private async checkStorage(): Promise<HealthStatus> {
    const start = performance.now()

    try {
      const testKey = "_health_check_test"
      const testValue = Date.now().toString()

      // Test localStorage read/write
      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)

      const responseTime = performance.now() - start

      if (retrieved === testValue) {
        return {
          status: "pass",
          message: "Storage functioning normally",
          responseTime,
        }
      }

      return {
        status: "fail",
        message: "Storage read/write mismatch",
        responseTime,
      }
    } catch (error) {
      const responseTime = performance.now() - start
      monitoringService.captureException(error as Error, {
        context: "health_check",
        check: "storage",
      })

      return {
        status: "fail",
        message: error instanceof Error ? error.message : "Storage check failed",
        responseTime,
      }
    }
  }

  private async checkPerformance(): Promise<HealthStatus> {
    try {
      const memory = (performance as any).memory
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming

      const metrics = {
        usedJSHeapSize: memory?.usedJSHeapSize || 0,
        totalJSHeapSize: memory?.totalJSHeapSize || 0,
        domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
      }

      const memoryUsagePercent =
        metrics.totalJSHeapSize > 0 ? (metrics.usedJSHeapSize / metrics.totalJSHeapSize) * 100 : 0

      if (memoryUsagePercent > 90) {
        return {
          status: "fail",
          message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        }
      }

      if (memoryUsagePercent > 75) {
        return {
          status: "warn",
          message: `Elevated memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        }
      }

      return {
        status: "pass",
        message: "Performance metrics within acceptable range",
      }
    } catch (error) {
      return {
        status: "warn",
        message: "Performance metrics unavailable",
      }
    }
  }

  private determineOverallStatus(checks: HealthStatus[]): "healthy" | "degraded" | "unhealthy" {
    const hasFailed = checks.some((c) => c.status === "fail")
    const hasWarning = checks.some((c) => c.status === "warn")

    if (hasFailed) return "unhealthy"
    if (hasWarning) return "degraded"
    return "healthy"
  }
}

export const healthCheckService = new HealthCheckService()

// Expose health check endpoint for monitoring
if (typeof window !== "undefined") {
  ;(window as any).__healthCheck = () => healthCheckService.performHealthCheck()
}
