"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { profile } from "@/content/profile";
import { useWindows, useFocusedAppId } from "@/lib/store/windows";
import { useSpotlight } from "@/lib/store/spotlight";
import { usePi } from "@/lib/store/pi";
import { useDesktopShell } from "@/lib/store/desktop-shell";
import { APPS, type AppId } from "@/lib/apps/registry";
import { WindowFrame } from "@/components/os/window";
import { BootAnimation } from "@/components/os/boot-animation";
import { Clock } from "@/components/os/clock";
import { Spotlight } from "@/components/os/spotlight";
import { PiOverlay } from "@/components/os/pi/pi-overlay";
import { PiOrb } from "@/components/os/pi/pi-orb";
import { Wallpaper } from "@/components/os/wallpaper";
import { WidgetStack } from "@/components/os/desktop/widget-stack";
import { Dock } from "@/components/os/desktop/dock";
import { DesktopLockScreen } from "@/components/os/desktop/lock-screen";
import { useOsShortcuts } from "@/lib/hooks/use-os-shortcuts";

export function DesktopShell() {
  const [booted, setBooted] = useState(false);
  const locked = useDesktopShell((s) => s.locked);
  useOsShortcuts();

  return (
    <div className="fixed inset-0 overflow-hidden text-white">
      <Wallpaper variant="desktop" />

      <MenuBar />
      <WidgetStack />
      <Desktop />
      <Windows />
      <Dock />
      <Spotlight />
      <PiOverlay />

      <AnimatePresence>
        {booted && locked && <DesktopLockScreen key="desktop-lock" />}
      </AnimatePresence>

      {!booted && <BootAnimation onDone={() => setBooted(true)} />}
    </div>
  );
}

function MenuBar() {
  const focusedAppId = useFocusedAppId();
  const focusedName =
    focusedAppId && focusedAppId in APPS
      ? APPS[focusedAppId as AppId].dockLabel
      : "Vishal OS";

  return (
    <div className="absolute inset-x-0 top-0 z-30 flex h-7 items-center justify-between border-b border-white/10 bg-black/40 px-4 text-xs backdrop-blur">
      <div className="flex items-center gap-4">
        <AppleMark />
        <span className="font-semibold">{focusedName}</span>
        <MenuLink appId="about" label="About" />
        <MenuLink appId="projects" label="Projects" />
        <MenuLink appId="experience" label="Experience" />
        <MenuLink appId="system-preferences" label="Settings" />
      </div>
      <div className="flex items-center gap-3 opacity-90">
        <SpotlightTrigger />
        <PiTrigger />
        <LockButton />
        <a
          href={profile.links.github}
          target="_blank"
          rel="noreferrer"
          className="hover:opacity-100"
        >
          GitHub
        </a>
        <a
          href={profile.links.linkedin}
          target="_blank"
          rel="noreferrer"
          className="hover:opacity-100"
        >
          LinkedIn
        </a>
        <Clock />
      </div>
    </div>
  );
}

function AppleMark() {
  // Stylized "V" for Vishal, sized to match the menu-bar height.
  return (
    <span
      aria-hidden
      className="grid h-4 w-4 place-items-center font-mono text-[10px] font-bold leading-none text-white/85"
    >
      V
    </span>
  );
}

function SpotlightTrigger() {
  const toggle = useSpotlight((s) => s.toggle);
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 rounded px-1.5 py-0.5 opacity-70 hover:bg-white/10 hover:opacity-100"
      aria-label="Open Spotlight"
      title="Spotlight — ⌘K"
    >
      <span>⌘K</span>
    </button>
  );
}

function PiTrigger() {
  const show = usePi((s) => s.show);
  return (
    <button
      onClick={show}
      className="flex items-center gap-1.5 rounded px-1.5 py-0.5 opacity-90 hover:bg-white/10"
      aria-label="Open Pi"
      title="Pi — ⌘Space"
    >
      <PiOrb size={14} />
      <span>Pi</span>
    </button>
  );
}

function LockButton() {
  const lock = useDesktopShell((s) => s.lock);
  return (
    <button
      onClick={lock}
      className="opacity-70 hover:opacity-100"
      aria-label="Lock screen"
      title="Lock"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    </button>
  );
}

function MenuLink({ appId, label }: { appId: AppId; label: string }) {
  const openApp = useWindows((s) => s.openApp);
  const def = APPS[appId];
  return (
    <button
      className="opacity-70 hover:opacity-100"
      onClick={() =>
        openApp(appId, {
          title: def.title,
          width: def.width,
          height: def.height,
        })
      }
    >
      {label}
    </button>
  );
}

function Desktop() {
  const openApp = useWindows((s) => s.openApp);
  return (
    <button
      onClick={() =>
        openApp("about", {
          title: APPS.about.title,
          width: APPS.about.width,
          height: APPS.about.height,
        })
      }
      className="absolute inset-x-0 top-7 bottom-24 grid w-full place-items-center text-left"
    >
      <div className="pointer-events-none text-center text-white drop-shadow-lg">
        <h1 className="text-5xl font-semibold tracking-tight">Vishal OS</h1>
        <p className="mt-2 text-sm opacity-80">
          <kbd>⌘Space</kbd> to ask Pi · <kbd>⌘K</kbd> to search · click the dock
          to open apps
        </p>
      </div>
    </button>
  );
}

function Windows() {
  const windows = useWindows((s) => s.windows);
  return (
    // The container is pointer-events:none so empty areas (no window above
    // this pixel) fall through to the widget stack / desktop / dock. Each
    // <WindowFrame> sets pointer-events:auto on itself so the window content
    // still captures clicks.
    <div className="pointer-events-none absolute inset-0 z-10">
      <AnimatePresence>
        {windows.map((w) => (
          <WindowFrame key={w.id} window={w} />
        ))}
      </AnimatePresence>
    </div>
  );
}
