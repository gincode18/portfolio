"use client";

import Image from "next/image";
import { profile } from "@/content/profile";
import { useWindows } from "@/lib/store/windows";
import { usePi } from "@/lib/store/pi";
import { APPS } from "@/lib/apps/registry";
import { PiOrb } from "@/components/os/pi/pi-orb";

/**
 * macOS-Sonoma-style desktop widgets, fixed to the right side under the menu
 * bar. Sits behind windows (z-5) so opened apps still take focus visually.
 */
export function WidgetStack() {
  const openApp = useWindows((s) => s.openApp);
  const showPi = usePi((s) => s.show);

  return (
    <div className="pointer-events-none absolute top-12 right-6 bottom-28 z-[5] hidden flex-col items-end gap-4 lg:flex">
      <div className="pointer-events-auto w-[220px]">
        <PhotoWidget
          onClick={() =>
            openApp("about", {
              title: APPS.about.title,
              width: APPS.about.width,
              height: APPS.about.height,
            })
          }
        />
      </div>
      <div className="pointer-events-auto w-[220px]">
        <PiWidget onClick={showPi} />
      </div>
    </div>
  );
}

function PhotoWidget({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Open About ${profile.name}`}
      className="group relative aspect-square w-full overflow-hidden rounded-3xl bg-neutral-900 text-left text-white shadow-2xl ring-1 ring-white/10 backdrop-blur transition active:scale-[0.98]"
    >
      <Image
        src="/profile-photo.jpeg"
        alt={profile.name}
        fill
        sizes="220px"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/0 to-black/0" />
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <div className="text-[11px] uppercase tracking-wider opacity-70">
          Portfolio
        </div>
        <div className="text-lg font-semibold leading-tight">
          {profile.name}
        </div>
        <div className="text-[11px] opacity-80">{profile.title}</div>
      </div>
    </button>
  );
}

function PiWidget({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open Pi"
      className="group relative flex aspect-square w-full flex-col justify-between overflow-hidden rounded-3xl bg-neutral-900/80 p-3.5 text-left text-white shadow-2xl ring-1 ring-white/10 backdrop-blur transition active:scale-[0.98]"
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
          About projects, experience, anything · ⌘Space
        </div>
      </div>
    </button>
  );
}
