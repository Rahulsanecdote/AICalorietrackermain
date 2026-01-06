import { useMemo, useCallback } from 'react';
import { Meal, UserSettings, DailyTotals } from '../types';
import { NutritionReport, ReportPeriod, DailyNutritionSummary, MacroAverage } from '../types/analytics';
import useLocalStorage from '../hooks/useLocalStorage';

const MEALS_STORAGE_KEY = 'nutriai_data';

interface UseAnalyticsReturn {
  generateReport: (period: ReportPeriod) => NutritionReport;
  getDailySummaries: (startDate: string, endDate: string) => DailyNutritionSummary[];
  exportCSV: (period: ReportPeriod) => void;
  getStreakDays: () => number;
  getAdherenceRate: (days: number) => number;
}

export function useAnalytics(settings: UserSettings): UseAnalyticsReturn {
  const [meals] = useLocalStorage<Meal[]>(MEALS_STORAGE_KEY, []);

  // Aggregate meals by date
  const aggregateMealsByDate = useCallback((): Record<string, DailyTotals> => {
    const aggregation: Record<string, DailyTotals> = {};

    meals.forEach((meal) => {
      const mealDate = new Date(meal.timestamp).toISOString().split('T')[0];
      
      if (!aggregation[mealDate]) {
        aggregation[mealDate] = {
          calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
        };
      }

      aggregation[mealDate] = {
        calories: aggregation[mealDate].calories + meal.nutrition.calories,
        protein_g: aggregation[mealDate].protein_g + meal.nutrition.protein_g,
        carbs_g: aggregation[mealDate].carbs_g + meal.nutrition.carbs_g,
        fat_g: aggregation[mealDate].fat_g + meal.nutrition.fat_g,
      };
    });

    return aggregation;
  }, [meals]);

  // Get date range for a period
  const getDateRange = useCallback((period: ReportPeriod): { start: string; end: string } => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, []);

  // Get all dates in range
  const getAllDatesInRange = useCallback((start: string, end: string): string[] => {
    const dates: string[] = [];
    const current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, []);

  // Generate daily summaries for a date range
  const getDailySummaries = useCallback((startDate: string, endDate: string): DailyNutritionSummary[] => {
    const aggregation = aggregateMealsByDate();
    const allDates = getAllDatesInRange(startDate, endDate);

    return allDates.map((date) => {
      const totals = aggregation[date] || {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
      };

      const adherencePercentage = settings.dailyCalorieGoal > 0
        ? Math.min(100, (totals.calories / settings.dailyCalorieGoal) * 100)
        : 0;

      return {
        date,
        totals: {
          calories: Math.round(totals.calories),
          protein_g: Math.round(totals.protein_g),
          carbs_g: Math.round(totals.carbs_g),
          fat_g: Math.round(totals.fat_g),
        },
        mealsCount: aggregation[date] ? Object.keys(aggregation).length > 0 ? 1 : 0 : 0,
        goalCalories: settings.dailyCalorieGoal,
        adherencePercentage: Math.round(adherencePercentage),
      };
    });
  }, [aggregateMealsByDate, getAllDatesInRange, settings.dailyCalorieGoal]);

  // Generate a complete report
  const generateReport = useCallback((period: ReportPeriod): NutritionReport => {
    const { start, end } = getDateRange(period);
    const dailySummaries = getDailySummaries(start, end);
    
    // Calculate averages
    const totalCalories = dailySummaries.reduce((sum, day) => sum + day.totals.calories, 0);
    const totalProtein = dailySummaries.reduce((sum, day) => sum + day.totals.protein_g, 0);
    const totalCarbs = dailySummaries.reduce((sum, day) => sum + day.totals.carbs_g, 0);
    const totalFat = dailySummaries.reduce((sum, day) => sum + day.totals.fat_g, 0);

    const daysLogged = dailySummaries.filter((day) => day.totals.calories > 0).length;
    const daysMeetingGoal = dailySummaries.filter(
      (day) => day.totals.calories > 0 && day.adherencePercentage >= 90 && day.adherencePercentage <= 110
    ).length;

    const macroTotal = totalProtein + totalCarbs + totalFat;

    const averageMacros: MacroAverage = {
      protein: Math.round(totalProtein / (daysLogged || 1)),
      carbs: Math.round(totalCarbs / (daysLogged || 1)),
      fat: Math.round(totalFat / (daysLogged || 1)),
      percentage: {
        protein: macroTotal > 0 ? Math.round((totalProtein / macroTotal) * 100) : 0,
        carbs: macroTotal > 0 ? Math.round((totalCarbs / macroTotal) * 100) : 0,
        fat: macroTotal > 0 ? Math.round((totalFat / macroTotal) * 100) : 0,
      },
    };

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
    };
  }, [getDateRange, getDailySummaries]);

  // Export report as CSV
  const exportCSV = useCallback((period: ReportPeriod) => {
    const report = generateReport(period);
    const headers = ['Date', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Goal', 'Adherence %'];

    const rows = report.dailySummaries.map((day) => [
      day.date,
      day.totals.calories,
      day.totals.protein_g,
      day.totals.carbs_g,
      day.totals.fat_g,
      day.goalCalories,
      day.adherencePercentage,
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['Summary']);
    rows.push(['Average Calories', report.averageCalories]);
    rows.push(['Days Logged', `${report.daysLogged}/${report.totalDays}`]);
    rows.push(['Adherence Score', `${report.totalAdherenceScore}%`]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nutrition-report-${report.startDate}-to-${report.endDate}.csv`;
    link.click();
  }, [generateReport]);

  // Calculate current streak of logging days
  const getStreakDays = useCallback((): number => {
    const aggregation = aggregateMealsByDate();
    const sortedDates = Object.keys(aggregation).sort().reverse();
    
    if (sortedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date();

    // Check if logged today or yesterday to start streak
    let checkDate = currentDate.toISOString().split('T')[0];
    if (!aggregation[checkDate]) {
      currentDate.setDate(currentDate.getDate() - 1);
      checkDate = currentDate.toISOString().split('T')[0];
    }

    if (!aggregation[checkDate]) return 0;

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (aggregation[dateStr]) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [aggregateMealsByDate]);

  // Calculate adherence rate for last N days
  const getAdherenceRate = useCallback((days: number): number => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const summaries = getDailySummaries(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );

    const daysLogged = summaries.filter((s) => s.totals.calories > 0);
    const daysOnTarget = daysLogged.filter(
      (s) => s.adherencePercentage >= 90 && s.adherencePercentage <= 110
    );

    return daysLogged.length > 0 ? Math.round((daysOnTarget.length / daysLogged.length) * 100) : 0;
  }, [getDailySummaries]);

  return {
    generateReport,
    getDailySummaries,
    exportCSV,
    getStreakDays,
    getAdherenceRate,
  };
}
