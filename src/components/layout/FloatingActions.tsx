import { Meal } from "../../types";
import { cn } from "../../lib/utils";
import { NutriBotWidget } from "../ai/NutriBotWidget";
import { QuickAddWidget } from "../features/QuickAddWidget";

interface FloatingActionsProps {
  onQuickAddMeal: (meal: Meal) => void;
  className?: string;
}

export function FloatingActions({ onQuickAddMeal, className }: FloatingActionsProps) {
  return (
    <div
      className={cn("pointer-events-none fixed left-4 right-4 z-50 md:left-6 md:right-6", className)}
      style={{ bottom: "calc(16px + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3 md:max-w-none md:flex-row md:items-end md:justify-between">
        <div className="pointer-events-auto w-full md:w-auto">
          <QuickAddWidget
            onMealAdded={onQuickAddMeal}
            launcherClassName="w-full md:w-auto"
          />
        </div>

        <div className="pointer-events-auto w-full md:w-auto md:ml-auto">
          <NutriBotWidget launcherClassName="w-full md:w-auto md:ml-auto" />
        </div>
      </div>
    </div>
  );
}
