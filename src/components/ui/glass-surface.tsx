'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const glassSurfaceVariants = cva(
  [
    'relative isolate border border-border/40 text-foreground',
    'supports-[backdrop-filter]:backdrop-blur-xl',
    'before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(180deg,hsl(var(--background)/0.4),transparent_58%)]',
    'after:pointer-events-none after:absolute after:inset-px after:rounded-[inherit] after:shadow-[inset_0_1px_0_hsl(var(--foreground)/0.09)]',
  ].join(' '),
  {
    variants: {
      variant: {
        panel:
          'overflow-hidden rounded-3xl bg-background/55 shadow-[0_24px_56px_hsl(var(--foreground)/0.2)]',
        item:
          'overflow-hidden rounded-xl bg-background/40 shadow-[0_10px_24px_hsl(var(--foreground)/0.09)]',
      },
      interactive: {
        true: 'transition-all duration-200 md:hover:-translate-y-0.5 md:hover:bg-background/55 md:hover:border-border/60 md:hover:brightness-105',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'panel',
      interactive: false,
    },
  }
);

export interface GlassSurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassSurfaceVariants> {}

export function GlassSurface({
  className,
  variant,
  interactive,
  ...props
}: GlassSurfaceProps) {
  return (
    <div
      className={cn(glassSurfaceVariants({ variant, interactive }), className)}
      {...props}
    />
  );
}

