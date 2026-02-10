import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

interface QuickAddPillProps {
  onOpen: () => void;
  className?: string;
  label?: string;
  disabled?: boolean;
  iconOnlyOnMobile?: boolean;
}

export function QuickAddPill({
  onOpen,
  className,
  label = "Quick Add",
  disabled = false,
  iconOnlyOnMobile = false,
}: QuickAddPillProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size={iconOnlyOnMobile ? "icon" : "default"}
      onClick={onOpen}
      disabled={disabled}
      aria-label="Quick Add"
      className={cn(
        "group h-11 rounded-full border-border/50 bg-background/60 shadow-lg backdrop-blur-md transition-all duration-200",
        "hover:-translate-y-0.5 hover:bg-background/70 hover:shadow-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        iconOnlyOnMobile
          ? "w-11 border px-0 md:w-auto md:justify-start md:gap-2 md:px-2.5"
          : "inline-flex items-center gap-2 border px-2.5",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/30 text-foreground transition-colors group-hover:bg-muted/50"
      >
        <Plus className="h-4 w-4" />
      </span>

      <span
        className={cn(
          "text-sm font-medium text-muted-foreground",
          iconOnlyOnMobile && "hidden md:inline"
        )}
      >
        {label}
      </span>

      {iconOnlyOnMobile && <span className="sr-only">Quick Add</span>}
    </Button>
  );
}
