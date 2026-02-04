import { useState } from 'react';
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
import { Download, TrendingDown, TrendingUp, Minus, ChevronDown } from 'lucide-react';

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

export default function NutritionReports({ generateReport, exportCSV }: NutritionReportsProps) {
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
    if (percentage >= 90 && percentage <= 110) return 'text-green-400 bg-green-500/10';
    if (percentage >= 70 && percentage < 90) return 'text-yellow-400 bg-yellow-500/10';
    if (percentage > 110) return 'text-red-400 bg-red-500/10';
    return 'text-muted-foreground bg-card';
  };


  return (
    <div className="space-y-6">
      {/* Adherence Score */}
      <div className="bg-primary/10 rounded-xl p-4 mb-6 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-primary">Calorie Adherence Score</h3>
          <span className="text-2xl font-bold text-foreground">{report.totalAdherenceScore}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${report.totalAdherenceScore}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {report.daysLogged} of {report.totalDays} days logged on target (±10% of goal)
        </p>
      </div>

      {/* Daily Log */}
      <div className="mb-4">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="flex items-center justify-between w-full p-3 bg-card rounded-lg hover:bg-accent transition-colors"
        >
          <span className="font-medium text-sm">View Daily Details</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showDetail ? 'rotate-180' : ''}`} />
        </button>

        {showDetail && (
          <div className="mt-2 text-sm text-muted-foreground p-3 border border-border rounded-lg">
            {/* Placeholder for detailed table - previously missing */}
            No detailed logs available for this period.
          </div>
        )}
        {/* Export Button */}
        <button
          onClick={() => exportCSV(period)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium border border-border"
        >
          <Download className="w-4 h-4" />
          Export as CSV
        </button>
      </div>
      );
}
