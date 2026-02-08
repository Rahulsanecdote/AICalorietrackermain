import React, { useState } from "react";
import { Lock, Moon, Sun, Unlock } from "lucide-react";
import { Switch } from "@/components/ui/material-design-3-switch";

export default function SwitchShowcase() {
  const [standard, setStandard] = useState(false);
  const [icons, setIcons] = useState(true);
  const [haptic, setHaptic] = useState(false);
  const [custom, setCustom] = useState(true);
  const [danger, setDanger] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-wrap items-center justify-center gap-8 bg-muted/30 py-18 font-sans">
      <div className="group relative aspect-[4/3] w-full max-w-[220px] rounded-[40px] border border-border/50 bg-card text-card-foreground shadow-xl">
        <div className="absolute top-4 space-y-1 px-4 text-center">
          <h3 className="text-xl font-bold tracking-tight">Standard</h3>
          <p className="text-sm font-medium text-muted-foreground">Spring Physics</p>
        </div>
        <div className="absolute bottom-6 scale-[1.5]">
          <Switch checked={standard} onCheckedChange={setStandard} />
        </div>
      </div>

      <div className="group relative aspect-[4/3] w-full max-w-[220px] rounded-[40px] border border-border/50 bg-card text-card-foreground shadow-xl">
        <div className="absolute top-4 space-y-1 px-4 text-center">
          <h3 className="text-xl font-bold tracking-tight">Icon Mode</h3>
          <p className="text-sm font-medium text-muted-foreground">Morphing Handle</p>
        </div>
        <div className="absolute bottom-6 scale-[1.5]">
          <Switch checked={icons} onCheckedChange={setIcons} showIcons />
        </div>
      </div>

      <div className="group relative aspect-[4/3] w-full max-w-[220px] rounded-[40px] border border-border/50 bg-card text-card-foreground shadow-xl">
        <div className="absolute top-4 space-y-1 px-4 text-center">
          <h3 className="text-xl font-bold tracking-tight">Haptic Audio</h3>
          <p className="text-sm font-medium text-muted-foreground">Heavy "Thud" Sound</p>
        </div>
        <div className="absolute bottom-6 scale-[1.5]">
          <Switch checked={haptic} onCheckedChange={setHaptic} haptic="heavy" />
        </div>
      </div>

      <div className="group relative aspect-[4/3] w-full max-w-[220px] rounded-[40px] border border-border/50 bg-card text-card-foreground shadow-xl">
        <div className="absolute top-4 space-y-1 px-4 text-center">
          <h3 className="text-xl font-bold tracking-tight">Custom Icons</h3>
          <p className="text-sm font-medium text-muted-foreground">React Node Support</p>
        </div>
        <div className="absolute bottom-6 scale-[1.5]">
          <Switch
            checked={custom}
            onCheckedChange={setCustom}
            haptic="light"
            checkedIcon={<Moon className="h-3.5 w-3.5 fill-current" />}
            uncheckedIcon={<Sun className="h-3.5 w-3.5 fill-current" />}
            className="peer-checked:border-indigo-500 peer-checked:bg-indigo-500"
          />
        </div>
      </div>

      <div className="group relative aspect-[4/3] w-full max-w-[220px] rounded-[40px] border border-border/50 bg-card text-card-foreground shadow-xl">
        <div className="absolute top-4 space-y-1 px-4 text-center">
          <h3 className="text-xl font-bold tracking-tight text-destructive">Destructive</h3>
          <p className="text-sm font-medium text-muted-foreground">Danger Zone UI</p>
        </div>
        <div className="absolute bottom-6 scale-[1.5]">
          <Switch
            checked={danger}
            onCheckedChange={setDanger}
            variant="destructive"
            showIcons
            checkedIcon={<Lock className="h-3 w-3" />}
            uncheckedIcon={<Unlock className="h-3 w-3" />}
          />
        </div>
      </div>
    </div>
  );
}
