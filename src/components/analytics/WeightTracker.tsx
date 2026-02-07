import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WeightEntry, WeightStats } from '../../types/analytics';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
} from 'chart.js';
import { Plus, Trash2, TrendingDown, TrendingUp, Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeightTrackerProps {
  entries: WeightEntry[];
  stats: WeightStats | null;
  onAddEntry: (weight: number, date?: string, note?: string) => void;
  onDeleteEntry: (id: string) => void;
}

export default function WeightTracker({ entries, stats, onAddEntry, onDeleteEntry }: WeightTrackerProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (weight && date) {
      onAddEntry(parseFloat(weight), date, note);
      setWeight('');
      setNote('');
      setShowModal(false);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: entries
      .slice()
      .reverse()
      .map((entry) => {
        const d = new Date(entry.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
    datasets: [
      {
        label: 'Weight (kg)',
        data: entries.slice().reverse().map((entry) => entry.weight),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
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
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context: TooltipItem<'line'>) => `${context.parsed.y} kg`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: {
          color: '#f3f4f6',
        },
        ticks: {
          callback: (value: string | number) => `${value} kg`,
        },
      },
    },
  };

  const getBMIStatus = () => {
    if (!stats) return null;
    const statusConfig = {
      underweight: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Underweight' },
      normal: { color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Normal Weight' },
      overweight: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Overweight' },
      obese: { color: 'text-destructive', bg: 'bg-red-50 border-red-200', label: 'Obese' },
    };
    const config = statusConfig[stats.bmiCategory as keyof typeof statusConfig] || statusConfig.normal;
    return (
      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${config.bg} ${config.color}`}>
        {config.label} (BMI: {stats.bmi})
      </div>
    );
  };

  return (
    <div>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Current</p>
            <p className="text-xl font-bold text-foreground">{stats.currentWeight} kg</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Change</p>
            <p className={`text-xl font-bold flex items-center gap-1 ${stats.change < 0 ? 'text-green-600' : stats.change > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {stats.change < 0 ? <TrendingDown className="w-4 h-4" /> : stats.change > 0 ? <TrendingUp className="w-4 h-4" /> : null}
              {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)} kg
            </p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">BMI</p>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              {getBMIStatus()}
            </div>
          </div>
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Entries</p>
            <p className="text-xl font-bold text-foreground">{stats.totalEntries}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {entries.length > 0 ? (
        <div className="bg-muted/50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('analytics.weightTrend') || 'Weight Trend'}</h3>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-xl p-8 text-center mb-6">
          <p className="text-muted-foreground mb-4">{t('analytics.noWeightData')}</p>
        </div>
      )}

      {/* History List */}
      {entries.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('analytics.recentEntries') || 'Recent Entries'}</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {entries.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{entry.weight} kg</span>
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
      >
        <Plus className="w-4 h-4" />
        {t('analytics.logWeight')}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics.logWeight')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="weight-input" className="block text-sm font-medium text-foreground mb-1">{t('analytics.weightKg') || 'Weight (kg)'}</label>
                <input
                  id="weight-input"
                  name="weight-input"
                  type="number"
                  autoComplete="off"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  step="0.1"
                  min="0"
                  max="500"
                  required
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  placeholder="70.5"
                />
              </div>
              <div>
                <label htmlFor="weight-date" className="block text-sm font-medium text-foreground mb-1">{t('common.date') || 'Date'}</label>
                <input
                  id="weight-date"
                  name="weight-date"
                  type="date"
                  autoComplete="off"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                />
              </div>
              <div>
                <label htmlFor="weight-note" className="block text-sm font-medium text-foreground mb-1">{t('analytics.noteOptional') || 'Note (optional)'}</label>
                <input
                  id="weight-note"
                  name="weight-note"
                  type="text"
                  autoComplete="off"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  placeholder="Feeling great today!"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
