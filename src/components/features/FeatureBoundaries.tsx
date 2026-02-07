"use client"

import { ReactNode } from 'react'
import { FeatureErrorBoundary } from "../ErrorBoundary"

interface FeatureBoundaryProps {
  children: ReactNode
  feature?: string
  onViewMeals?: () => void
  onBasicView?: () => void
  onRawView?: () => void
  onBackToTracker?: () => void
}

export function MealPlannerBoundary({ children, feature = "meal-planner" }: FeatureBoundaryProps) {
  return (
    <FeatureErrorBoundary feature={feature}>
      {children}
    </FeatureErrorBoundary>
  )
}

export function InsightsBoundary({ children, feature = "insights" }: FeatureBoundaryProps) {
  return (
    <FeatureErrorBoundary feature={feature}>
      {children}
    </FeatureErrorBoundary>
  )
}

export function LifestyleBoundary({ children, feature = "lifestyle" }: FeatureBoundaryProps) {
  return (
    <FeatureErrorBoundary feature={feature}>
      {children}
    </FeatureErrorBoundary>
  )
}

export function AnalyticsBoundary({ children, feature = "analytics" }: FeatureBoundaryProps) {
  return (
    <FeatureErrorBoundary feature={feature}>
      {children}
    </FeatureErrorBoundary>
  )
}

export function ShoppingListBoundary({ children, feature = "shopping-list" }: FeatureBoundaryProps) {
  return (
    <FeatureErrorBoundary feature={feature}>
      {children}
    </FeatureErrorBoundary>
  )
}

export function MealPrepBoundary({ children, feature = "meal-prep" }: FeatureBoundaryProps) {
  return (
    <FeatureErrorBoundary feature={feature}>
      {children}
    </FeatureErrorBoundary>
  )
}

export default {
  MealPlannerBoundary,
  InsightsBoundary,
  LifestyleBoundary,
  AnalyticsBoundary,
  ShoppingListBoundary,
  MealPrepBoundary,
}
