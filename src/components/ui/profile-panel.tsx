import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import type { GoalAggressiveness, UserSettings } from "@/types";
import NumericSliderField from "@/components/ui/NumericSliderField";
import { DEFAULT_SETTINGS } from "@/constants";
import {
  cmToFtIn,
  computeSmartGoalSummary,
  ftInToCm,
  getNormalizedAggressiveness,
  kgToLb,
  lbToKg,
} from "@/utils/smartGoals";

interface ProfilePanelProps {
  settings: UserSettings;
  onSave: (profileSettings: Partial<UserSettings>) => void;
  onCancel?: () => void;
  saveLabel?: string;
  className?: string;
}

type ProfileSettings = Pick<
  UserSettings,
  | "age"
  | "weight"
  | "height"
  | "activityLevel"
  | "goal"
  | "dietaryPreferences"
  | "sexAtBirth"
  | "calorieGoalMode"
  | "manualCalorieGoal"
  | "goalAggressiveness"
  | "weightUnit"
  | "heightUnit"
>;

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
    age: settings.age ?? DEFAULT_SETTINGS.age,
    weight: settings.weight ?? DEFAULT_SETTINGS.weight,
    height: settings.height ?? DEFAULT_SETTINGS.height,
    activityLevel: settings.activityLevel ?? DEFAULT_SETTINGS.activityLevel,
    goal: settings.goal ?? DEFAULT_SETTINGS.goal,
    sexAtBirth: settings.sexAtBirth ?? DEFAULT_SETTINGS.sexAtBirth,
    calorieGoalMode: settings.calorieGoalMode ?? DEFAULT_SETTINGS.calorieGoalMode,
    manualCalorieGoal: settings.manualCalorieGoal,
    goalAggressiveness:
      settings.goalAggressiveness ?? DEFAULT_SETTINGS.goalAggressiveness,
    weightUnit: settings.weightUnit ?? DEFAULT_SETTINGS.weightUnit,
    heightUnit: settings.heightUnit ?? DEFAULT_SETTINGS.heightUnit,
    dietaryPreferences: settings.dietaryPreferences ?? [],
  };
}

function getAggressivenessOptions(goal: UserSettings["goal"]) {
  if (goal === "lose") {
    return [
      { value: "mild", label: "Mild" },
      { value: "standard", label: "Standard" },
      { value: "aggressive", label: "Aggressive" },
    ] as const;
  }

  if (goal === "gain") {
    return [
      { value: "lean", label: "Lean" },
      { value: "standard", label: "Standard" },
      { value: "aggressive", label: "Aggressive" },
    ] as const;
  }

  return [{ value: "standard", label: "Balanced" }] as const;
}

function formatFtIn(heightCm: number): string {
  const { feet, inches } = cmToFtIn(heightCm);
  return `${feet}' ${inches}"`;
}

