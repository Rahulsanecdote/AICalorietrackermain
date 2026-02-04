import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeight } from '../../hooks/useWeight';
import { useProgressPhotos } from '../../hooks/useProgressPhotos';
import { useAnalytics } from '../../hooks/useAnalytics';
import { UserSettings } from '../../types';
import WeightTracker from './WeightTracker';
import ProgressPhotoGallery from './ProgressPhotoGallery';
import NutritionReports from './NutritionReports';
import { Activity, Camera, TrendingUp } from 'lucide-react';

interface AnalyticsDashboardProps {
  settings: UserSettings;
}

type TabType = 'weight' | 'photos' | 'reports';

export default function AnalyticsDashboard({ settings }: AnalyticsDashboardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('weight');
  const { entries: weightEntries, stats: weightStats, addEntry, deleteEntry } = useWeight();
  const { photos, uploadPhoto, deletePhoto, isLoading: photosLoading } = useProgressPhotos();
  const { generateReport, exportCSV, getStreakDays, getAdherenceRate } = useAnalytics(settings);

  const streakDays = getStreakDays();
  const weeklyAdherence = getAdherenceRate(7);

  const tabs = [
    { id: 'weight' as TabType, label: t('analytics.weightTracking'), icon: TrendingUp },
    { id: 'photos' as TabType, label: t('analytics.progressPhotos'), icon: Camera },
    { id: 'reports' as TabType, label: t('analytics.nutritionReports'), icon: Activity },
  ];

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Header with Stats Overview */}
      <div className="bg-gradient-to-r from-primary/80 to-primary/40 p-6 text-primary-foreground">
        <h2 className="text-xl font-semibold mb-4 text-foreground">{t('analytics.title')}</h2>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card/10 rounded-xl p-3">
            <p className="text-xs text-white/70 mb-1">{t('analytics.currentWeight')}</p>
            <p className="text-xl font-bold">
              {weightStats ? `${weightStats.currentWeight} kg` : '--'}
            </p>
          </div>
          <div className="bg-card/10 rounded-xl p-3">
            <p className="text-xs text-white/70 mb-1">{t('analytics.change')}</p>
            <p className={`text-xl font-bold ${weightStats && weightStats.change < 0 ? 'text-green-300' : weightStats && weightStats.change > 0 ? 'text-red-300' : ''}`}>
              {weightStats ? (weightStats.change > 0 ? '+' : '') + `${weightStats.change.toFixed(1)} kg` : '--'}
            </p>
          </div>
          <div className="bg-card/10 rounded-xl p-3">
            <p className="text-xs text-white/70 mb-1">{t('analytics.logStreak')}</p>
            <p className="text-xl font-bold">{streakDays} {t('lifestyle.days')}</p>
          </div>
          <div className="bg-card/10 rounded-xl p-3">
            <p className="text-xs text-white/70 mb-1">{t('analytics.weeklyAdherence')}</p>
            <p className={`text-xl font-bold ${weeklyAdherence >= 70 ? 'text-green-300' : weeklyAdherence >= 40 ? 'text-yellow-300' : 'text-red-300'}`}>
              {weeklyAdherence}%
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'weight' && (
          <WeightTracker
            entries={weightEntries}
            stats={weightStats}
            onAddEntry={addEntry}
            onDeleteEntry={deleteEntry}
          />
        )}

        {activeTab === 'photos' && (
          <ProgressPhotoGallery
            photos={photos}
            onUpload={uploadPhoto}
            onDelete={deletePhoto}
            isLoading={photosLoading}
          />
        )}

        {activeTab === 'reports' && (
          <NutritionReports
            generateReport={generateReport}
            exportCSV={exportCSV}
            entries={weightEntries}
          />
        )}
      </div>
    </div>
  );
}
