import { useCallback } from "react"
import { Meal, UserSettings, DailyTotals } from "../types"
import { NutritionReport, ReportPeriod, DailyNutritionSummary, MacroAverage } from "../types/analytics"
import { STORAGE_KEYS } from "../constants"
import { dateToKey, getLocalDateKeyFromTimestamp, getTodayStr, parseDateKey, shiftDateKey } from "../utils/dateHelpers"
import useLocalStorage from "../hooks/useLocalStorage"

interface UseAnalyticsReturn {
  generateReport: (period: ReportPeriod) => NutritionReport
  getDailySummaries: (startDate: string, endDate: string) => DailyNutritionSummary[]
  exportCSV: (period: ReportPeriod) => void
  getStreakDays: () => number
  getAdherenceRate: (days: number) => number
}

interface AggregatedDay {
  totals: DailyTotals
  mealsCount: number
}

const MEALS_STORAGE_KEY = STORAGE_KEYS.MEALS

export function useAnalytics(settings: UserSettings): UseAnalyticsReturn {
  const [meals] = useLocalStorage<Meal[]>(MEALS_STORAGE_KEY, [])

  // Aggregate meals by LOCAL date key.
  const aggregateMealsByDate = useCallback((): Record<string, AggregatedDay> => {
    const aggregation: Record<string, AggregatedDay> = {}

    meals.forEach((meal) => {
      const mealDate = getLocalDateKeyFromTimestamp(meal.timestamp)
      const existing = aggregation[mealDate]

      if (!existing) {
        aggregation[mealDate] = {
          totals: {
            calories: meal.nutrition.calories,
            protein_g: meal.nutrition.protein_g,
            carbs_g: meal.nutrition.carbs_g,
            fat_g: meal.nutrition.fat_g,
          },
          mealsCount: 1,
        }
        return
      }

      aggregation[mealDate] = {
        totals: {
          calories: existing.totals.calories + meal.nutrition.calories,
          protein_g: existing.totals.protein_g + meal.nutrition.protein_g,
          carbs_g: existing.totals.carbs_g + meal.nutrition.carbs_g,
          fat_g: existing.totals.fat_g + meal.nutrition.fat_g,
        },
        mealsCount: existing.mealsCount + 1,
      }
    })

    return aggregation
  }, [meals])

  // Get date range for a period (inclusive).
  const getDateRange = useCallback((period: ReportPeriod): { start: string; end: string } => {
    const end = parseDateKey(getTodayStr())
    const start = parseDateKey(getTodayStr())

    switch (period) {
      case "week":
        start.setDate(end.getDate() - 6)
        break
      case "month":
        start.setMonth(end.getMonth() - 1)
        break
      case "quarter":
        start.setMonth(end.getMonth() - 3)
        break
    }

    return {
      start: dateToKey(start),
      end: dateToKey(end),
    }
  }, [])

  // Get all dates in range using local calendar progression.
  const getAllDatesInRange = useCallback((start: string, end: string): string[] => {
    const dates: string[] = []
    const current = parseDateKey(start)
    const endDate = parseDateKey(end)

    current.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    while (current <= endDate) {
      dates.push(dateToKey(current))
      current.setDate(current.getDate() + 1)
    }

    return dates
  }, [])

  // Generate daily summaries for a date range.
  const getDailySummaries = useCallback((startDate: string, endDate: string): DailyNutritionSummary[] => {
    const aggregation = aggregateMealsByDate()
    const allDates = getAllDatesInRange(startDate, endDate)

    return allDates.map((date) => {
      const day = aggregation[date]
      const totals = day?.totals || {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
      }

      const adherencePercentage =
        settings.dailyCalorieGoal > 0 ? Math.min(100, (totals.calories / settings.dailyCalorieGoal) * 100) : 0

      return {
        date,
        totals: {
          calories: Math.round(totals.calories),
          protein_g: Math.round(totals.protein_g),
          carbs_g: Math.round(totals.carbs_g),
          fat_g: Math.round(totals.fat_g),
        },
        mealsCount: day?.mealsCount || 0,
        goalCalories: settings.dailyCalorieGoal,
        adherencePercentage: Math.round(adherencePercentage),
      }
    })
  }, [aggregateMealsByDate, getAllDatesInRange, settings.dailyCalorieGoal])

  // Generate a complete report.
  const generateReport = useCallback((period: ReportPeriod): NutritionReport => {
    const { start, end } = getDateRange(period)
    const dailySummaries = getDailySummaries(start, end)

    const totalCalories = dailySummaries.reduce((sum, day) => sum + day.totals.calories, 0)
    const totalProtein = dailySummaries.reduce((sum, day) => sum + day.totals.protein_g, 0)
    const totalCarbs = dailySummaries.reduce((sum, day) => sum + day.totals.carbs_g, 0)
    const totalFat = dailySummaries.reduce((sum, day) => sum + day.totals.fat_g, 0)

    const daysLogged = dailySummaries.filter((day) => day.totals.calories > 0).length
    const daysMeetingGoal = dailySummaries.filter(
      (day) => day.totals.calories > 0 && day.adherencePercentage >= 90 && day.adherencePercentage <= 110
    ).length

    const macroTotal = totalProtein + totalCarbs + totalFat

    const averageMacros: MacroAverage = {
      protein: Math.round(totalProtein / (daysLogged || 1)),
      carbs: Math.round(totalCarbs / (daysLogged || 1)),
      fat: Math.round(totalFat / (daysLogged || 1)),
      percentage: {
        protein: macroTotal > 0 ? Math.round((totalProtein / macroTotal) * 100) : 0,
        carbs: macroTotal > 0 ? Math.round((totalCarbs / macroTotal) * 100) : 0,
        fat: macroTotal > 0 ? Math.round((totalFat / macroTotal) * 100) : 0,
      },
    }

    return {
      period,
      startDate: start,
      endDate: end,
      dailySummaries,
      averageCalories: Math.round(totalCalories / (dailySummaries.length || 1)),
      averageMacros,
      totalAdherenceScore: daysLogged > 0 ? Math.round((daysMeetingGoal / daysLogged) * 100) : 0,
      daysLogged,
      totalDays: dailySummaries.length,
    }
  }, [getDateRange, getDailySummaries])

  // Export report as CSV.
  const exportCSV = useCallback((period: ReportPeriod) => {
    const report = generateReport(period)
    const headers = ["Date", "Calories", "Protein (g)", "Carbs (g)", "Fat (g)", "Goal", "Adherence %"]

    const rows = report.dailySummaries.map((day) => [
      day.date,
      day.totals.calories,
      day.totals.protein_g,
      day.totals.carbs_g,
      day.totals.fat_g,
      day.goalCalories,
      day.adherencePercentage,
    ])

    rows.push([])
    rows.push(["Summary"])
    rows.push(["Average Calories", report.averageCalories])
    rows.push(["Days Logged", `${report.daysLogged}/${report.totalDays}`])
    rows.push(["Adherence Score", `${report.totalAdherenceScore}%`])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `nutrition-report-${report.startDate}-to-${report.endDate}.csv`
    link.click()
  }, [generateReport])

  // Calculate current streak of logging days.
  const getStreakDays = useCallback((): number => {
    const aggregation = aggregateMealsByDate()
    if (Object.keys(aggregation).length === 0) return 0

    let streak = 0
    let dateKey = getTodayStr()

    if (!aggregation[dateKey]) {
      dateKey = shiftDateKey(dateKey, -1)
    }

    while (aggregation[dateKey]) {
      streak += 1
      dateKey = shiftDateKey(dateKey, -1)
    }

    return streak
  }, [aggregateMealsByDate])

  // Calculate adherence rate for last N days.
  const getAdherenceRate = useCallback((days: number): number => {
    const end = getTodayStr()
    const start = shiftDateKey(end, -(Math.max(days, 1) - 1))

    const summaries = getDailySummaries(start, end)
    const daysLogged = summaries.filter((s) => s.totals.calories > 0)
    const daysOnTarget = daysLogged.filter((s) => s.adherencePercentage >= 90 && s.adherencePercentage <= 110)

    return daysLogged.length > 0 ? Math.round((daysOnTarget.length / daysLogged.length) * 100) : 0
  }, [getDailySummaries])

  return {
    generateReport,
    getDailySummaries,
    exportCSV,
    getStreakDays,
    getAdherenceRate,
  }
}
