'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, TrendingDown, Info, X, RefreshCw, Lightbulb, Award, Activity } from 'lucide-react';
import { useInsightsEngine } from '../../hooks/useInsightsEngine';
import { WeeklyInsight, InsightCategory, InsightSeverity } from '../../types/features';

interface InsightsDashboardProps {
  meals: any[];
}

export function InsightsDashboard({ meals }: InsightsDashboardProps) {

  const {
    insights,
    weeklyStats,
    isLoading,
    generateInsights,
    dismissInsight,
    hasInsights,
  } = useInsightsEngine({ meals });

  const hasMeals = meals.length > 0;

  // Show empty state if no meals
  if (!hasMeals) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Insights
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personalized tips based on your eating patterns
            </p>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Start Logging Meals
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            Log your first meal to unlock personalized insights about your nutrition habits, patterns, and achievements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Insights
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personalized tips based on your eating patterns
            </p>
          </div>
          <button
            onClick={generateInsights}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh Insights
              </>
            )}
          </button>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.avgCaloriesPerDay}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Calories/Day</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.avgProteinPerDay}g</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Protein/Day</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.dayStreak}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Day Streak</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.mealCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Meals</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing your nutrition data...</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* No Insights State */}
      {!isLoading && !hasInsights && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <Lightbulb className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Insights Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Keep logging meals to unlock personalized insights about your nutrition.
            </p>
            <button
              onClick={generateInsights}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Generate Insights
            </button>
          </div>
        </div>
      )}

      {/* Insights Cards */}
      {!isLoading && hasInsights && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">
            Your Personalized Insights
          </h3>
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={() => dismissInsight(insight.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface InsightCardProps {
  insight: WeeklyInsight;
  onDismiss: () => void;
}

function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const categoryIcons: Record<InsightCategory, React.ReactNode> = {
    macronutrient: <Activity className="w-5 h-5" />,
    micronutrient: <Lightbulb className="w-5 h-5" />,
    habit: <TrendingUp className="w-5 h-5" />,
    achievement: <Award className="w-5 h-5" />,
  };

  const categoryColors: Record<InsightCategory, string> = {
    macronutrient: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    micronutrient: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    habit: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    achievement: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  const severityColors: Record<InsightSeverity, string> = {
    positive: 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
    warning: 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10',
    info: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10',
  };

  const severityIcons: Record<InsightSeverity, React.ReactNode> = {
    positive: <TrendingUp className="w-4 h-4 text-green-500" />,
    warning: <TrendingDown className="w-4 h-4 text-yellow-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div
      className={`p-4 rounded-xl border-l-4 ${severityColors[insight.severity]} ${categoryColors[insight.category].split(' ')[0]} transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${categoryColors[insight.category]}`}>
          {categoryIcons[insight.category]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {severityIcons[insight.severity]}
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {insight.title}
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {insight.description}
          </p>
          {insight.actionItem && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{insight.actionItem}</span>
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// Compact insights summary for dashboard
export function InsightsSummary({ meals }: { meals: any[] }) {
  const { t } = useTranslation();
  const { hasInsights, isLoading, generateInsights } = useInsightsEngine({ meals });

  if (meals.length === 0) return null;

  return (
    <button
      onClick={generateInsights}
      disabled={isLoading}
      className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {t('insights.title')}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isLoading ? t('insights.generatingInsights') : hasInsights ? t('insights.viewInsights') : t('insights.getTips')}
        </p>
      </div>
      <div className="w-6 h-6 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center">
        <TrendingUp className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
      </div>
    </button>
  );
}
