import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

type SliderTone = "primary" | "blue" | "amber" | "red";
type DragAxis = "adaptive" | "horizontal" | "vertical";
type InteractionMode = "idle" | "dragging" | "editing";

interface DragSensitivity {
  mouse: number;
  touch: number;
  fineMultiplier: number;
}

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
  tone?: SliderTone;
  formatValue?: (value: number) => string;
  actionSlot?: React.ReactNode;
  dragAxis?: DragAxis;
  allowDirectEntry?: boolean;
  dragSensitivity?: DragSensitivity;
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

const DRAG_DEADZONE_PX = 6;
const DEFAULT_DRAG_SENSITIVITY: DragSensitivity = {
  mouse: 12,
  touch: 18,
  fineMultiplier: 2.5,
};

interface DragSession {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  axis: "horizontal" | "vertical" | null;
  residualSteps: number;
  currentValue: number;
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
  tone = "primary",
  formatValue,
  actionSlot,
  dragAxis = "adaptive",
  allowDirectEntry = true,
  dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
  onChange,
}: NumericSliderFieldProps) {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("idle");
  const [editDraft, setEditDraft] = useState("");
  const valueChipRef = useRef<HTMLDivElement | null>(null);
  const directEntryRef = useRef<HTMLInputElement | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const suppressNextClickRef = useRef(false);
  const precision = useMemo(() => getStepPrecision(step), [step]);
  const safeValue = useMemo(() => clamp(value, min, max), [value, min, max]);
  const rangeSpan = max - min || 1;
  const percent = ((safeValue - min) / rangeSpan) * 100;

  const displayValue = formatValue ? formatValue(safeValue) : formatDefaultValue(safeValue, precision, unit);

  const normalize = (nextValue: number) => {
    const factor = 10 ** precision;
    const rounded = Math.round(clamp(nextValue, min, max) * factor) / factor;
    if (rounded !== safeValue) {
      onChange(rounded);
    }
    return rounded;
  };

  useEffect(() => {
    if (interactionMode === "editing" && directEntryRef.current) {
      directEntryRef.current.focus();
      directEntryRef.current.select();
    }
  }, [interactionMode]);

  const openDirectEntry = () => {
    if (!allowDirectEntry || disabled) return;
    setEditDraft(precision > 0 ? safeValue.toFixed(precision) : `${safeValue}`);
    setInteractionMode("editing");
  };

  const closeDirectEntry = () => {
    setInteractionMode("idle");
    setEditDraft("");
  };

  const commitDirectEntry = () => {
    const trimmedValue = editDraft.trim();
    if (trimmedValue.length > 0) {
      const parsed = Number(trimmedValue);
      if (Number.isFinite(parsed)) {
        normalize(parsed);
      }
    }
    closeDirectEntry();
  };

  const cancelDirectEntry = () => {
    if (interactionMode !== "editing") return;
    closeDirectEntry();
  };

  const adjustByStep = (stepCount: number) => {
    normalize(safeValue + step * stepCount);
  };

  const getPointerStepDistance = (event: React.PointerEvent, pointerType: string): number => {
    const baseDistance = pointerType === "touch" ? dragSensitivity.touch : dragSensitivity.mouse;
    if (event.shiftKey) {
      return baseDistance * dragSensitivity.fineMultiplier;
    }
    return baseDistance;
  };

  const resolveAxis = (dx: number, dy: number): "horizontal" | "vertical" => {
    if (dragAxis === "horizontal") return "horizontal";
    if (dragAxis === "vertical") return "vertical";
    return Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
  };

  const handleValuePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || interactionMode === "editing") return;
    dragSessionRef.current = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      axis: null,
      residualSteps: 0,
      currentValue: safeValue,
    };
    suppressNextClickRef.current = false;
    valueChipRef.current?.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const handleValuePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId || disabled || interactionMode === "editing") return;

    const totalDx = event.clientX - session.startX;
    const totalDy = event.clientY - session.startY;
    const dragDistance = Math.hypot(totalDx, totalDy);

    if (!session.axis) {
      if (dragDistance < DRAG_DEADZONE_PX) {
        return;
      }
      session.axis = resolveAxis(totalDx, totalDy);
      suppressNextClickRef.current = true;
      setInteractionMode("dragging");
    }

    const incrementalDx = event.clientX - session.lastX;
    const incrementalDy = event.clientY - session.lastY;
    session.lastX = event.clientX;
    session.lastY = event.clientY;

    const primaryDelta = session.axis === "horizontal" ? incrementalDx : -incrementalDy;
    const pxPerStep = getPointerStepDistance(event, session.pointerType);
    session.residualSteps += primaryDelta / pxPerStep;

    const wholeSteps = session.residualSteps > 0 ? Math.floor(session.residualSteps) : Math.ceil(session.residualSteps);
    if (wholeSteps === 0) return;

    session.residualSteps -= wholeSteps;
    const nextValue = session.currentValue + wholeSteps * step;
    session.currentValue = normalize(nextValue);
  };

  const endPointerDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    valueChipRef.current?.releasePointerCapture?.(event.pointerId);
    dragSessionRef.current = null;
    if (interactionMode === "dragging") {
      setInteractionMode("idle");
    }
  };

  const handleValueKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || interactionMode === "editing") return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        adjustByStep(1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        adjustByStep(-1);
        break;
      case "PageUp":
        event.preventDefault();
        adjustByStep(10);
        break;
      case "PageDown":
        event.preventDefault();
        adjustByStep(-10);
        break;
      case "Home":
        event.preventDefault();
        normalize(min);
        break;
      case "End":
        event.preventDefault();
        normalize(max);
        break;
      case "Enter":
        event.preventDefault();
        openDirectEntry();
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn("rounded-2xl border border-border/70 bg-card/60 p-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <div
          ref={valueChipRef}
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={safeValue}
          aria-valuetext={displayValue}
          aria-describedby={`${id}-scale ${id}-interaction${description ? ` ${id}-desc` : ""}`}
          onKeyDown={handleValueKeyDown}
          onPointerDown={handleValuePointerDown}
          onPointerMove={handleValuePointerMove}
          onPointerUp={endPointerDrag}
          onPointerCancel={endPointerDrag}
          onClick={() => {
            if (suppressNextClickRef.current) {
              suppressNextClickRef.current = false;
              return;
            }
            openDirectEntry();
          }}
          className={cn(
            "numeric-value-chip inline-flex min-w-[96px] items-center justify-center gap-1 rounded-xl border border-border/60 bg-background/85 px-3 py-1 text-sm font-semibold text-foreground",
            interactionMode === "dragging" && "numeric-value-chip-dragging",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {interactionMode === "editing" ? (
            <input
              ref={directEntryRef}
              type="text"
              value={editDraft}
              inputMode="decimal"
              aria-label={`Edit ${label}`}
              onChange={(event) => setEditDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitDirectEntry();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  cancelDirectEntry();
                }
              }}
              onBlur={commitDirectEntry}
              className="numeric-value-direct-input w-20 bg-transparent text-center text-sm font-semibold text-foreground focus:outline-none"
            />
          ) : (
            <>
              <span aria-live="polite">{displayValue}</span>
              <span className="numeric-value-chip-affordance" aria-hidden="true">
                {dragAxis === "vertical" ? "↕" : dragAxis === "horizontal" ? "↔" : "↕↔"}
              </span>
            </>
          )}
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
          aria-describedby={`${id}-scale ${id}-interaction${description ? ` ${id}-desc` : ""}`}
          onFocus={() => setInteractionMode("dragging")}
          onBlur={() => {
            if (interactionMode !== "editing") {
              setInteractionMode("idle");
            }
          }}
          onPointerDown={() => setInteractionMode("dragging")}
          onPointerUp={() => setInteractionMode("idle")}
          onPointerCancel={() => setInteractionMode("idle")}
          onChange={(event) => normalize(Number(event.target.value))}
          className={cn(
            "numeric-slider-track w-full",
            toneClasses[tone],
            interactionMode === "dragging" && "numeric-slider-active",
            disabled && "cursor-not-allowed opacity-60",
          )}
          style={{ "--slider-fill": `${percent}%` } as React.CSSProperties}
        />
      </div>

      <div id={`${id}-scale`} className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted-foreground">{minLabel ?? formatDefaultValue(min, precision, unit)}</span>
        <span className="text-[11px] text-muted-foreground">{maxLabel ?? formatDefaultValue(max, precision, unit)}</span>
      </div>

      <p id={`${id}-interaction`} className="mt-2 text-[11px] text-muted-foreground">
        Drag the value to adjust. Press Enter to type exact value.
      </p>

      {description && (
        <p id={`${id}-desc`} className="mt-2 text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {actionSlot ? <div className="mt-2">{actionSlot}</div> : null}
    </div>
  );
}
