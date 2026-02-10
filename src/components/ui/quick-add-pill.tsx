import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";

interface QuickAddPillProps {
  onOpen: () => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export function QuickAddPill({
  onOpen,
  className,
  label = "Quick Add",
  disabled = false,
}: QuickAddPillProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      aria-label="Quick add"
      className={cn(
        "group fixed bottom-4 left-4 z-50 inline-flex h-11 items-center gap-2 rounded-full border border-border/50 bg-background/60 px-2.5 shadow-lg backdrop-blur-md transition-all duration-200",
        "hover:-translate-y-0.5 hover:bg-background/70 hover:shadow-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "sm:bottom-6 sm:left-6",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/30 text-foreground transition-colors group-hover:bg-muted/50"
      >
        <Plus className="h-4 w-4" />
      </span>

      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
