import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { DailyTotals, UserSettings } from '../types';
import { useTranslation } from 'react-i18next';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CalorieDashboardProps {
  totals: DailyTotals;
  settings: UserSettings;
}

export default function CalorieDashboard({ totals, settings }: CalorieDashboardProps) {
  const { t } = useTranslation();
  const calorieProgress = Math.min((totals.calories / settings.dailyCalorieGoal) * 100, 100);
  const caloriesRemaining = Math.max(settings.dailyCalorieGoal - totals.calories, 0);
  const isOverGoal = totals.calories > settings.dailyCalorieGoal;

  const chartData = {
    labels: ['Consumed', 'Remaining'],
    datasets: [
      {
        data: [
          totals.calories,
          Math.max(settings.dailyCalorieGoal - totals.calories, 0),
        ],
        backgroundColor: [
          isOverGoal ? '#EF4444' : '#10B981',
          isOverGoal ? '#FECACA' : '#E5E7EB',
        ],
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { label: string; parsed: number }) => {
            return `${context.label}: ${context.parsed} cal`;
          },
        },
      },
    },
  };

  const macroData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [totals.protein_g, totals.carbs_g, totals.fat_g],
        backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444'],
        borderWidth: 0,
      },
    ],
  };

  const macroOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.todaysProgress')}</h2>
      
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-48 h-48">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{totals.calories}</span>
            <span className="text-sm text-gray-500">{t('dashboard.consumed')}</span>
            <span className={`text-sm font-medium ${isOverGoal ? 'text-red-500' : 'text-emerald-500'}`}>
              {caloriesRemaining} {t('dashboard.remaining')}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">{t('dashboard.dailyGoal')}</span>
          <span className="font-medium text-gray-900">
            {Math.round(calorieProgress)}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverGoal ? 'bg-red-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${calorieProgress}%` }}
          />
        </div>
      </div>

      {/* Macro Breakdown */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('dashboard.macronutrients')}</h3>
        <div className="h-40">
          <Doughnut data={macroData} options={macroOptions} />
        </div>
        <div className="flex justify-around mt-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-blue-500">{totals.protein_g}g</div>
            <div className="text-gray-500">{t('mealPlan.protein')}</div>
            <div className="text-xs text-gray-400">{t('mealPlan.goal')}: {settings.proteinGoal_g}g</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-amber-500">{totals.carbs_g}g</div>
            <div className="text-gray-500">{t('mealPlan.carbs')}</div>
            <div className="text-xs text-gray-400">{t('mealPlan.goal')}: {settings.carbsGoal_g}g</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-500">{totals.fat_g}g</div>
            <div className="text-gray-500">{t('mealPlan.fat')}</div>
            <div className="text-xs text-gray-400">{t('mealPlan.goal')}: {settings.fatGoal_g}g</div>
          </div>
        </div>
      </div>
    </div>
  );
}
