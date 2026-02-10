import { motion } from "framer-motion";
import {
  BarChart2,
  Calendar,
  Coffee,
  Flame,
  Heart,
  Lightbulb,
  MoreHorizontal,
  ShoppingCart,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ActiveView } from "../../types";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface GlowMenuNavProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

const PRIMARY_VIEWS = ["tracker", "insights", "lifestyle", "analytics"] as const;
const MORE_VIEWS = ["shopping", "mealprep", "favorites"] as const;

export default function GlowMenuNav({ activeView, onViewChange }: GlowMenuNavProps) {
  const { t } = useTranslation();

  const navItems = {
    tracker: { label: t("header.tracker"), icon: Flame },
    insights: { label: t("header.insights"), icon: Lightbulb },
    lifestyle: { label: t("header.lifestyle"), icon: Coffee },
    analytics: { label: t("header.analytics"), icon: BarChart2 },
    shopping: { label: t("header.shopping"), icon: ShoppingCart },
    mealprep: { label: t("header.mealprep"), icon: Calendar },
    favorites: { label: t("header.favorites"), icon: Heart },
  } as const;

  const isMoreActive = MORE_VIEWS.includes(activeView as (typeof MORE_VIEWS)[number]);

  return (
    <nav
      className="fixed left-1/2 z-50 w-[calc(100%-1rem)] max-w-fit -translate-x-1/2 pb-[env(safe-area-inset-bottom)]"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      aria-label="Primary navigation"
    >
      <div className="relative">
        <div className="pointer-events-none absolute -inset-1 rounded-[1.25rem] bg-primary/20 opacity-35 blur-xl" />
        <ul className="relative flex items-center gap-1 rounded-2xl border border-border/40 bg-background/30 p-1.5 shadow-lg backdrop-blur-xl">
          {PRIMARY_VIEWS.map((viewId) => {
            const item = navItems[viewId];
            const Icon = item.icon;
            const isActive = activeView === viewId;

            return (
              <li key={viewId} className="relative">
                <button
                  type="button"
                  onClick={() => onViewChange(viewId)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "hover:-translate-y-0.5 hover:text-foreground",
                    isActive
                      ? "text-foreground shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
                      : "text-muted-foreground",
                  )}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`Open ${item.label}`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="glow-menu-active-pill"
                      className="absolute inset-0 rounded-xl bg-primary/15"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{item.label}</span>
                </button>
              </li>
            );
          })}

          <li className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "hover:-translate-y-0.5 hover:text-foreground",
                    isMoreActive
                      ? "text-foreground shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
                      : "text-muted-foreground",
                  )}
                  aria-current={isMoreActive ? "page" : undefined}
                  aria-label={t("header.more", { defaultValue: "More" })}
                >
                  {isMoreActive && (
                    <motion.span
                      layoutId="glow-menu-active-pill"
                      className="absolute inset-0 rounded-xl bg-primary/15"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}
                  <MoreHorizontal className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{t("header.more", { defaultValue: "More" })}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                sideOffset={10}
                className="w-52 rounded-xl border-border/70 bg-popover/95 backdrop-blur-lg"
              >
                {MORE_VIEWS.map((viewId) => {
                  const item = navItems[viewId];
                  const Icon = item.icon;
                  const isActive = activeView === viewId;

                  return (
                    <DropdownMenuItem
                      key={viewId}
                      onSelect={() => onViewChange(viewId)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2",
                        isActive && "bg-accent text-foreground",
                      )}
                      aria-label={`Open ${item.label}`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {isActive ? <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" /> : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </div>
    </nav>
  );
}
