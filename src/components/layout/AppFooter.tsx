import { Meal } from "../../types";
import { cn } from "../../lib/utils";
import { NutriBotWidget } from "../ai/NutriBotWidget";
import { QuickAddWidget } from "../features/QuickAddWidget";

interface AppFooterProps {
  onQuickAddMeal: (meal: Meal) => void;
  className?: string;
}

export function AppFooter({ onQuickAddMeal, className }: AppFooterProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 shadow-[0_-8px_24px_hsl(var(--background)/0.45)] supports-[backdrop-filter]:bg-background/75 supports-[backdrop-filter]:backdrop-blur-xl",
        className
      )}
      style={{
        minHeight: "var(--app-footer-h)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto flex h-[var(--app-footer-h)] max-w-4xl items-center gap-3 px-4">
        <QuickAddWidget
          onMealAdded={onQuickAddMeal}
          launcherIconOnlyOnMobile
          launcherClassName="shrink-0"
        />
        <NutriBotWidget launcherClassName="min-w-0 flex-1 md:ml-auto md:w-[18rem] md:flex-none" />
      </div>
    </div>
  );
}
