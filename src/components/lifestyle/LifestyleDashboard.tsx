import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import WaterTracker from './WaterTracker';
import ExerciseLogger from './ExerciseLogger';
import SleepTracker from './SleepTracker';
import MoodTracker from './MoodTracker';
import { Activity, Droplets, Moon, Smile, TrendingUp, Target, Clock, Zap, Lightbulb } from 'lucide-react';

interface LifestyleDashboardProps {
  date: string;
}

// Default values for all wellness data
const defaultWellnessData = {
  water: { totalMl: 0, percentage: 0, goalMl: 2500, streak: 0 },
  exercise: { totalMinutes: 0, totalCaloriesBurned: 0 },
  sleep: { durationMinutes: 0, qualityRating: 0 },
  mood: { averageScore: 0, entryCount: 0 },
};

export default function LifestyleDashboard({ date }: LifestyleDashboardProps) {
  const { t } = useTranslation();
  // State to receive data from child components
  const [wellnessData, setWellnessData] = useState(defaultWellnessData);

  // Update functions for each tracker
  // Update functions for each tracker
  const handleWaterChange = useCallback((data: { totalMl: number; percentage: number; goalMl: number; streak: number }) => {
    setWellnessData(prev => {
      // Prevent unnecessary updates if data hasn't changed
      if (
        prev.water.totalMl === data.totalMl &&
        prev.water.percentage === data.percentage &&
        prev.water.goalMl === data.goalMl &&
        prev.water.streak === data.streak
      ) return prev;

      return {
        ...prev,
        water: data,
      };
    });
  }, []);

  const handleExerciseChange = useCallback((data: { totalMinutes: number; totalCaloriesBurned: number }) => {
    setWellnessData(prev => {
      if (prev.exercise.totalMinutes === data.totalMinutes && prev.exercise.totalCaloriesBurned === data.totalCaloriesBurned) return prev;
      return {
        ...prev,
        exercise: data,
      };
    });
  }, []);

  const handleSleepChange = useCallback((data: { durationMinutes: number; qualityRating: number }) => {
    setWellnessData(prev => {
      if (prev.sleep.durationMinutes === data.durationMinutes && prev.sleep.qualityRating === data.qualityRating) return prev;
      return {
        ...prev,
        sleep: data,
      };
    });
  }, []);

  const handleMoodChange = useCallback((data: { averageScore: number; entryCount: number }) => {
    setWellnessData(prev => {
      if (prev.mood.averageScore === data.averageScore && prev.mood.entryCount === data.entryCount) return prev;
      return {
        ...prev,
        mood: data,
      };
    });
  }, []);

  // Extract values from received data
  const { water, exercise, sleep, mood } = wellnessData;

  const waterMl = water.totalMl;
  const waterPercent = water.percentage;

  const waterStreak = water.streak;

  const exerciseMinutes = exercise.totalMinutes;
  const caloriesBurned = exercise.totalCaloriesBurned;

  const sleepHours = sleep.durationMinutes > 0 ? Math.round(sleep.durationMinutes / 60 * 10) / 10 : 0;
  const sleepQuality = sleep.qualityRating;

  const averageMood = mood.averageScore;
  const moodEntryCount = mood.entryCount;

  // Calculate wellness scores
  const hydrationScore = waterPercent;
  const activityScore = Math.min(100, Math.round((exerciseMinutes / 60) * 100));
  const restScore = Math.min(100, Math.round((sleepHours / 8) * 100));
  const moodScore = averageMood > 0 ? Math.round(averageMood * 20) : 0;

  // Calculate overall wellness score
  const overallScore = Math.round((hydrationScore + activityScore + restScore + moodScore) / 4);

  // Get motivational message based on score
  const getMotivationalMessage = () => {
    if (overallScore >= 80) return t('lifestyle.motivationalExcellent');
    if (overallScore >= 60) return t('lifestyle.motivationalGreat');
    if (overallScore >= 40) return t('lifestyle.motivationalGood');
    return t('lifestyle.motivationalStart');
  };

  // Helper to format water amount
  const formatWaterAmount = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">{t('lifestyle.title')}</h2>
      </div>

      {/* Grid Layout - Pass callbacks to receive data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WaterTracker date={date} onDataChange={handleWaterChange} />
        <ExerciseLogger date={date} onDataChange={handleExerciseChange} />
        <SleepTracker date={date} onDataChange={handleSleepChange} />
        <MoodTracker date={date} onDataChange={handleMoodChange} />
      </div>

      {/* Today's Wellness Summary */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{t('lifestyle.todaysWellnessSummary')}</h3>
          <div className="text-right">
            <p className="text-xs opacity-80">{t('lifestyle.overallScore')}</p>
            <p className="text-3xl font-bold">{overallScore}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-white/20 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${overallScore}%` }}
          />
        </div>

        <p className="text-sm opacity-90 mb-4">{getMotivationalMessage()}</p>

        <div className="grid grid-cols-4 gap-4">
          {/* Hydration */}
          <div className="text-center">
            <Droplets className="w-6 h-6 mx-auto mb-1 opacity-80" />
            <p className="text-2xl font-bold">{waterPercent}%</p>
            <p className="text-xs opacity-80">{t('lifestyle.hydration')}</p>
            <p className="text-xs opacity-60 mt-1">{formatWaterAmount(waterMl)}</p>
          </div>

          {/* Activity */}
          <div className="text-center">
            <Zap className="w-6 h-6 mx-auto mb-1 opacity-80" />
            <p className="text-2xl font-bold">{exerciseMinutes}</p>
            <p className="text-xs opacity-80">{t('lifestyle.activity')}</p>
            <p className="text-xs opacity-60 mt-1">{caloriesBurned} {t('lifestyle.cal')}</p>
          </div>

          {/* Rest */}
          <div className="text-center">
            <Moon className="w-6 h-6 mx-auto mb-1 opacity-80" />
            <p className="text-2xl font-bold">{sleepHours > 0 ? `${sleepHours.toFixed(1)}h` : '-'}</p>
            <p className="text-xs opacity-80">{t('lifestyle.rest')}</p>
            <p className="text-xs opacity-60 mt-1">
              {sleepQuality > 0 ? `${sleepQuality}/5 ${t('lifestyle.rest').toLowerCase()}` : t('lifestyle.noData')}
            </p>
          </div>

          {/* Mood */}
          <div className="text-center">
            <Smile className="w-6 h-6 mx-auto mb-1 opacity-80" />
            <p className="text-2xl font-bold">{averageMood > 0 ? averageMood.toFixed(1) : '-'}</p>
            <p className="text-xs opacity-80">{t('lifestyle.mood')}</p>
            <p className="text-xs opacity-60 mt-1">{moodEntryCount} {t('lifestyle.entries')}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Streaks */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500">{t('lifestyle.streaks')}</span>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-lg font-bold text-gray-900">{waterStreak} {t('lifestyle.days')}</p>
              <p className="text-xs text-gray-500">{t('lifestyle.water')}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">{t('lifestyle.exercise')}</p>
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500">{t('lifestyle.thisWeek')}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{exerciseMinutes * 7} {t('lifestyle.min')}</p>
            <p className="text-xs text-gray-500">{t('lifestyle.totalActivity')}</p>
          </div>
        </div>

        {/* Average Sleep */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500">{t('lifestyle.average')}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-500">{t('lifestyle.sleepPerNight')}</p>
          </div>
        </div>
      </div>

      {/* Wellness Tip */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-medium text-amber-800">{t('lifestyle.wellnessTip')}</h4>
            <p className="text-sm text-amber-700 mt-1">
              {overallScore < 50
                ? t('lifestyle.tipStartSmall')
                : overallScore < 80
                  ? t('lifestyle.tipDoingGreat')
                  : t('lifestyle.tipOutstanding')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
