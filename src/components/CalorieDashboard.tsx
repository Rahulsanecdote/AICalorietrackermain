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

  const chartLabels = {
    consumed: t('dashboard.consumed'),
    remaining: t('dashboard.remaining'),
  };

  const chartData = {
    labels: [chartLabels.consumed, chartLabels.remaining],
    datasets: [
      {
        data: [
          totals.calories,
          Math.max(settings.dailyCalorieGoal - totals.calories, 0),
        ],
        backgroundColor: [
          isOverGoal ? '#A13B2A' : '#2F7D4C', // Rowan Red or Fern
          isOverGoal ? '#3A2A1B' : 'hsl(var(--muted))', // Walnut or Muted
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
        backgroundColor: '#0F1D18', // Spruce Shadow
        titleColor: '#E7EFEA', // Fog Text
        bodyColor: '#A9BDB2', // Moss Muted
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
      },
    },
  };

  const macroLabels = {
    protein: t('mealPlan.protein'),
    carbs: t('mealPlan.carbs'),
    fat: t('mealPlan.fat'),
  };

  const macroData = {
    labels: [macroLabels.protein, macroLabels.carbs, macroLabels.fat],
    datasets: [
      {
        data: [totals.protein_g, totals.carbs_g, totals.fat_g],
        backgroundColor: ['#6FAE7A', '#C28A2C', '#B4532A'], // Sage, Ochre, Rust
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
          color: '#A9BDB2', // Moss Muted
          usePointStyle: true,
          padding: 20,
        },
      },
    },
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t('dashboard.todaysProgress')}</h2>

      <div className="flex flex-col items-center mb-6">
        <div className="relative w-48 h-48">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{totals.calories}</span>
            <span className="text-sm text-muted-foreground">{t('dashboard.consumed')}</span>
            <span className={`text-sm font-medium ${isOverGoal ? 'text-destructive' : 'text-primary'}`}>
              {caloriesRemaining} {t('dashboard.remaining')}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">{t('dashboard.dailyGoal')}</span>
          <span className="font-medium text-foreground">
            {Math.round(calorieProgress)}%
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isOverGoal ? 'bg-destructive' : 'bg-primary'
              }`}
            style={{ width: `${calorieProgress}%` }}
          />
        </div>
      </div>

      {/* Macro Breakdown */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('dashboard.macronutrients')}</h3>
        <div className="h-40">
          <Doughnut data={macroData} options={macroOptions} />
        </div>
        <div className="flex justify-around mt-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-[#6FAE7A]">{totals.protein_g}g</div>
            <div className="text-muted-foreground">{t('mealPlan.protein')}</div>
            <div className="text-xs text-muted-foreground">{t('mealPlan.goal')}: {settings.proteinGoal_g}g</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-[#C28A2C]">{totals.carbs_g}g</div>
            <div className="text-muted-foreground">{t('mealPlan.carbs')}</div>
            <div className="text-xs text-muted-foreground">{t('mealPlan.goal')}: {settings.carbsGoal_g}g</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-[#B4532A]">{totals.fat_g}g</div>
            <div className="text-muted-foreground">{t('mealPlan.fat')}</div>
            <div className="text-xs text-muted-foreground">{t('mealPlan.goal')}: {settings.fatGoal_g}g</div>
          </div>
        </div>
      </div>
    </div>
  );
}
