import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SWITCH_THEME = {
  "--ease-spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
} as React.CSSProperties;

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "peer-checked:bg-primary peer-checked:border-primary",
        destructive: "peer-checked:bg-destructive peer-checked:border-destructive",
      },
      size: {
        default: "h-8 w-[52px]",
        sm: "h-6 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

let sharedAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (sharedAudioContext && sharedAudioContext.state !== "closed") return sharedAudioContext;
  const AudioContextCtor = window.AudioContext;
  if (!AudioContextCtor) return null;
  sharedAudioContext = new AudioContextCtor();
  return sharedAudioContext;
};

const playHapticFeedback = (type: "heavy" | "light" | "none") => {
  if (type === "none" || typeof window === "undefined") return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "heavy") {
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(180, now);
      oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gainNode.gain.setValueAtTime(0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      oscillator.start(now);
      oscillator.stop(now + 0.15);
    } else {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, now);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      oscillator.start(now);
      oscillator.stop(now + 0.08);
    }
  } catch {
    // Audio feedback is optional; ignore unsupported runtime environments.
  }
};

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof switchVariants> {
  onCheckedChange?: (checked: boolean) => void;
  showIcons?: boolean;
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
  haptic?: "heavy" | "light" | "none";
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      size,
      variant,
      checked,
      defaultChecked,
      onCheckedChange,
      showIcons = false,
      checkedIcon,
      uncheckedIcon,
      haptic = "none",
      style,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false);
    const [isPressed, setIsPressed] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked);
      }
    }, [checked]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const newValue = event.target.checked;
      playHapticFeedback(haptic);
      if (checked === undefined) {
        setIsChecked(newValue);
      }
      onCheckedChange?.(newValue);
    };

    const isSmall = size === "sm";
    const translateDist = isSmall ? "translate-x-[16px]" : "translate-x-[20px]";
    const handleSizeUnchecked = isSmall ? "h-3 w-3 ml-[2px]" : "h-4 w-4 ml-[2px]";
    const handleSizeChecked = isSmall ? "h-4 w-4" : "h-6 w-6";
    const handleSizePressed = isSmall ? "h-5 w-5 -ml-[2px]" : "h-7 w-7 -ml-[2px]";
    const iconClasses = isSmall ? "h-2.5 w-2.5" : "h-3.5 w-3.5";
    const shouldRenderIcons = showIcons || checkedIcon || uncheckedIcon;

    return (
      <label
        className={cn(
          "group relative inline-flex min-h-[48px] min-w-[48px] items-center justify-center",
          disabled && "cursor-not-allowed opacity-50",
        )}
        style={{ ...SWITCH_THEME, ...style }}
        onPointerDown={() => !disabled && setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => {
          setIsPressed(false);
          setIsHovered(false);
        }}
        onPointerEnter={() => !disabled && setIsHovered(true)}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />

        <div
          className={cn(
            switchVariants({ variant, size }),
            "border-border bg-muted",
            "peer-checked:border-primary peer-checked:bg-primary",
            className,
          )}
        >
          <div
            className={cn(
              "pointer-events-none block h-full w-full transition-all duration-300 ease-[var(--ease-spring)]",
              isChecked ? translateDist : "translate-x-0",
            )}
          >
            <div
              className={cn(
                "absolute left-[2px] top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full shadow-sm transition-all duration-300",
                isChecked ? "bg-primary-foreground" : "bg-foreground text-muted",
                isChecked && variant === "primary" && "text-primary",
                isChecked && variant === "destructive" && "text-destructive",
                isPressed
                  ? handleSizePressed
                  : isChecked || (shouldRenderIcons && !isSmall)
                    ? handleSizeChecked
                    : handleSizeUnchecked,
              )}
            >
              {shouldRenderIcons && (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-all duration-300",
                      isChecked ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-45 opacity-0",
                    )}
                  >
                    {checkedIcon ?? <Check className={iconClasses} strokeWidth={4} />}
                  </div>
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center text-muted-foreground transition-all duration-300",
                      !isChecked ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-45 opacity-0",
                    )}
                  >
                    {uncheckedIcon ?? <X className={iconClasses} strokeWidth={4} />}
                  </div>
                </div>
              )}
            </div>

            <div
              className={cn(
                "pointer-events-none absolute top-1/2 left-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200",
                isSmall ? "h-8 w-8" : "h-10 w-10",
                isChecked ? (variant === "destructive" ? "bg-destructive" : "bg-primary") : "bg-foreground",
                isPressed ? "scale-100 opacity-10" : isHovered ? "scale-100 opacity-5" : "scale-50 opacity-0",
                isChecked ? "left-[14px]" : shouldRenderIcons && !isSmall ? "left-[14px]" : "left-[10px]",
                isSmall && (isChecked ? "left-[10px]" : "left-[8px]"),
              )}
            />
          </div>
        </div>
      </label>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
