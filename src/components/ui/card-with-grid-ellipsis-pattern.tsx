"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GridPatternCardProps {
  children: React.ReactNode
  className?: string
  patternClassName?: string
  gradientClassName?: string
}

export function GridPatternCard({
  children,
  className,
  patternClassName,
  gradientClassName,
}: GridPatternCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-border/45 bg-card/70 text-card-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08),0_14px_28px_hsl(var(--foreground)/0.12)]",
        "supports-[backdrop-filter]:backdrop-blur-xl",
        className
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reduceMotion ? undefined : { duration: 0.35, ease: "easeOut" }}
    >
      <div
        className={cn(
          "absolute inset-0 bg-grid-pattern-light dark:bg-grid-pattern bg-[length:28px_28px,28px_28px,28px_28px]",
          patternClassName
        )}
        aria-hidden
      />
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-background/85 via-background/60 to-background/35",
          gradientClassName
        )}
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

export function GridPatternCardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />
}

