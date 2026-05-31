"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { profile } from "@/content/profile";
import { useWindows } from "@/lib/store/windows";
import { usePi } from "@/lib/store/pi";
import { APPS } from "@/lib/apps/registry";
import { PiOrb } from "@/components/os/pi/pi-orb";

/**
 * macOS-Sonoma-style desktop widgets, pinned to the right side under the menu
 * bar. Sits at z-5 so opened app windows (z-10+) layer on top.
 *
 * The whole stack fades up on first mount. Each widget is a button — clicking
 * the photo opens the About app; clicking Pi opens the Pi assistant.
 */
export function WidgetStack() {
  const openApp = useWindows((s) => s.openApp);
  const showPi = usePi((s) => s.show);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
      className="pointer-events-none absolute top-12 right-6 bottom-28 z-5 hidden flex-col items-end gap-4 lg:flex"
    >
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
    </motion.div>
  );
}

function PhotoWidget({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.025, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      aria-label={`Open About ${profile.name}`}
      className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-3xl bg-neutral-900 text-left text-white shadow-xl ring-1 ring-white/10 hover:shadow-2xl hover:ring-white/30"
    >
      <Image
        src="/profile-photo.jpeg"
        alt={profile.name}
        fill
        sizes="220px"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-black/5" />
      <div className="absolute top-3 right-3 opacity-90 transition-opacity group-hover:opacity-100">
        <OpenChip label="About" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <div className="text-[10px] uppercase tracking-[0.18em] opacity-70">
          Portfolio
        </div>
        <div className="text-lg font-semibold leading-tight">
          {profile.name}
        </div>
        <div className="mt-0.5 text-[11px] opacity-80">{profile.title}</div>
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-white/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Tap to open
          <ChevronGlyph />
        </div>
      </div>
    </motion.button>
  );
}

function PiWidget({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.025, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      aria-label="Open Pi"
      className="group relative flex aspect-square w-full cursor-pointer flex-col justify-between overflow-hidden rounded-3xl bg-neutral-900/85 p-3.5 text-left text-white shadow-xl ring-1 ring-white/10 backdrop-blur hover:shadow-2xl hover:ring-white/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PiOrb size={26} />
          <div className="text-[10px] uppercase tracking-[0.18em] opacity-70">
            Assistant
          </div>
        </div>
        <OpenChip label="⌘Space" />
      </div>
      <div>
        <div className="text-base font-semibold leading-tight">Ask Pi</div>
        <div className="text-[11px] opacity-70">
          About projects, experience, anything
        </div>
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-white/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Tap to open
          <ChevronGlyph />
        </div>
      </div>
    </motion.button>
  );
}

function OpenChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/95 ring-1 ring-white/10 backdrop-blur">
      {label}
      <ChevronGlyph />
    </span>
  );
}

function ChevronGlyph() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
