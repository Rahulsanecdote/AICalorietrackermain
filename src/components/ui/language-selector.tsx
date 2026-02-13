import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface LanguageSelectorOption<TCode extends string = string> {
  code: TCode;
  label: string;
  flagEmoji: string;
}

interface LanguageSelectorProps<TCode extends string = string> {
  value: TCode;
  onChange: (code: TCode) => void;
  options: Array<LanguageSelectorOption<TCode>>;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function LanguageSelector<TCode extends string = string>({
  value,
  onChange,
  options,
  className,
  disabled = false,
  ariaLabel = "Select language",
}: LanguageSelectorProps<TCode>) {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.code === value) ?? options[0],
    [options, value]
  );

  if (!selectedOption) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label={`${ariaLabel}: ${selectedOption.label}`}
          className={cn(
            "group inline-flex h-11 w-full items-center justify-between rounded-full border border-border/55 bg-card/70 px-4 text-sm text-foreground shadow-[0_12px_28px_hsl(var(--foreground)/0.12),inset_0_1px_0_hsl(var(--foreground)/0.09)] backdrop-blur-xl transition-all duration-200 hover:bg-card/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/75 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 md:h-10 md:max-w-xs",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-base leading-none" aria-hidden="true">
              {selectedOption.flagEmoji}
            </span>
            <span className="truncate font-medium">{selectedOption.label}</span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={10}
        collisionPadding={12}
        className="w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border/60 bg-card/92 p-1 text-foreground shadow-[0_20px_50px_hsl(var(--foreground)/0.24)] backdrop-blur-2xl"
      >
        <div className="max-h-[min(18rem,55vh)] overflow-y-auto px-1 py-1">
          {options.map((option) => {
            const isActive = option.code === value;
            return (
              <DropdownMenuItem
                key={option.code}
                onSelect={() => onChange(option.code)}
                aria-label={`${option.label}${isActive ? ", selected" : ""}`}
                className={cn(
                  "mb-1 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors focus:bg-accent/60 focus:text-foreground",
                  isActive
                    ? "bg-accent/55 text-foreground"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                )}
              >
                <span className="text-base leading-none" aria-hidden="true">
                  {option.flagEmoji}
                </span>
                <span className="flex-1 truncate font-medium">{option.label}</span>
                {isActive ? (
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
