import { useMemo, useState } from "react";
import { ChevronLeft, LogOut, Settings, User } from "lucide-react";
import type { UserSettings } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProfilePanel } from "@/components/ui/profile-panel";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  email?: string | null;
  settings: UserSettings;
  onOpenSettings: () => void;
  onSignOut?: () => void | Promise<void>;
  onSaveProfile: (settings: Partial<UserSettings>) => void;
  className?: string;
}

type MenuView = "menu" | "profile";

const triggerClassName =
  "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background/45 text-muted-foreground shadow-[0_10px_24px_hsl(var(--foreground)/0.11),inset_0_1px_0_hsl(var(--foreground)/0.08)] backdrop-blur-xl transition-all duration-200 hover:bg-background/65 hover:text-foreground hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hover:scale-[1.03]";

const actionRowClassName =
  "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-foreground transition-all hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hover:translate-x-0.5";

function getDisplayName(email?: string | null): string {
  if (!email) return "NutriAI User";
  const localPart = email.split("@")[0] ?? "";
  if (!localPart.trim()) return "NutriAI User";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string): string {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  return letters || "NA";
}

export function UserMenu({
  email,
  settings,
  onOpenSettings,
  onSignOut,
  onSaveProfile,
  className,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MenuView>("menu");

  const displayName = useMemo(() => getDisplayName(email), [email]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const closeMenu = () => {
    setOpen(false);
    setView("menu");
  };

  const handleSaveProfile = (profileUpdates: Partial<UserSettings>) => {
    onSaveProfile(profileUpdates);
    closeMenu();
  };

  const handleSignOut = async () => {
    if (!onSignOut) return;
    await onSignOut();
    closeMenu();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setView("menu");
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(triggerClassName, className)}
        >
          <Avatar className="h-7 w-7 border border-border/50 bg-primary/15">
            <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={10}
        collisionPadding={12}
        className="w-[min(23rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-0 text-foreground shadow-[0_24px_54px_hsl(var(--foreground)/0.32)] backdrop-blur-2xl"
      >
        {view === "menu" ? (
          <>
            <div className="flex items-center gap-3 border-b border-border/55 px-4 py-3">
              <Avatar className="h-11 w-11 border border-border/60 bg-primary/15">
                <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {email || "No email available"}
                </p>
              </div>
            </div>

            <div className="space-y-1 px-2 py-2">
              <button
                type="button"
                onClick={() => setView("profile")}
                className={actionRowClassName}
              >
                <User className="h-4 w-4 text-muted-foreground" />
                Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  closeMenu();
                }}
                className={actionRowClassName}
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                Settings
              </button>
            </div>

            <div className="border-t border-border/55 px-3 pb-3 pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-background/55 text-sm font-medium text-foreground transition-all hover:bg-background/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <div className="flex max-h-[min(78vh,46rem)] flex-col">
            <div className="flex items-center gap-2 border-b border-border/55 px-3 py-3">
              <button
                type="button"
                onClick={() => setView("menu")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background/55 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Back to account menu"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-sm font-semibold text-foreground">Profile</p>
                <p className="text-xs text-muted-foreground">
                  Update your personal preferences
                </p>
              </div>
            </div>
            <div className="overflow-y-auto px-4 py-3">
              <ProfilePanel
                settings={settings}
                onSave={handleSaveProfile}
                onCancel={() => setView("menu")}
              />
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
