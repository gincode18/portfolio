"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";
import { PiOrb } from "@/components/os/pi/pi-orb";
import { APP_ICONS, type AppIconKey } from "@/lib/apps/icons";
import { APPS, DOCK_ORDER, type AppId } from "@/lib/apps/registry";
import { useWindows } from "@/lib/store/windows";
import { cn } from "@/lib/utils";

// Sizes are in px. Mouse proximity scales the icon between BASE and MAX over a
// FALLOFF window on either side. This mirrors the classic macOS dock magnify.
const BASE = 48;
const MAX = 72;
const FALLOFF = 130;

export function Dock() {
  const mouseX = useMotionValue<number>(Number.POSITIVE_INFINITY);
  const windows = useWindows((s) => s.windows);
  const openApp = useWindows((s) => s.openApp);
  const toggleFromDock = useWindows((s) => s.toggleFromDock);

  return (
    <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
        className="flex items-end gap-1 rounded-2xl border border-white/10 bg-black/40 px-3 pt-2 pb-2 backdrop-blur-md"
      >
        {DOCK_ORDER.map((id) => {
          const def = APPS[id];
          const open = windows.find((w) => w.appId === id);
          return (
            <DockItem
              key={id}
              id={id}
              label={def.dockLabel}
              mouseX={mouseX}
              open={!!open}
              onClick={() => {
                const result = toggleFromDock(id);
                if (result === "missing") {
                  openApp(id, {
                    title: def.title,
                    width: def.width,
                    height: def.height,
                  });
                }
              }}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

function DockItem({
  id,
  label,
  mouseX,
  open,
  onClick,
}: {
  id: AppIconKey;
  label: string;
  mouseX: MotionValue<number>;
  open: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const config = APP_ICONS[id];

  // Distance from cursor center to this icon's center on the X axis.
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return Number.POSITIVE_INFINITY;
    return val - bounds.x - bounds.width / 2;
  });

  // Linearly interpolate size from BASE → MAX → BASE as distance crosses 0.
  const sizeTarget = useTransform(
    distance,
    [-FALLOFF, 0, FALLOFF],
    [BASE, MAX, BASE]
  );
  const size = useSpring(sizeTarget, {
    mass: 0.08,
    stiffness: 220,
    damping: 18,
  });

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      style={{ width: size, height: size }}
      className="group relative grid place-items-center"
      aria-label={label}
      title={label}
    >
      {id === "pi" ? (
        <span className="grid h-full w-full place-items-center rounded-[24%] bg-black/40 ring-1 ring-white/10">
          <PiOrb size={Math.round(BASE * 0.7)} active={open} />
        </span>
      ) : (
        <span
          className={cn(
            "grid h-full w-full place-items-center rounded-[24%] shadow-md shadow-black/40 ring-1 ring-white/10",
            config.gradient,
            config.fg
          )}
        >
          {config.glyph(Math.round(BASE * 0.55))}
        </span>
      )}
      {open && (
        <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/85" />
      )}
    </motion.button>
  );
}
