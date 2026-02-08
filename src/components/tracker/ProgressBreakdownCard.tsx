import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { DailyTotals, UserSettings } from "../../types";
import { Card } from "../ui/card";
import { DonutChart, type DonutChartSegment } from "../ui/donut-chart";
import { cn } from "@/lib/utils";

interface ProgressBreakdownCardProps {
  totals: DailyTotals;
  settings: UserSettings;
}

type MacroKey = "protein" | "carbs" | "fat";

interface MacroBreakdown {
  key: MacroKey;
  label: string;
  grams: number;
  goal?: number;
  calories: number;
  color: string;
}

const MACRO_KCAL_MULTIPLIER: Record<MacroKey, number> = {
  protein: 4,
  carbs: 4,
  fat: 9,
};

export default function ProgressBreakdownCard({ totals, settings }: ProgressBreakdownCardProps) {
  const { t } = useTranslation();
  const [hoveredKey, setHoveredKey] = useState<MacroKey | null>(null);
  const [pinnedKey, setPinnedKey] = useState<MacroKey | null>(null);

  const consumedCalories = totals.calories;
  const calorieGoal = settings.dailyCalorieGoal;
  const remainingCalories = Math.max(calorieGoal - consumedCalories, 0);
  const overByCalories = Math.max(consumedCalories - calorieGoal, 0);
  const isOverGoal = consumedCalories > calorieGoal;
  const progressPercent = calorieGoal > 0 ? Math.min((consumedCalories / calorieGoal) * 100, 100) : 0;

  const macroBreakdown = useMemo<MacroBreakdown[]>(
    () => [
      {
        key: "protein",
        label: t("mealPlan.protein"),
        grams: totals.protein_g,
        goal: settings.proteinGoal_g,
        calories: totals.protein_g * MACRO_KCAL_MULTIPLIER.protein,
        color: "hsl(var(--sage))",
      },
      {
        key: "carbs",
        label: t("mealPlan.carbs"),
        grams: totals.carbs_g,
        goal: settings.carbsGoal_g,
        calories: totals.carbs_g * MACRO_KCAL_MULTIPLIER.carbs,
        color: "hsl(var(--warm))",
      },
      {
        key: "fat",
        label: t("mealPlan.fat"),
        grams: totals.fat_g,
        goal: settings.fatGoal_g,
        calories: totals.fat_g * MACRO_KCAL_MULTIPLIER.fat,
        color: "hsl(var(--warning))",
      },
    ],
    [
      settings.carbsGoal_g,
      settings.fatGoal_g,
      settings.proteinGoal_g,
      t,
      totals.carbs_g,
      totals.fat_g,
      totals.protein_g,
    ],
  );

  const macroCaloriesTotal = macroBreakdown.reduce((sum, macro) => sum + macro.calories, 0);
  const activeKey = pinnedKey ?? hoveredKey;
  const activeMacro = activeKey ? macroBreakdown.find((macro) => macro.key === activeKey) ?? null : null;

  const donutData: DonutChartSegment[] = macroBreakdown.map((macro) => ({
    label: macro.key,
    value: macro.calories,
    color: macro.color,
    ariaLabel: `${macro.label}: ${macro.grams} grams, ${macro.calories} calories`,
    macro,
  }));

  const handleSegmentHover = (segment: DonutChartSegment | null) => {
    if (pinnedKey) return;
    if (!segment) {
      setHoveredKey(null);
      return;
    }
    const nextKey = typeof segment.label === "string" ? (segment.label as MacroKey) : null;
    setHoveredKey(nextKey);
  };

  const handleSegmentSelect = (segment: DonutChartSegment) => {
    const nextKey = segment.label as MacroKey;
    setPinnedKey((current) => (current === nextKey ? null : nextKey));
  };

  return (
    <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("dashboard.todaysProgress")}</h2>

      <div className="flex justify-center">
        <DonutChart
          data={donutData}
          totalValue={macroCaloriesTotal}
          size={250}
          strokeWidth={30}
          animationDuration={1.1}
          animationDelayPerSegment={0.04}
          highlightOnHover
          activeSegmentLabel={activeKey}
          onSegmentHover={handleSegmentHover}
          onSegmentSelect={handleSegmentSelect}
          centerContent={
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMacro?.key ?? "total"}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "circOut" }}
                className="flex flex-col items-center justify-center text-center"
              >
                <p className="max-w-[150px] truncate text-sm font-medium text-muted-foreground">
                  {activeMacro ? activeMacro.label : t("dashboard.dailyGoal")}
                </p>
                <p className="text-4xl font-bold text-foreground">{consumedCalories}</p>
                <p className="text-sm text-muted-foreground">{t("dashboard.consumed")}</p>
                <p className={cn("text-sm font-medium", isOverGoal ? "text-destructive" : "text-primary")}>
                  {isOverGoal
                    ? `${t("dashboard.overBy", { defaultValue: "over by" })} ${overByCalories}`
                    : `${remainingCalories} ${t("dashboard.remaining")}`}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {Math.round(progressPercent)}% of {calorieGoal} kcal
                </p>
                {activeMacro && <p className="mt-1 text-xs text-muted-foreground">{activeMacro.calories} kcal</p>}
              </motion.div>
            </AnimatePresence>
          }
        />
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t("dashboard.macronutrients")}</h3>
        <div className="space-y-2">
          {macroBreakdown.map((macro) => {
            const isActive = activeKey === macro.key;
            const hasGoal = typeof macro.goal === "number";
            return (
              <button
                key={macro.key}
                type="button"
                className={cn(
                  "w-full rounded-md border border-transparent px-3 py-2 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive ? "bg-accent ring-1 ring-border" : "hover:bg-muted/50",
                )}
                aria-label={`${macro.label}: ${macro.grams} grams${hasGoal ? `, goal ${macro.goal} grams` : ""}, ${macro.calories} calories`}
                onMouseEnter={() => setHoveredKey(macro.key)}
                onMouseLeave={() => {
                  if (!pinnedKey) setHoveredKey(null);
                }}
                onFocus={() => setHoveredKey(macro.key)}
                onBlur={() => {
                  if (!pinnedKey) setHoveredKey(null);
                }}
                onClick={() => setPinnedKey((current) => (current === macro.key ? null : macro.key))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPinnedKey((current) => (current === macro.key ? null : macro.key));
                  }
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: macro.color }} aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">{macro.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{macro.calories} kcal</span>
                </div>
                <p className="mt-1 pl-6 text-xs text-muted-foreground">
                  {macro.grams}g
                  {hasGoal ? ` / ${macro.goal}g ${t("mealPlan.goal").toLowerCase()}` : ""}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