export function ProfilePanel({
  settings,
  onSave,
  onCancel,
  saveLabel = "Save Profile",
  className,
}: ProfilePanelProps) {
  const [localProfile, setLocalProfile] = useState<ProfileSettings>(
    getProfileSettings(settings),
  );

  useEffect(() => {
    setLocalProfile(getProfileSettings(settings));
  }, [settings]);

  const dietaryPreferences = useMemo(
    () => localProfile.dietaryPreferences ?? [],
    [localProfile.dietaryPreferences],
  );

  const normalizedAggressiveness = useMemo(
    () =>
      getNormalizedAggressiveness(
        localProfile.goal ?? DEFAULT_SETTINGS.goal,
        localProfile.goalAggressiveness ?? DEFAULT_SETTINGS.goalAggressiveness,
      ),
    [localProfile.goal, localProfile.goalAggressiveness],
  );

  const smartSummary = useMemo(
    () =>
      computeSmartGoalSummary({
        age: localProfile.age ?? DEFAULT_SETTINGS.age,
        weightKg: localProfile.weight ?? DEFAULT_SETTINGS.weight,
        heightCm: localProfile.height ?? DEFAULT_SETTINGS.height,
        activityLevel: localProfile.activityLevel ?? DEFAULT_SETTINGS.activityLevel,
        goal: localProfile.goal ?? DEFAULT_SETTINGS.goal,
        goalAggressiveness: normalizedAggressiveness,
        sexAtBirth: localProfile.sexAtBirth ?? DEFAULT_SETTINGS.sexAtBirth,
      }),
    [
      localProfile.age,
      localProfile.weight,
      localProfile.height,
      localProfile.activityLevel,
      localProfile.goal,
      localProfile.sexAtBirth,
      normalizedAggressiveness,
    ],
  );

  const displayedWeight =
    localProfile.weightUnit === "lb"
      ? kgToLb(localProfile.weight ?? DEFAULT_SETTINGS.weight)
      : localProfile.weight ?? DEFAULT_SETTINGS.weight;

  const weightRange =
    localProfile.weightUnit === "lb"
      ? { min: 66, max: 660, step: 0.1, unit: "lb", minLabel: "66 lb", maxLabel: "660 lb" }
      : {
          min: 30,
          max: 300,
          step: 0.1,
          unit: "kg",
          minLabel: "30 kg",
          maxLabel: "300 kg",
        };

  const { feet: heightFeet, inches: heightInches } = cmToFtIn(
    localProfile.height ?? DEFAULT_SETTINGS.height,
  );

  const effectiveCalories =
    localProfile.calorieGoalMode === "manual"
      ? localProfile.manualCalorieGoal ?? smartSummary.smartCalories
      : smartSummary.smartCalories;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const sharedPayload: Partial<UserSettings> = {
      age: localProfile.age,
      weight: localProfile.weight,
      height: localProfile.height,
      activityLevel: localProfile.activityLevel,
      goal: localProfile.goal,
      sexAtBirth: localProfile.sexAtBirth,
      calorieGoalMode: localProfile.calorieGoalMode,
      goalAggressiveness: normalizedAggressiveness,
      weightUnit: localProfile.weightUnit,
      heightUnit: localProfile.heightUnit,
      dietaryPreferences,
    };

    if (localProfile.calorieGoalMode === "manual") {
      const manualValue = Math.max(
        500,
        Math.min(10000, localProfile.manualCalorieGoal ?? smartSummary.smartCalories),
      );
      onSave({
        ...sharedPayload,
        manualCalorieGoal: manualValue,
        dailyCalorieGoal: manualValue,
      });
      return;
    }

    onSave({
      ...sharedPayload,
      manualCalorieGoal: undefined,
      dailyCalorieGoal: smartSummary.smartCalories,
      proteinGoal_g: smartSummary.smartMacros.protein,
      carbsGoal_g: smartSummary.smartMacros.carbs,
      fatGoal_g: smartSummary.smartMacros.fat,
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

  const setImperialPreset = () => {
    setLocalProfile((prev) => ({
      ...prev,
      weightUnit: "lb",
      heightUnit: "ft_in",
    }));
  };

  const setMetricPreset = () => {
    setLocalProfile((prev) => ({
      ...prev,
      weightUnit: "kg",
      heightUnit: "cm",
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-5">
        <section className="rounded-2xl border border-border/70 bg-card/50 p-3">
          <h3 className="text-sm font-semibold text-foreground">Units</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Internal calculations always use metric values for stability.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={setMetricPreset}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                localProfile.weightUnit === "kg" && localProfile.heightUnit === "cm"
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Metric
            </button>
            <button
              type="button"
              onClick={setImperialPreset}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                localProfile.weightUnit === "lb" && localProfile.heightUnit === "ft_in"
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Imperial
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Weight Unit</p>
              <div className="inline-flex rounded-xl border border-border bg-background/60 p-1">
                {(["kg", "lb"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() =>
                      setLocalProfile((prev) => ({
                        ...prev,
                        weightUnit: unit,
                      }))
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      localProfile.weightUnit === unit
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {unit.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Height Unit</p>
              <div className="inline-flex rounded-xl border border-border bg-background/60 p-1">
                {(["cm", "ft_in"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() =>
                      setLocalProfile((prev) => ({
                        ...prev,
                        heightUnit: unit,
                      }))
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      localProfile.heightUnit === unit
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {unit === "ft_in" ? "FT + IN" : "CM"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumericSliderField
            id="profileAge"
            label="Age"
            value={localProfile.age ?? DEFAULT_SETTINGS.age}
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
          />

          <NumericSliderField
            id="profileWeight"
            label="Weight"
            value={displayedWeight}
            min={weightRange.min}
            max={weightRange.max}
            step={weightRange.step}
            unit={weightRange.unit}
            tone="primary"
            minLabel={weightRange.minLabel}
            maxLabel={weightRange.maxLabel}
            onChange={(value) =>
              setLocalProfile((prev) => ({
                ...prev,
                weight: prev.weightUnit === "lb" ? lbToKg(value) : value,
              }))
            }
          />
        </div>

        {localProfile.heightUnit === "cm" ? (
          <NumericSliderField
            id="profileHeight"
            label="Height"
            value={localProfile.height ?? DEFAULT_SETTINGS.height}
            min={100}
            max={250}
            step={0.5}
            unit="cm"
            tone="primary"
            minLabel="100 cm"
            maxLabel="250 cm"
            onChange={(value) =>
              setLocalProfile((prev) => ({
                ...prev,
                height: value,
              }))
            }
          />
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card/60 p-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Height</label>
              <span className="text-xs text-muted-foreground">
                {formatFtIn(localProfile.height ?? DEFAULT_SETTINGS.height)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="heightFeet" className="mb-1 block text-xs text-muted-foreground">
                  Feet
                </label>
                <input
                  id="heightFeet"
                  type="number"
                  min={3}
                  max={8}
                  value={heightFeet}
                  onChange={(event) => {
                    const nextFeet = Number(event.target.value);
                    const safeFeet = Number.isFinite(nextFeet)
                      ? Math.max(3, Math.min(8, Math.floor(nextFeet)))
                      : heightFeet;
                    setLocalProfile((prev) => ({
                      ...prev,
                      height: ftInToCm(safeFeet, heightInches),
                    }));
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-background/70 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                />
              </div>
              <div>
                <label htmlFor="heightInches" className="mb-1 block text-xs text-muted-foreground">
                  Inches
                </label>
                <input
                  id="heightInches"
                  type="number"
                  min={0}
                  max={11}
                  value={heightInches}
                  onChange={(event) => {
                    const nextInches = Number(event.target.value);
                    const safeInches = Number.isFinite(nextInches)
                      ? Math.max(0, Math.min(11, Math.floor(nextInches)))
                      : heightInches;
                    setLocalProfile((prev) => ({
                      ...prev,
                      height: ftInToCm(heightFeet, safeInches),
                    }));
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-background/70 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="profileSexAtBirth"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Sex at birth
          </label>
          <select
            id="profileSexAtBirth"
            value={localProfile.sexAtBirth || "unspecified"}
            onChange={(event) =>
              setLocalProfile((prev) => ({
                ...prev,
                sexAtBirth: event.target.value as UserSettings["sexAtBirth"],
              }))
            }
            className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-emerald-500"
          >
            <option value="unspecified">Use generic estimate</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="profileActivityLevel"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Activity Level
          </label>
          <select
            id="profileActivityLevel"
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
              Athlete (intense training / physical job)
            </option>
          </select>
        </div>

        <section className="rounded-2xl border border-border/70 bg-card/50 p-4">
          <h3 className="text-sm font-semibold text-foreground">Smart Goals</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            NutriAI estimates your daily target using BMI, BMR, TDEE and selected objective.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">BMI</p>
              <p className="text-sm font-semibold text-foreground">{smartSummary.bmi}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">BMR</p>
              <p className="text-sm font-semibold text-foreground">{smartSummary.bmr} kcal</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">TDEE</p>
              <p className="text-sm font-semibold text-foreground">{smartSummary.tdee} kcal</p>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="profileGoal" className="mb-2 block text-sm font-medium text-foreground">
              Goal Type
            </label>
            <select
              id="profileGoal"
              value={localProfile.goal || "maintain"}
              onChange={(event) =>
                setLocalProfile((prev) => ({
                  ...prev,
                  goal: event.target.value as UserSettings["goal"],
                  goalAggressiveness: getNormalizedAggressiveness(
                    event.target.value as UserSettings["goal"],
                    prev.goalAggressiveness ?? DEFAULT_SETTINGS.goalAggressiveness,
                  ),
                }))
              }
              className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-emerald-500"
            >
              <option value="lose">Weight Loss</option>
              <option value="maintain">Maintain Weight</option>
              <option value="gain">Muscle Gain</option>
            </select>
          </div>

          <div className="mt-3">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Aggressiveness
            </span>
            <div className="inline-flex rounded-xl border border-border bg-background/60 p-1">
              {getAggressivenessOptions(localProfile.goal).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setLocalProfile((prev) => ({
                      ...prev,
                      goalAggressiveness: option.value as GoalAggressiveness,
                    }))
                  }
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    normalizedAggressiveness === option.value
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">
              Target
            </p>
            <p className="text-base font-semibold text-foreground">
              {effectiveCalories} kcal/day
            </p>
            {localProfile.calorieGoalMode === "manual" ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Smart estimate: {smartSummary.smartCalories} kcal/day
              </p>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/60 bg-background/50 px-2 py-1 text-center">
              <p className="text-[11px] text-muted-foreground">Protein</p>
              <p className="text-xs font-semibold text-foreground">
                {smartSummary.smartMacros.protein}g
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/50 px-2 py-1 text-center">
              <p className="text-[11px] text-muted-foreground">Carbs</p>
              <p className="text-xs font-semibold text-foreground">
                {smartSummary.smartMacros.carbs}g
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/50 px-2 py-1 text-center">
              <p className="text-[11px] text-muted-foreground">Fat</p>
              <p className="text-xs font-semibold text-foreground">
                {smartSummary.smartMacros.fat}g
              </p>
            </div>
          </div>

          <div className="mt-4">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Calorie Mode
            </span>
            <div className="inline-flex rounded-xl border border-border bg-background/60 p-1">
              {(["auto", "manual"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    setLocalProfile((prev) => ({
                      ...prev,
                      calorieGoalMode: mode,
                      manualCalorieGoal:
                        mode === "manual"
                          ? prev.manualCalorieGoal ?? smartSummary.smartCalories
                          : undefined,
                    }))
                  }
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    (localProfile.calorieGoalMode ?? "auto") === mode
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "auto" ? "Auto (Smart)" : "Manual"}
                </button>
              ))}
            </div>
          </div>

          {localProfile.calorieGoalMode === "manual" ? (
            <div className="mt-3 space-y-2">
              <label
                htmlFor="manualCalorieGoal"
                className="block text-sm font-medium text-foreground"
              >
                Manual Daily Calories
              </label>
              <input
                id="manualCalorieGoal"
                type="number"
                min={500}
                max={10000}
                step={10}
                value={localProfile.manualCalorieGoal ?? smartSummary.smartCalories}
                onChange={(event) =>
                  setLocalProfile((prev) => ({
                    ...prev,
                    manualCalorieGoal: Math.max(
                      500,
                      Math.min(10000, Number(event.target.value) || smartSummary.smartCalories),
                    ),
                  }))
                }
                className="h-11 w-full rounded-xl border border-border bg-background/70 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
              <button
                type="button"
                onClick={() =>
                  setLocalProfile((prev) => ({
                    ...prev,
                    calorieGoalMode: "auto",
                    manualCalorieGoal: undefined,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/60 px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset to Smart
              </button>
            </div>
          ) : null}

          {smartSummary.warnings.length > 0 ? (
            <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
              {smartSummary.warnings.map((warning) => (
                <p key={warning} className="text-xs text-amber-200">
                  {warning}
                </p>
              ))}
            </div>
          ) : null}

          <p className="mt-3 text-xs text-muted-foreground">
            Estimates only. Consult a professional for medical conditions.
          </p>
        </section>

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

