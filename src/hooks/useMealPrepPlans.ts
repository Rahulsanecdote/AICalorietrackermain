"use client"

import { useCallback, useMemo } from "react"
import useLocalStorage from "./useLocalStorage"
import type { SavedMealPrepPlan } from "@/types/mealPrep"

const MEAL_PREP_PLAN_STORAGE_KEY = "act_mealprep_plans_v1"

interface UseMealPrepPlansReturn {
  plans: SavedMealPrepPlan[]
  savePlan: (plan: SavedMealPrepPlan) => void
  deletePlan: (planId: string) => void
  getPlanById: (planId: string) => SavedMealPrepPlan | null
  latestPlan: SavedMealPrepPlan | null
}

export function useMealPrepPlans(): UseMealPrepPlansReturn {
  const [plans, setPlans] = useLocalStorage<SavedMealPrepPlan[]>(MEAL_PREP_PLAN_STORAGE_KEY, [])

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [plans],
  )

  const savePlan = useCallback(
    (plan: SavedMealPrepPlan) => {
      setPlans((prev) => {
        const existing = prev.find((entry) => entry.id === plan.id)
        if (existing) {
          return prev.map((entry) => (entry.id === plan.id ? { ...plan, updatedAt: new Date().toISOString() } : entry))
        }

        return [{ ...plan, updatedAt: new Date().toISOString() }, ...prev]
      })
    },
    [setPlans],
  )

  const deletePlan = useCallback(
    (planId: string) => {
      setPlans((prev) => prev.filter((entry) => entry.id !== planId))
    },
    [setPlans],
  )

  const getPlanById = useCallback(
    (planId: string): SavedMealPrepPlan | null => sortedPlans.find((entry) => entry.id === planId) ?? null,
    [sortedPlans],
  )

  const latestPlan = sortedPlans[0] ?? null

  return {
    plans: sortedPlans,
    savePlan,
    deletePlan,
    getPlanById,
    latestPlan,
  }
}

export default useMealPrepPlans
