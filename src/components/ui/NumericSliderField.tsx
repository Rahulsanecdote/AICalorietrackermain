import React, { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

type SliderTone = "primary" | "blue" | "amber" | "red";

interface NumericSliderFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  className?: string;
  minLabel?: string;
  maxLabel?: string;
  description?: string;
  showSteppers?: boolean;
  tone?: SliderTone;
  formatValue?: (value: number) => string;
  actionSlot?: React.ReactNode;
  onChange: (value: number) => void;
}

const toneClasses: Record<SliderTone, string> = {
  primary: "numeric-slider-tone-primary",
  blue: "numeric-slider-tone-blue",
  amber: "numeric-slider-tone-amber",
  red: "numeric-slider-tone-red",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getStepPrecision(step: number): number {
  const stepText = step.toString();
  const decimalPart = stepText.split(".")[1];
  return decimalPart ? decimalPart.length : 0;
}

function formatDefaultValue(value: number, precision: number, unit?: string): string {
  const baseValue = precision > 0 ? value.toFixed(precision) : `${Math.round(value)}`;
  return unit ? `${baseValue} ${unit}` : baseValue;
}

export default function NumericSliderField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  className,
  minLabel,
  maxLabel,
  description,
  showSteppers = true,
  tone = "primary",
  formatValue,
  actionSlot,
  onChange,
}: NumericSliderFieldProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const precision = useMemo(() => getStepPrecision(step), [step]);
  const safeValue = useMemo(() => clamp(value, min, max), [value, min, max]);
  const rangeSpan = max - min || 1;
  const percent = ((safeValue - min) / rangeSpan) * 100;

  const displayValue = formatValue ? formatValue(safeValue) : formatDefaultValue(safeValue, precision, unit);

  const normalize = (nextValue: number) => {
    const factor = 10 ** precision;
    const rounded = Math.round(clamp(nextValue, min, max) * factor) / factor;
    onChange(rounded);
  };

  const handleStepDown = () => normalize(safeValue - step);
  const handleStepUp = () => normalize(safeValue + step);

  return (
    <div className={cn("rounded-2xl border border-border/70 bg-card/60 p-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <div
          className={cn(
            "inline-flex min-w-[86px] justify-center rounded-xl border border-border/60 bg-background/80 px-3 py-1 text-sm font-semibold text-foreground transition-all duration-200",
            isInteracting && "scale-[1.03] shadow-[0_0_0_3px_hsl(var(--primary)/0.16)]",
          )}
          aria-live="polite"
        >
          {displayValue}
        </div>
      </div>

      <div className="mt-3">
        <input
          id={id}
          name={id}
          type="range"
          value={safeValue}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-label={label}
          aria-valuetext={displayValue}
          aria-describedby={`${id}-scale${description ? ` ${id}-desc` : ""}`}
          onFocus={() => setIsInteracting(true)}
          onBlur={() => setIsInteracting(false)}
          onPointerDown={() => setIsInteracting(true)}
          onPointerUp={() => setIsInteracting(false)}
          onPointerCancel={() => setIsInteracting(false)}
          onChange={(event) => normalize(Number(event.target.value))}
          className={cn(
            "numeric-slider-track w-full",
            toneClasses[tone],
            isInteracting && "numeric-slider-active",
            disabled && "cursor-not-allowed opacity-60",
          )}
          style={{ "--slider-fill": `${percent}%` } as React.CSSProperties}
        />
      </div>

      <div id={`${id}-scale`} className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted-foreground">{minLabel ?? formatDefaultValue(min, precision, unit)}</span>

        {showSteppers && (
          <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 p-0.5">
            <button
              type="button"
              onClick={handleStepDown}
              disabled={disabled || safeValue <= min}
              aria-label={`Decrease ${label}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleStepUp}
              disabled={disabled || safeValue >= max}
              aria-label={`Increase ${label}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <span className="text-[11px] text-muted-foreground">{maxLabel ?? formatDefaultValue(max, precision, unit)}</span>
      </div>

      {description && (
        <p id={`${id}-desc`} className="mt-2 text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {actionSlot ? <div className="mt-2">{actionSlot}</div> : null}
    </div>
  );
}
