"use client";

import { PiOrb } from "@/components/os/pi/pi-orb";
import { APP_ICONS, type AppIconKey } from "@/lib/apps/icons";
import { cn } from "@/lib/utils";

type Props = {
  id: AppIconKey;
  label: string;
  active?: boolean;
  open?: boolean;
  onClick?: () => void;
};

/**
 * Desktop dock icon. Uses the shared icon set; Pi is special-cased to render
 * the live, rotating <PiOrb /> instead of the static gradient circle.
 */
export function DockIcon({ id, label, active, open, onClick }: Props) {
  const config = APP_ICONS[id];

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center transition-transform hover:-translate-y-0.5"
      aria-label={label}
      title={label}
    >
      {id === "pi" ? (
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-black/40 ring-1 ring-white/10">
          <PiOrb size={36} active={active} />
        </span>
      ) : (
        <span
          className={cn(
            "grid h-12 w-12 place-items-center rounded-xl shadow-md shadow-black/40 ring-1 ring-white/10",
            config.gradient,
            config.fg
          )}
        >
          {config.glyph(26)}
        </span>
      )}
      {open && (
        <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/80" />
      )}
    </button>
  );
}
