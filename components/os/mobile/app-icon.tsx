"use client";

import { PiOrb } from "@/components/os/pi/pi-orb";
import { APP_ICONS, type AppIconKey } from "@/lib/apps/icons";
import { cn } from "@/lib/utils";

type Props = {
  id: AppIconKey;
  label: string;
  onClick?: () => void;
};

export function AppIcon({ id, label, onClick }: Props) {
  const config = APP_ICONS[id];

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 transition active:scale-95"
      aria-label={label}
    >
      <span
        className={cn(
          "grid h-15.5 w-15.5 place-items-center rounded-[18px] shadow-md shadow-black/40 ring-1 ring-white/10",
          config.gradient,
          config.fg
        )}
      >
        {id === "pi" ? <PiOrb size={44} /> : config.glyph(30)}
      </span>
      <span className="text-[11px] font-medium text-white drop-shadow-md">
        {label}
      </span>
    </button>
  );
}
