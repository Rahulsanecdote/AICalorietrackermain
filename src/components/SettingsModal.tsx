import { useState, useEffect } from 'react';
import { X, Save, Settings, Target, User, Globe } from 'lucide-react';
import { UserSettings } from '../types';
import { LanguageSwitcher } from './features/LanguageSwitcher';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [activeTab, setActiveTab] = useState<'goals' | 'profile' | 'language'>('goals');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const toggleDietaryPreference = (preference: string) => {
    const currentPrefs = localSettings.dietaryPreferences || [];
    const updatedPrefs = currentPrefs.includes(preference)
      ? currentPrefs.filter(p => p !== preference)
      : [...currentPrefs, preference];

    setLocalSettings({
      ...localSettings,
      dietaryPreferences: updatedPrefs,
    });
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
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
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'profile'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profile
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
                <div>
                  <label htmlFor="dailyCalorieGoal" className="block text-sm font-medium text-foreground mb-2">
                    Daily Calorie Goal
                  </label>
                  <div className="relative">
                    <input
                      id="dailyCalorieGoal"
                      name="dailyCalorieGoal"
                      type="number"
                      value={localSettings.dailyCalorieGoal}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          dailyCalorieGoal: parseInt(e.target.value) || 2000,
                        })
                      }
                      className="w-full px-4 py-2 pr-12 bg-card dark:bg-gray-950 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                      placeholder="2000"
                      min="500"
                      max="10000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      cal
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Macronutrient Goals
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="proteinGoal" className="block text-sm text-muted-foreground mb-1">
                        Protein Goal
                      </label>
                      <div className="relative">
                        <input
                          id="proteinGoal"
                          name="proteinGoal"
                          type="number"
                          value={localSettings.proteinGoal_g}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              proteinGoal_g: parseInt(e.target.value) || 150,
                            })
                          }
                          className="w-full px-4 py-2 pr-12 bg-card dark:bg-gray-950 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground"
                          placeholder="150"
                          min="0"
                          max="500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                          g
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="carbsGoal" className="block text-sm text-muted-foreground mb-1">
                        Carbs Goal
                      </label>
                      <div className="relative">
                        <input
                          id="carbsGoal"
                          name="carbsGoal"
                          type="number"
                          value={localSettings.carbsGoal_g}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              carbsGoal_g: parseInt(e.target.value) || 250,
                            })
                          }
                          className="w-full px-4 py-2 pr-12 bg-card dark:bg-gray-950 border border-input rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-foreground"
                          placeholder="250"
                          min="0"
                          max="1000"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                          g
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="fatGoal" className="block text-sm text-muted-foreground mb-1">
                        Fat Goal
                      </label>
                      <div className="relative">
                        <input
                          id="fatGoal"
                          name="fatGoal"
                          type="number"
                          value={localSettings.fatGoal_g}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              fatGoal_g: parseInt(e.target.value) || 65,
                            })
                          }
                          className="w-full px-4 py-2 pr-12 bg-card dark:bg-gray-950 border border-input rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
                          placeholder="65"
                          min="0"
                          max="300"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                          g
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-foreground mb-2">
                      Age
                    </label>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      value={localSettings.age || ''}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          age: parseInt(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-4 py-2 bg-card dark:bg-gray-950 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-foreground"
                      placeholder="30"
                      min="10"
                      max="100"
                    />
                  </div>

                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-foreground mb-2">
                      Weight (kg)
                    </label>
                    <input
                      id="weight"
                      name="weight"
                      type="number"
                      value={localSettings.weight || ''}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          weight: parseFloat(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-4 py-2 bg-card dark:bg-gray-950 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-foreground"
                      placeholder="70"
                      min="30"
                      max="300"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-foreground mb-2">
                    Height (cm)
                  </label>
                  <input
                    id="height"
                    name="height"
                    type="number"
                    value={localSettings.height || ''}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        height: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-4 py-2 bg-card dark:bg-gray-950 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-foreground"
                    placeholder="175"
                    min="100"
                    max="250"
                  />
                </div>

                <div>
                  <label htmlFor="activityLevel" className="block text-sm font-medium text-foreground mb-2">
                    Activity Level
                  </label>
                  <select
                    id="activityLevel"
                    name="activityLevel"
                    value={localSettings.activityLevel || 'moderately_active'}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        activityLevel: e.target.value as UserSettings['activityLevel'],
                      })
                    }
                    className="w-full px-4 py-2 bg-card dark:bg-gray-950 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-foreground"
                  >
                    <option value="sedentary">Sedentary (little/no exercise)</option>
                    <option value="lightly_active">Lightly Active (light exercise 1-3 days/week)</option>
                    <option value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</option>
                    <option value="very_active">Very Active (hard exercise 6-7 days/week)</option>
                    <option value="extra_active">Extra Active (very hard exercise, physical job)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="goal" className="block text-sm font-medium text-foreground mb-2">
                    Goal
                  </label>
                  <select
                    id="goal"
                    name="goal"
                    value={localSettings.goal || 'maintain'}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        goal: e.target.value as UserSettings['goal'],
                      })
                    }
                    className="w-full px-4 py-2 bg-card dark:bg-gray-950 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-foreground"
                  >
                    <option value="lose">Weight Loss</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="gain">Muscle Gain</option>
                  </select>
                </div>

                <div>
                  <span className="block text-sm font-medium text-foreground mb-2">
                    Dietary Preferences
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'vegetarian',
                      'vegan',
                      'gluten-free',
                      'dairy-free',
                      'high-protein',
                      'low-carb',
                      'mediterranean',
                      'keto',
                    ].map((preference) => (
                      <button
                        key={preference}
                        type="button"
                        onClick={() => toggleDietaryPreference(preference)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${(localSettings.dietaryPreferences || []).includes(preference)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                      >
                        {preference.replace('-', ' ')}
                      </button>
                    ))}
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
