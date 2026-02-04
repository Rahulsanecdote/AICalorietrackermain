"use client"

/**
 * Feature Error Boundaries
 * Wrappers for specific features to enable graceful degradation
 */

import type { ReactNode } from "react"
import { AlertTriangle, RefreshCw, Utensils, FileText, BarChart3, Brain, Plus, Activity, Sparkles } from "lucide-react"
import { FeatureErrorBoundary } from "../ErrorBoundary"

// ============================================================================
// Types
// ============================================================================



// ============================================================================
// Meal Planner Boundary
// ============================================================================

interface MealPlannerBoundaryProps {
  children: ReactNode
  onManualMode?: () => void
}

export function MealPlannerBoundary({ children, onManualMode }: MealPlannerBoundaryProps): ReactNode {
  return (
    <FeatureErrorBoundary
      featureName="Meal Planner"
      onError={(error) => console.error("Meal Planner error:", error)}
      fallback={({ error, reset }) => <MealPlannerFallback error={error} onReset={reset} onManualMode={onManualMode} />}
    >
      {children}
    </FeatureErrorBoundary>
  )
}

interface MealPlannerFallbackProps {
  error: Error | null
  onReset: () => void
  onManualMode?: () => void
}

function MealPlannerFallback({ error, onReset, onManualMode }: MealPlannerFallbackProps): ReactNode {
  return (
    <div className="border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
          <Utensils className="w-6 h-6 text-amber-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-amber-800 mb-1">Meal Planner unavailable</h3>
          <p className="text-sm text-amber-700 mb-4">
            The meal planning feature encountered an error. You can continue tracking meals manually.
          </p>

          {error && (
            <details className="mb-4">
              <summary className="text-xs text-amber-600 cursor-pointer hover:text-amber-800">
                Show error details
              </summary>
              <pre className="mt-2 text-xs text-amber-600 font-mono overflow-auto max-h-24 whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={onManualMode}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Meal Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Analytics Boundary
// ============================================================================

interface AnalyticsBoundaryProps {
  children: ReactNode
  onRawView?: () => void
}

export function AnalyticsBoundary({ children, onRawView }: AnalyticsBoundaryProps): ReactNode {
  return (
    <FeatureErrorBoundary
      featureName="Analytics"
      onError={(error) => console.error("Analytics error:", error)}
      fallback={({ error, reset }) => <AnalyticsFallback error={error} onReset={reset} onRawView={onRawView} />}
    >
      {children}
    </FeatureErrorBoundary>
  )
}

interface AnalyticsFallbackProps {
  error: Error | null
  onReset: () => void
  onRawView?: () => void
}

function AnalyticsFallback({ error, onReset, onRawView }: AnalyticsFallbackProps): ReactNode {
  return (
    <div className="border-2 border-dashed border-red-200 bg-red-50 rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-destructive" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-800 mb-1">Analytics unavailable</h3>
          <p className="text-sm text-destructive mb-4">
            Charts and reports couldn't be loaded. View your raw data instead.
          </p>

          {error && (
            <details className="mb-4">
              <summary className="text-xs text-destructive cursor-pointer hover:text-red-800">Show error details</summary>
              <pre className="mt-2 text-xs text-destructive font-mono overflow-auto max-h-24 whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-800 bg-destructive/20 rounded-lg hover:bg-red-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={onRawView}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              View Raw Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// AI Features Boundary
// ============================================================================

interface AIFeaturesBoundaryProps {
  children: ReactNode
  onManualInput?: () => void
}

export function AIFeaturesBoundary({ children, onManualInput }: AIFeaturesBoundaryProps): ReactNode {
  return (
    <FeatureErrorBoundary
      featureName="AI Features"
      onError={(error) => console.error("AI Features error:", error)}
      fallback={({ error, reset }) => (
        <AIFeaturesFallback error={error} onReset={reset} onManualInput={onManualInput} />
      )}
    >
      {children}
    </FeatureErrorBoundary>
  )
}

interface AIFeaturesFallbackProps {
  error: Error | null
  onReset: () => void
  onManualInput?: () => void
}

function AIFeaturesFallback({ error, onReset, onManualInput }: AIFeaturesFallbackProps): ReactNode {
  return (
    <div className="border-2 border-dashed border-purple-200 bg-purple-50 rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <Brain className="w-6 h-6 text-purple-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-purple-800 mb-1">AI features unavailable</h3>
          <p className="text-sm text-purple-700 mb-4">
            The AI service is experiencing issues. You can still log meals manually.
          </p>

          {error && (
            <details className="mb-4">
              <summary className="text-xs text-purple-600 cursor-pointer hover:text-purple-800">
                Show error details
              </summary>
              <pre className="mt-2 text-xs text-purple-600 font-mono overflow-auto max-h-24 whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-800 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={onManualInput}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Manual Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Voice Input Boundary
// ============================================================================

interface VoiceInputBoundaryProps {
  children: ReactNode
  onManualToggle?: () => void
}

export function VoiceInputBoundary({ children, onManualToggle }: VoiceInputBoundaryProps): ReactNode {
  return (
    <FeatureErrorBoundary
      featureName="Voice Input"
      onError={(error) => console.error("Voice Input error:", error)}
      fallback={({ error, reset }) => (
        <VoiceInputFallback error={error} onReset={reset} onManualToggle={onManualToggle} />
      )}
    >
      {children}
    </FeatureErrorBoundary>
  )
}

interface VoiceInputFallbackProps {
  error: Error | null
  onReset: () => void
  onManualToggle?: () => void
}

function VoiceInputFallback({ onReset, onManualToggle }: VoiceInputFallbackProps): ReactNode {
  return (
    <div className="border-2 border-dashed border-orange-200 bg-orange-50 rounded-lg p-4 my-2">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-orange-800">Voice input unavailable</p>
          <p className="text-xs text-orange-700">Use manual entry to log your meal</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="p-2 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
            aria-label="Retry voice input"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onManualToggle}
            className="px-3 py-1.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Manual
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Shopping List Boundary
// ============================================================================

interface ShoppingListBoundaryProps {
  children: ReactNode
}

export function ShoppingListBoundary({ children }: ShoppingListBoundaryProps): ReactNode {
  return (
    <FeatureErrorBoundary
      featureName="Shopping List"
      onError={(error) => console.error("Shopping List error:", error)}
      fallback={({ error, reset }) => <ShoppingListFallback error={error} onReset={reset} />}
    >
      {children}
    </FeatureErrorBoundary>
  )
}

interface ShoppingListFallbackProps {
  error: Error | null
  onReset: () => void
}

function ShoppingListFallback({ onReset }: ShoppingListFallbackProps): ReactNode {
  return (
    <div className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-blue-800 mb-1">Shopping List unavailable</h3>
          <p className="text-sm text-blue-700 mb-4">Could not load your shopping list. Your saved meals are safe.</p>

          <div className="flex gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-800 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Settings Boundary
// ============================================================================

interface SettingsBoundaryProps {
  children: ReactNode
}

export function SettingsBoundary({ children }: SettingsBoundaryProps): ReactNode {
  return (
    <FeatureErrorBoundary
      featureName="Settings"
      onError={(error) => console.error("Settings error:", error)}
      fallback={({ error, reset }) => <SettingsFallback error={error} onReset={reset} />}
    >
      {children}
    </FeatureErrorBoundary>
  )
}

interface SettingsFallbackProps {
  error: Error | null
  onReset: () => void
}

function SettingsFallback({ error, onReset }: SettingsFallbackProps): ReactNode {
  return (
    <div className="border-2 border-dashed border-border bg-card rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-accent rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-muted-foreground" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-foreground mb-1">Settings unavailable</h3>
          <p className="text-sm text-foreground mb-4">
            Could not load settings. Your current configuration is preserved.
          </p>

          {error && (
            <details className="mb-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Show error details</summary>
              <pre className="mt-2 text-xs text-muted-foreground font-mono overflow-auto max-h-24 whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}

          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-accent rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Lifestyle Dashboard Boundary
// ============================================================================

interface LifestyleBoundaryProps {
  children: ReactNode
  onBasicView?: () => void
}

export function LifestyleBoundary({ children, onBasicView }: LifestyleBoundaryProps): ReactNode {
  return (
    <FeatureErrorBoundary
      featureName="Lifestyle Dashboard"
      onError={(error) => console.error("Lifestyle Dashboard error:", error)}
      fallback={({ error, reset }) => <LifestyleFallback error={error} onReset={reset} onBasicView={onBasicView} />}
    >
      {children}
    </FeatureErrorBoundary>
  )
}

interface LifestyleFallbackProps {
  error: Error | null
  onReset: () => void
  onBasicView?: () => void
}

function LifestyleFallback({ error, onReset, onBasicView }: LifestyleFallbackProps): ReactNode {
  return (
    <div className="border-2 border-dashed border-emerald-200 bg-emerald-50 rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
          <Activity className="w-6 h-6 text-emerald-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-emerald-800 mb-1">Lifestyle Dashboard unavailable</h3>
          <p className="text-sm text-emerald-700 mb-4">
            The lifestyle tracking features encountered an error. You can still track your meals.
          </p>

          {error && (
            <details className="mb-4">
              <summary className="text-xs text-emerald-600 cursor-pointer hover:text-emerald-800">
                Show error details
              </summary>
              <pre className="mt-2 text-xs text-emerald-600 font-mono overflow-auto max-h-24 whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-800 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            {onBasicView && (
              <button
                onClick={onBasicView}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Utensils className="w-4 h-4" />
                Back to Meals
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Insights Dashboard Boundary
// ============================================================================

interface InsightsBoundaryProps {
  children: ReactNode
  onViewMeals?: () => void
}

export function InsightsBoundary({ children, onViewMeals }: InsightsBoundaryProps): ReactNode {
  return (
    <FeatureErrorBoundary
      featureName="Insights Dashboard"
      onError={(error) => console.error("Insights Dashboard error:", error)}
      fallback={({ error, reset }) => <InsightsFallback error={error} onReset={reset} onViewMeals={onViewMeals} />}
    >
      {children}
    </FeatureErrorBoundary>
  )
}

interface InsightsFallbackProps {
  error: Error | null
  onReset: () => void
  onViewMeals?: () => void
}

function InsightsFallback({ error, onReset, onViewMeals }: InsightsFallbackProps): ReactNode {
  return (
    <div className="border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-indigo-800 mb-1">Insights unavailable</h3>
          <p className="text-sm text-indigo-700 mb-4">
            AI-powered insights couldn't be generated. Your meal data is safe.
          </p>

          {error && (
            <details className="mb-4">
              <summary className="text-xs text-primary cursor-pointer hover:text-indigo-800">
                Show error details
              </summary>
              <pre className="mt-2 text-xs text-primary font-mono overflow-auto max-h-24 whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-800 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            {onViewMeals && (
              <button
                onClick={onViewMeals}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Meals
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Meal Prep Boundary
// ============================================================================

interface MealPrepBoundaryProps {
  children: ReactNode
  onBackToTracker?: () => void
}

export function MealPrepBoundary({ children, onBackToTracker }: MealPrepBoundaryProps): ReactNode {
  return (
    <FeatureErrorBoundary
      featureName="Meal Prep"
      onError={(error) => console.error("Meal Prep error:", error)}
      fallback={({ error, reset }) => (
        <MealPrepFallback error={error} onReset={reset} onBackToTracker={onBackToTracker} />
      )}
    >
      {children}
    </FeatureErrorBoundary>
  )
}

interface MealPrepFallbackProps {
  error: Error | null
  onReset: () => void
  onBackToTracker?: () => void
}

function MealPrepFallback({ error, onReset, onBackToTracker }: MealPrepFallbackProps): ReactNode {
  return (
    <div className="border-2 border-dashed border-teal-200 bg-teal-50 rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
          <Utensils className="w-6 h-6 text-teal-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-teal-800 mb-1">Meal Prep unavailable</h3>
          <p className="text-sm text-teal-700 mb-4">
            Meal prep suggestions couldn't be generated. You can view your meal plan instead.
          </p>

          {error && (
            <details className="mb-4">
              <summary className="text-xs text-teal-600 cursor-pointer hover:text-teal-800">Show error details</summary>
              <pre className="mt-2 text-xs text-teal-600 font-mono overflow-auto max-h-24 whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-800 bg-teal-100 rounded-lg hover:bg-teal-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            {onBackToTracker && (
              <button
                onClick={onBackToTracker}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Utensils className="w-4 h-4" />
                Back to Tracker
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default {
  MealPlannerBoundary,
  AnalyticsBoundary,
  AIFeaturesBoundary,
  VoiceInputBoundary,
  ShoppingListBoundary,
  SettingsBoundary,
  LifestyleBoundary,
  InsightsBoundary,
  MealPrepBoundary,
}
