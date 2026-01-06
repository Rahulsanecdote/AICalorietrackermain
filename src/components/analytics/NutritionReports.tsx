import React, { useState } from 'react';
import { NutritionReport, WeightEntry, ReportPeriod } from '../../types/analytics';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Download, Calendar, TrendingDown, TrendingUp, Minus, Camera } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface NutritionReportsProps {
  generateReport: (period: ReportPeriod) => NutritionReport;
  exportCSV: (period: ReportPeriod) => void;
  entries: WeightEntry[];
}

export default function NutritionReports({ generateReport, exportCSV, entries }: NutritionReportsProps) {
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [showDetail, setShowDetail] = useState(false);
  const report = generateReport(period);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getAdherenceColor = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return 'text-green-600 bg-green-50';
    if (percentage >= 70 && percentage < 90) return 'text-yellow-600 bg-yellow-50';
    if (percentage > 110) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getAdherenceIcon = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return <TrendingDown className="w-4 h-4" />;
    if (percentage >= 70 && percentage < 90) return <Minus className="w-4 h-4" />;
    if (percentage > 110) return <TrendingUp className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  // Macro distribution chart data
  const macroChartData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [
          report.averageMacros.percentage.protein,
          report.averageMacros.percentage.carbs,
          report.averageMacros.percentage.fat,
        ],
        backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  // Daily calories chart data
  const caloriesChartData = {
    labels: report.dailySummaries.slice(-7).map((d) => formatDate(d.date)),
    datasets: [
      {
        label: 'Calories',
        data: report.dailySummaries.slice(-7).map((d) => d.totals.calories),
        backgroundColor: report.dailySummaries.slice(-7).map((d) => {
          if (d.adherencePercentage >= 90 && d.adherencePercentage <= 110) return '#10b981';
          if (d.adherencePercentage >= 70) return '#f59e0b';
          return '#ef4444';
        }),
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: '#f3f4f6',
        },
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div>
      {/* Period Selector */}
      <div className="flex gap-2 mb-4">
        {(['week', 'month', 'quarter'] as ReportPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p === 'week' ? '7 Days' : p === 'month' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Avg. Calories</p>
          <p className="text-xl font-bold text-gray-900">{report.averageCalories}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Avg. Protein</p>
          <p className="text-xl font-bold text-blue-600">{report.averageMacros.protein}g</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Avg. Carbs</p>
          <p className="text-xl font-bold text-amber-600">{report.averageMacros.carbs}g</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Avg. Fat</p>
          <p className="text-xl font-bold text-red-600">{report.averageMacros.fat}g</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Calories Chart */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Daily Calories</h3>
          <div className="h-48">
            <Bar data={caloriesChartData} options={chartOptions} />
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> On target
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Under
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Over
            </span>
          </div>
        </div>

        {/* Macro Distribution */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Macro Split</h3>
          <div className="h-48">
            <Doughnut data={macroChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Adherence Score */}
      <div className="bg-indigo-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-indigo-800">Calorie Adherence Score</h3>
          <span className="text-2xl font-bold text-indigo-600">{report.totalAdherenceScore}%</span>
        </div>
        <div className="h-3 bg-indigo-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${report.totalAdherenceScore}%` }}
          />
        </div>
        <p className="text-xs text-indigo-600 mt-2">
          {report.daysLogged} of {report.totalDays} days logged on target (±10% of goal)
        </p>
      </div>

      {/* Daily Log */}
      <div className="mb-4">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg"
        >
          <span className="text-sm font-medium text-gray-700">Daily Breakdown</span>
          <span className={`text-sm text-gray-500 transition-transform ${showDetail ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {showDetail && (
          <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
            {report.dailySummaries.slice().reverse().map((day) => (
              <div
                key={day.date}
                className={`flex items-center justify-between p-3 rounded-lg ${getAdherenceColor(day.adherencePercentage)}`}
              >
                <div className="flex items-center gap-2">
                  {getAdherenceIcon(day.adherencePercentage)}
                  <span className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>{day.totals.calories} cal</span>
                  <span className="text-gray-500">({day.adherencePercentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Button */}
      <button
        onClick={() => exportCSV(period)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
      >
        <Download className="w-4 h-4" />
        Export as CSV
      </button>
    </div>
  );
}
