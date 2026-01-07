import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Meal } from '../types';
import { WeeklyInsight, WeeklyStats, InsightCategory, InsightSeverity, STORAGE_KEYS } from '../types/features';
import { API_CONFIG } from '../constants';
import { postAIChat } from '../utils/aiClient';
import useLocalStorage from './useLocalStorage';

interface UseInsightsOptions {
  meals: Meal[];
  refreshInterval?: number; // hours
}

export function useInsightsEngine({ meals, refreshInterval = 24 }: UseInsightsOptions) {
  const { t } = useTranslation('insights');
  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useLocalStorage<number | null>(STORAGE_KEYS.INSIGHTS, null);

  // Calculate weekly statistics
  const weeklyStats: WeeklyStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekMeals = meals.filter((meal) => {
      const mealDate = new Date(meal.timestamp);
      return mealDate >= weekAgo && mealDate <= now;
    });

    if (weekMeals.length === 0) {
      return {
        totalCalories: 0,
        avgCaloriesPerDay: 0,
        totalProtein: 0,
        avgProteinPerDay: 0,
        totalCarbs: 0,
        avgCarbsPerDay: 0,
        totalFat: 0,
        avgFatPerDay: 0,
        mealCount: 0,
        avgMealsPerDay: 0,
        dayStreak: 0,
        topCategory: 'none',
      };
    }

    // Calculate totals
    const totals = weekMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.nutrition.calories,
        protein: acc.protein + meal.nutrition.protein_g,
        carbs: acc.carbs + meal.nutrition.carbs_g,
        fat: acc.fat + meal.nutrition.fat_g,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Calculate day streak
    let dayStreak = 0;
    const uniqueDays = new Set<string>();
    weekMeals.forEach((meal) => {
      uniqueDays.add(new Date(meal.timestamp).toISOString().split('T')[0]);
    });
    dayStreak = uniqueDays.size;

    // Find top category
    const categoryCount: Record<string, number> = {};
    weekMeals.forEach((meal) => {
      categoryCount[meal.category] = (categoryCount[meal.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

    return {
      totalCalories: totals.calories,
      avgCaloriesPerDay: Math.round(totals.calories / 7),
      totalProtein: totals.protein,
      avgProteinPerDay: Math.round(totals.protein / 7),
      totalCarbs: totals.carbs,
      avgCarbsPerDay: Math.round(totals.carbs / 7),
      totalFat: totals.fat,
      avgFatPerDay: Math.round(totals.fat / 7),
      mealCount: weekMeals.length,
      avgMealsPerDay: Math.round(weekMeals.length / 7),
      dayStreak,
      topCategory,
    };
  }, [meals]);

  // Generate insights using AI
  const generateInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `
Analyze this user's weekly nutrition data and provide 2-3 personalized insights:

Weekly Stats:
- Average Calories/day: ${weeklyStats.avgCaloriesPerDay}
- Average Protein/day: ${weeklyStats.avgProteinPerDay}g
- Average Carbs/day: ${weeklyStats.avgCarbsPerDay}g
- Average Fat/day: ${weeklyStats.avgFatPerDay}g
- Total meals logged: ${weeklyStats.mealCount}
- Day streak: ${weeklyStats.dayStreak} days
- Top meal category: ${weeklyStats.topCategory}

Return a JSON array with objects containing:
- category: "macronutrient", "micronutrient", "habit", or "achievement"
- severity: "info", "warning", or "positive"
- title: Short descriptive title
- description: 1-2 sentence explanation
- actionItem: Optional specific action suggestion

Keep responses friendly, motivational, and actionable. Focus on patterns and suggestions for improvement.
      `.trim();

      const response = await postAIChat({
        model: API_CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a friendly nutrition coach. Return only valid JSON array, no markdown formatting.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 600,
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in response');
      }

      // Parse JSON response
      const parsedInsights = JSON.parse(content);

      // Transform and store
      const newInsights: WeeklyInsight[] = parsedInsights.map((insight: any, index: number) => ({
        id: uuidv4(),
        generatedAt: Date.now(),
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        category: insight.category || 'habit',
        severity: insight.severity || 'info',
        title: insight.title || 'Insight',
        description: insight.description || '',
        actionItem: insight.actionItem,
      }));

      setInsights(newInsights);
      setLastGenerated(Date.now());
    } catch (err) {
      console.error('Insights generation error:', err);
      // Fallback to local insights
      generateLocalInsights();
    } finally {
      setIsLoading(false);
    }
  }, [weeklyStats, setLastGenerated]);

  // Generate local insights without AI
  const generateLocalInsights = useCallback(() => {
    const newInsights: WeeklyInsight[] = [];

    // Protein insight
    if (weeklyStats.avgProteinPerDay < 50) {
      newInsights.push({
        id: uuidv4(),
        generatedAt: Date.now(),
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        category: 'macronutrient',
        severity: 'warning',
        title: 'Boost Your Protein',
        description: `You're averaging ${weeklyStats.avgProteinPerDay}g protein per day. Consider adding more lean meats, eggs, or legumes.`,
        actionItem: 'Try Greek yogurt for breakfast',
      });
    } else if (weeklyStats.avgProteinPerDay >= 100) {
      newInsights.push({
        id: uuidv4(),
        generatedAt: Date.now(),
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        category: 'achievement',
        severity: 'positive',
        title: 'Protein Powerhouse!',
        description: `Great job! You're hitting ${weeklyStats.avgProteinPerDay}g of protein daily, supporting muscle health.`,
      });
    }

    // Consistency insight
    if (weeklyStats.dayStreak >= 5) {
      newInsights.push({
        id: uuidv4(),
        generatedAt: Date.now(),
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        category: 'habit',
        severity: 'positive',
        title: 'On a Roll!',
        description: `You've logged meals for ${weeklyStats.dayStreak} days this week. Keep up the consistent tracking!`,
      });
    } else if (weeklyStats.dayStreak < 3 && weeklyStats.mealCount > 0) {
      newInsights.push({
        id: uuidv4(),
        generatedAt: Date.now(),
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        category: 'habit',
        severity: 'info',
        title: 'Build Your Streak',
        description: `You've logged meals on ${weeklyStats.dayStreak} days this week. Try to log meals for at least 5 days to build a consistent habit.`,
        actionItem: 'Set a reminder to log your meals',
      });
    }

    // Meal frequency insight
    if (weeklyStats.avgMealsPerDay < 2 && weeklyStats.mealCount > 3) {
      newInsights.push({
        id: uuidv4(),
        generatedAt: Date.now(),
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        category: 'habit',
        severity: 'info',
        title: 'More Meals = More Energy',
        description: 'Consider spreading your calories across more meals for steady energy throughout the day.',
        actionItem: 'Add a healthy snack between meals',
      });
    } else if (weeklyStats.avgMealsPerDay >= 4) {
      newInsights.push({
        id: uuidv4(),
        generatedAt: Date.now(),
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        category: 'habit',
        severity: 'positive',
        title: 'Great Meal Variety!',
        description: `You're averaging ${weeklyStats.avgMealsPerDay} meals per day, which helps maintain steady energy levels.`,
      });
    }

    // Calorie pattern insight
    if (weeklyStats.avgCaloriesPerDay > 2500) {
      newInsights.push({
        id: uuidv4(),
        generatedAt: Date.now(),
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        category: 'macronutrient',
        severity: 'info',
        title: 'Calorie Awareness',
        description: `You're averaging ${weeklyStats.avgCaloriesPerDay} calories daily. This is useful data for understanding your energy intake.`,
      });
    } else if (weeklyStats.avgCaloriesPerDay < 1200 && weeklyStats.mealCount > 7) {
      newInsights.push({
        id: uuidv4(),
        generatedAt: Date.now(),
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        category: 'macronutrient',
        severity: 'warning',
        title: 'Low Calorie Intake',
        description: `You're averaging only ${weeklyStats.avgCaloriesPerDay} calories daily. Make sure you're eating enough to fuel your body.`,
        actionItem: 'Consider adding nutrient-dense foods to your meals',
      });
    }

    // First week celebration
    if (weeklyStats.mealCount >= 1 && weeklyStats.mealCount <= 3) {
      newInsights.push({
        id: uuidv4(),
        generatedAt: Date.now(),
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        category: 'achievement',
        severity: 'positive',
        title: 'Great Start!',
        description: "You've begun your nutrition tracking journey. Keep logging meals to unlock more personalized insights.",
        actionItem: 'Log meals for a few more days to see patterns emerge',
      });
    }

    // Low variety insight
    if (weeklyStats.topCategory !== 'none' && weeklyStats.mealCount >= 7) {
      const varietyBonus = weeklyStats.mealCount / Object.keys({ breakfast: 1, lunch: 1, dinner: 1, snack: 1 }).length;
      if (varietyBonus > 2) {
        newInsights.push({
          id: uuidv4(),
          generatedAt: Date.now(),
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
          category: 'micronutrient',
          severity: 'info',
          title: 'Diversify Your Diet',
          description: `Most of your meals are ${weeklyStats.topCategory}. Try incorporating different meal types for better nutritional balance.`,
          actionItem: 'Experiment with a new recipe this week',
        });
      }
    }

    setInsights(newInsights);
    setLastGenerated(Date.now());
  }, [weeklyStats, setLastGenerated]);

  // Check if we need to refresh
  useEffect(() => {
    if (!lastGenerated) {
      generateInsights();
      return;
    }

    const hoursSinceLastGen = (Date.now() - lastGenerated) / (1000 * 60 * 60);
    if (hoursSinceLastGen >= refreshInterval) {
      generateInsights();
    }
  }, [lastGenerated, refreshInterval, generateInsights]);

  const dismissInsight = useCallback((insightId: string) => {
    setInsights((prev) => prev.filter((insight) => insight.id !== insightId));
  }, []);

  const clearAllInsights = useCallback(() => {
    setInsights([]);
  }, []);

  return {
    insights,
    weeklyStats,
    isLoading,
    error,
    lastGenerated,
    generateInsights,
    dismissInsight,
    clearAllInsights,
    hasInsights: insights.length > 0,
  };
}
