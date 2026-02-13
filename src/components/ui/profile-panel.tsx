import React, { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import type { UserSettings } from "@/types";
import NumericSliderField from "@/components/ui/NumericSliderField";

type ProfileSettings = Pick<
  UserSettings,
  "age" | "weight" | "height" | "activityLevel" | "goal" | "dietaryPreferences"
>;

interface ProfilePanelProps {
  settings: UserSettings;
  onSave: (profileSettings: Partial<UserSettings>) => void;
  onCancel?: () => void;
  saveLabel?: string;
  className?: string;
}

const DIETARY_PREFERENCES = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "high-protein",
  "low-carb",
  "mediterranean",
  "keto",
] as const;

function getProfileSettings(settings: UserSettings): ProfileSettings {
  return {
    age: settings.age,
    weight: settings.weight,
    height: settings.height,
    activityLevel: settings.activityLevel,
    goal: settings.goal,
    dietaryPreferences: settings.dietaryPreferences ?? [],
  };
}

export function ProfilePanel({
  settings,
  onSave,
  onCancel,
  saveLabel = "Save Profile",
  className,
}: ProfilePanelProps) {
  const [localProfile, setLocalProfile] = useState<ProfileSettings>(
    getProfileSettings(settings)
  );

  useEffect(() => {
    setLocalProfile(getProfileSettings(settings));
  }, [settings]);

  const dietaryPreferences = useMemo(
    () => localProfile.dietaryPreferences ?? [],
    [localProfile.dietaryPreferences]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      age: localProfile.age,
      weight: localProfile.weight,
      height: localProfile.height,
      activityLevel: localProfile.activityLevel,
      goal: localProfile.goal,
      dietaryPreferences,
    });
  };

  const toggleDietaryPreference = (preference: string) => {
    setLocalProfile((prev) => {
      const current = prev.dietaryPreferences ?? [];
      const next = current.includes(preference)
        ? current.filter((item) => item !== preference)
        : [...current, preference];

      return {
        ...prev,
        dietaryPreferences: next,
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumericSliderField
            id="profileAge"
            label="Age"
            value={localProfile.age ?? 30}
            min={10}
            max={100}
            step={1}
            unit="yrs"
            tone="primary"
            onChange={(value) =>
              setLocalProfile((prev) => ({
                ...prev,
                age: value,
              }))
            }
            actionSlot={
              localProfile.age !== undefined ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() =>
                    setLocalProfile((prev) => ({
                      ...prev,
                      age: undefined,
                    }))
                  }
                >
                  Clear age
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Age is currently optional.
                </span>
              )
            }
          />

          <NumericSliderField
            id="profileWeight"
            label="Weight"
            value={localProfile.weight ?? 70}
            min={30}
            max={300}
            step={0.1}
            unit="kg"
            tone="primary"
            onChange={(value) =>
              setLocalProfile((prev) => ({
                ...prev,
                weight: value,
              }))
            }
            actionSlot={
              localProfile.weight !== undefined ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() =>
                    setLocalProfile((prev) => ({
                      ...prev,
                      weight: undefined,
                    }))
                  }
                >
                  Clear weight
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Weight is currently optional.
                </span>
              )
            }
          />
        </div>

        <NumericSliderField
          id="profileHeight"
          label="Height"
          value={localProfile.height ?? 175}
          min={100}
          max={250}
          step={1}
          unit="cm"
          tone="primary"
          onChange={(value) =>
            setLocalProfile((prev) => ({
              ...prev,
              height: value,
            }))
          }
          actionSlot={
            localProfile.height !== undefined ? (
              <button
                type="button"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() =>
                  setLocalProfile((prev) => ({
                    ...prev,
                    height: undefined,
                  }))
                }
              >
                Clear height
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Height is currently optional.
              </span>
            )
          }
        />

        <div>
          <label
            htmlFor="profileActivityLevel"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Activity Level
          </label>
          <select
            id="profileActivityLevel"
            name="profileActivityLevel"
            value={localProfile.activityLevel || "moderately_active"}
            onChange={(event) =>
              setLocalProfile((prev) => ({
                ...prev,
                activityLevel: event.target.value as UserSettings["activityLevel"],
              }))
            }
            className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-emerald-500"
          >
            <option value="sedentary">Sedentary (little/no exercise)</option>
            <option value="lightly_active">
              Lightly Active (light exercise 1-3 days/week)
            </option>
            <option value="moderately_active">
              Moderately Active (moderate exercise 3-5 days/week)
            </option>
            <option value="very_active">
              Very Active (hard exercise 6-7 days/week)
            </option>
            <option value="extra_active">
              Extra Active (very hard exercise, physical job)
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="profileGoal"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Goal
          </label>
          <select
            id="profileGoal"
            name="profileGoal"
            value={localProfile.goal || "maintain"}
            onChange={(event) =>
              setLocalProfile((prev) => ({
                ...prev,
                goal: event.target.value as UserSettings["goal"],
              }))
            }
            className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-emerald-500"
          >
            <option value="lose">Weight Loss</option>
            <option value="maintain">Maintain Weight</option>
            <option value="gain">Muscle Gain</option>
          </select>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-foreground">
            Dietary Preferences
          </span>
          <div className="grid grid-cols-2 gap-2">
            {DIETARY_PREFERENCES.map((preference) => (
              <button
                key={preference}
                type="button"
                onClick={() => toggleDietaryPreference(preference)}
                className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-all ${
                  dietaryPreferences.includes(preference)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {preference.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3 border-t border-border pt-4">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Back
          </button>
        ) : null}
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Save className="h-4 w-4" />
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
