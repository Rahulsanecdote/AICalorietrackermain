import type { ReactNode } from "react";
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
  className?: string;
}

const PRIMARY_VIEWS = ["tracker", "lifestyle", "analytics", "insights"] as const;
const MORE_VIEWS = ["shopping", "mealprep", "favorites"] as const;

type NavTone = "tracker" | "lifestyle" | "analytics" | "insights" | "more";

interface NavItem {
  label: string;
  icon: ReactNode;
  tone: NavTone;
}

export default function GlowMenuNav({ activeView, onViewChange, className }: GlowMenuNavProps) {
  const { t } = useTranslation();

  const navItems: Record<ActiveView, NavItem> = {
    tracker: { label: t("header.tracker"), icon: <Flame className="h-4 w-4" />, tone: "tracker" },
    lifestyle: { label: t("header.lifestyle"), icon: <Coffee className="h-4 w-4" />, tone: "lifestyle" },
    analytics: { label: t("header.analytics"), icon: <BarChart2 className="h-4 w-4" />, tone: "analytics" },
    insights: { label: t("header.insights"), icon: <Lightbulb className="h-4 w-4" />, tone: "insights" },
    shopping: { label: t("header.shopping"), icon: <ShoppingCart className="h-4 w-4" />, tone: "more" },
    mealprep: { label: t("header.mealprep"), icon: <Calendar className="h-4 w-4" />, tone: "more" },
    favorites: { label: t("header.favorites"), icon: <Heart className="h-4 w-4" />, tone: "more" },
  };

  const isMoreActive = MORE_VIEWS.includes(activeView as (typeof MORE_VIEWS)[number]);

  return (
    <nav className={cn("w-full", className)} aria-label="Primary navigation">
      <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
        <ul className="glow-nav-shell mx-auto flex w-max items-center gap-1 p-1.5">
          {PRIMARY_VIEWS.map((viewId) => {
            const item = navItems[viewId];
            const isActive = activeView === viewId;

            return (
              <li key={viewId} className="relative">
                <button
                  type="button"
                  onClick={() => onViewChange(viewId)}
                  data-tone={item.tone}
                  data-active={isActive ? "true" : "false"}
                  className={cn(
                    "glow-nav-button",
                    isActive && "glow-nav-button-active",
                  )}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`Open ${item.label}`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="glow-menu-active-pill"
                      className="glow-nav-active-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="glow-nav-icon relative z-10">{item.icon}</span>
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
                  data-tone="more"
                  data-active={isMoreActive ? "true" : "false"}
                  className={cn(
                    "glow-nav-button",
                    isMoreActive && "glow-nav-button-active",
                  )}
                  aria-current={isMoreActive ? "page" : undefined}
                  aria-label={t("header.more", { defaultValue: "More" })}
                >
                  {isMoreActive && (
                    <motion.span
                      layoutId="glow-menu-active-pill"
                      className="glow-nav-active-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}
                  <MoreHorizontal className="glow-nav-icon relative z-10 h-4 w-4" />
                  <span className="relative z-10">{t("header.more", { defaultValue: "More" })}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={10}
                className="w-52 rounded-xl border-border/70 bg-popover/95 backdrop-blur-lg"
              >
                {MORE_VIEWS.map((viewId) => {
                  const item = navItems[viewId];
                  const isActive = activeView === viewId;

                  return (
                    <DropdownMenuItem
                      key={viewId}
                      onSelect={() => onViewChange(viewId)}
                      data-tone={item.tone}
                      className={cn(
                        "glow-nav-menu-item flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2",
                        isActive && "glow-nav-menu-item-active",
                      )}
                      aria-label={`Open ${item.label}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="glow-nav-icon">{item.icon}</span>
                        {item.label}
                      </span>
                      {isActive ? <span className="glow-nav-indicator h-2 w-2 rounded-full" aria-hidden="true" /> : null}
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
