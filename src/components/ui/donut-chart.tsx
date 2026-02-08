"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DonutChartSegment {
  value: number;
  color: string;
  label: string;
  ariaLabel?: string;
  [key: string]: unknown;
}

interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: DonutChartSegment[];
  totalValue?: number;
  size?: number;
  strokeWidth?: number;
  animationDuration?: number;
  animationDelayPerSegment?: number;
  highlightOnHover?: boolean;
  centerContent?: React.ReactNode;
  activeSegmentLabel?: string | null;
  onSegmentHover?: (segment: DonutChartSegment | null) => void;
  onSegmentSelect?: (segment: DonutChartSegment) => void;
}

const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  (
    {
      data,
      totalValue: propTotalValue,
      size = 220,
      strokeWidth = 24,
      animationDuration = 1,
      animationDelayPerSegment = 0.05,
      highlightOnHover = true,
      centerContent,
      activeSegmentLabel,
      onSegmentHover,
      onSegmentSelect,
      className,
      ...props
    },
    ref,
  ) => {
    const [hoveredSegment, setHoveredSegment] = React.useState<DonutChartSegment | null>(null);

    const internalTotalValue = React.useMemo(
      () => propTotalValue ?? data.reduce((sum, segment) => sum + segment.value, 0),
      [data, propTotalValue],
    );

    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    const segmentMeta = React.useMemo(() => {
      let cumulativePercentage = 0;
      return data.map((segment) => {
        const percentage = internalTotalValue === 0 ? 0 : (segment.value / internalTotalValue) * 100;
        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
        const strokeDashoffset = (cumulativePercentage / 100) * circumference;
        cumulativePercentage += percentage;
        return { segment, strokeDasharray, strokeDashoffset };
      });
    }, [circumference, data, internalTotalValue]);

    React.useEffect(() => {
      onSegmentHover?.(hoveredSegment);
    }, [hoveredSegment, onSegmentHover]);

    const handleMouseLeave = () => {
      setHoveredSegment(null);
      onSegmentHover?.(null);
    };

    return (
      <div
        ref={ref}
        className={cn("relative flex items-center justify-center", className)}
        style={{ width: size, height: size }}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible -rotate-90"
          role="img"
          aria-label="Macro calorie contribution donut chart"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--border) / 0.45)"
            strokeWidth={strokeWidth}
          />

          <AnimatePresence>
            {segmentMeta.map(({ segment, strokeDasharray, strokeDashoffset }, index) => {
              if (segment.value === 0) return null;

              const isActive = (activeSegmentLabel ?? hoveredSegment?.label) === segment.label;

              return (
                <motion.circle
                  key={segment.label || index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-strokeDashoffset}
                  strokeLinecap="round"
                  initial={{ opacity: 0, strokeDashoffset: circumference }}
                  animate={{
                    opacity: 1,
                    strokeDashoffset: -strokeDashoffset,
                  }}
                  transition={{
                    opacity: { duration: 0.3, delay: index * animationDelayPerSegment },
                    strokeDashoffset: {
                      duration: animationDuration,
                      delay: index * animationDelayPerSegment,
                      ease: "easeOut",
                    },
                  }}
                  className={cn("origin-center transition-transform duration-200", highlightOnHover && "cursor-pointer")}
                  style={{
                    filter: isActive ? `drop-shadow(0px 0px 8px ${segment.color}) brightness(1.06)` : "none",
                    transform: isActive ? "scale(1.025)" : "scale(1)",
                    transition: "filter 0.2s ease-out, transform 0.2s ease-out",
                  }}
                  onMouseEnter={() => setHoveredSegment(segment)}
                  onFocus={() => setHoveredSegment(segment)}
                  onBlur={() => setHoveredSegment(null)}
                  onClick={() => onSegmentSelect?.(segment)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSegmentSelect?.(segment);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={segment.ariaLabel ?? segment.label}
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {centerContent && (
          <div
            className="pointer-events-none absolute flex flex-col items-center justify-center"
            style={{
              width: size - strokeWidth * 2.5,
              height: size - strokeWidth * 2.5,
            }}
          >
            {centerContent}
          </div>
        )}
      </div>
    );
  },
);

DonutChart.displayName = "DonutChart";

export { DonutChart };
