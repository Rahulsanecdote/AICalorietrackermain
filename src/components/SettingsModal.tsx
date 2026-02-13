import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Target, Globe } from 'lucide-react';
import { UserSettings } from '../types';
import { LanguageSwitcher } from './features/LanguageSwitcher';
import NumericSliderField from './ui/NumericSliderField';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: Partial<UserSettings>) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [activeTab, setActiveTab] = useState<'goals' | 'language'>('goals');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-xl border border-border">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Settings</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('goals')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'goals'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Goals
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('language')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'language'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Language
            </button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {activeTab === 'goals' && (
              <div className="space-y-4">
                <NumericSliderField
                  id="dailyCalorieGoal"
                  label="Daily Calorie Goal"
                  value={localSettings.dailyCalorieGoal}
                  min={500}
                  max={10000}
                  step={10}
                  unit="cal"
                  tone="primary"
                  minLabel="500 cal"
                  maxLabel="10000 cal"
                  description="Drag the value directly for quick changes, or tap it to type an exact target."
                  onChange={(value) =>
                    setLocalSettings({
                      ...localSettings,
                      dailyCalorieGoal: value,
                    })
                  }
                />

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Macronutrient Goals
                  </h3>
                  <div className="space-y-3">
                    <NumericSliderField
                      id="proteinGoal"
                      label="Protein Goal"
                      value={localSettings.proteinGoal_g}
                      min={0}
                      max={500}
                      step={1}
                      unit="g"
                      tone="blue"
                      onChange={(value) =>
                        setLocalSettings({
                          ...localSettings,
                          proteinGoal_g: value,
                        })
                      }
                    />

                    <NumericSliderField
                      id="carbsGoal"
                      label="Carbs Goal"
                      value={localSettings.carbsGoal_g}
                      min={0}
                      max={1000}
                      step={1}
                      unit="g"
                      tone="amber"
                      onChange={(value) =>
                        setLocalSettings({
                          ...localSettings,
                          carbsGoal_g: value,
                        })
                      }
                    />

                    <NumericSliderField
                      id="fatGoal"
                      label="Fat Goal"
                      value={localSettings.fatGoal_g}
                      min={0}
                      max={300}
                      step={1}
                      unit="g"
                      tone="red"
                      onChange={(value) =>
                        setLocalSettings({
                          ...localSettings,
                          fatGoal_g: value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-primary mb-2">
                    Choose Your Language
                  </h3>
                  <p className="text-sm text-primary/80">
                    Select your preferred language for the interface. This will affect all text displayed in the app.
                  </p>
                </div>

                <div>
                  <LanguageSwitcher variant="full" />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
