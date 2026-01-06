import { Settings, Flame, BarChart2, ShoppingCart, Calendar, Heart, Coffee, RefreshCw, Mic, ArrowRightLeft, Lightbulb, Mic2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from './ui/ThemeToggle';
import { LanguageSwitcher } from './features/LanguageSwitcher';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenUtilities: () => void;
  onOpenVoice: () => void;
  onOpenCompare: () => void;
  activeView: 'tracker' | 'analytics' | 'shopping' | 'mealprep' | 'favorites' | 'lifestyle' | 'insights';
  onViewChange: (view: 'tracker' | 'analytics' | 'shopping' | 'mealprep' | 'favorites' | 'lifestyle' | 'insights') => void;
}

export default function Header({ onOpenSettings, onOpenUtilities, onOpenVoice, onOpenCompare, activeView, onViewChange }: HeaderProps) {
  const { t } = useTranslation();
  const navItems = [
    { id: 'tracker' as const, label: t('header.tracker'), icon: Flame },
    { id: 'lifestyle' as const, label: t('header.lifestyle'), icon: Coffee },
    { id: 'analytics' as const, label: t('header.analytics'), icon: BarChart2 },
    { id: 'insights' as const, label: t('header.insights'), icon: Lightbulb },
    { id: 'shopping' as const, label: t('header.shopping'), icon: ShoppingCart },
    { id: 'mealprep' as const, label: t('header.mealprep'), icon: Calendar },
    { id: 'favorites' as const, label: t('header.favorites'), icon: Heart },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 dark:bg-gray-900/80 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Branding Section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex-shrink-0">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div className="flex-shrink-0 hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">NutriAI</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Smart Calorie Tracker</p>
            </div>
            <div className="block sm:hidden">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">NutriAI</h1>
            </div>
          </div>

          {/* Action Buttons - Properly spaced */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Voice Button - Compact and non-overlapping */}
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors dark:text-gray-300 dark:bg-red-900/20 dark:hover:bg-red-900/30"
              title="Voice Input"
            >
              <Mic2 className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400 hidden xs:inline">Voice</span>
            </button>

            {/* Secondary Actions - Icons only to save space */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={onOpenCompare}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
                title="Compare Foods"
              >
                <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </button>

              <button
                onClick={onOpenUtilities}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
                title="Utilities"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <ThemeToggle />

              <LanguageSwitcher variant="icon" />

              <button
                onClick={onOpenSettings}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide mt-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
