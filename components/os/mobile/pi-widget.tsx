"use client";

import { PiOrb } from "@/components/os/pi/pi-orb";

type Props = {
  onClick?: () => void;
};

export function PiWidget({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Open Pi"
      className="group relative flex aspect-square w-full flex-col justify-between overflow-hidden rounded-3xl bg-neutral-900 p-3 text-left text-white shadow-lg ring-1 ring-white/10 transition active:scale-[0.98]"
    >
      <div className="flex items-center gap-2">
        <PiOrb size={26} />
        <div className="text-[11px] uppercase tracking-wider opacity-70">
          Assistant
        </div>
      </div>

      <div>
        <div className="text-base font-semibold leading-tight">Ask Pi</div>
        <div className="text-[11px] opacity-70">
          About projects, experience, anything
        </div>
      </div>
    </button>
  );
}
