"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { profile } from "@/content/profile";
import { useWindows } from "@/lib/store/windows";
import { useSpotlight } from "@/lib/store/spotlight";
import { usePi } from "@/lib/store/pi";
import { APPS, DOCK_ORDER, type AppId } from "@/lib/apps/registry";
import { WindowFrame } from "@/components/os/window";
import { BootAnimation } from "@/components/os/boot-animation";
import { Clock } from "@/components/os/clock";
import { Spotlight } from "@/components/os/spotlight";
import { PiOverlay } from "@/components/os/pi/pi-overlay";
import { PiOrb } from "@/components/os/pi/pi-orb";
import { Wallpaper } from "@/components/os/wallpaper";
import { WidgetStack } from "@/components/os/desktop/widget-stack";
import { DockIcon } from "@/components/os/desktop/dock-icon";
import { useOsShortcuts } from "@/lib/hooks/use-os-shortcuts";

export function DesktopShell() {
  const [booted, setBooted] = useState(false);
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
      {!booted && <BootAnimation onDone={() => setBooted(true)} />}
    </div>
  );
}

function MenuBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-30 flex h-7 items-center justify-between border-b border-white/10 bg-black/40 px-4 text-xs backdrop-blur">
      <div className="flex items-center gap-4">
        <span className="font-semibold">Vishal OS</span>
        <MenuLink appId="about" label="About" />
        <MenuLink appId="projects" label="Projects" />
        <MenuLink appId="experience" label="Experience" />
        <MenuLink appId="system-preferences" label="Settings" />
      </div>
      <div className="flex items-center gap-3 opacity-90">
        <SpotlightTrigger />
        <PiTrigger />
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
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-auto relative h-full w-full">
        <AnimatePresence>
          {windows.map((w) => (
            <WindowFrame key={w.id} window={w} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Dock() {
  const windows = useWindows((s) => s.windows);
  const openApp = useWindows((s) => s.openApp);
  const focusWindow = useWindows((s) => s.focusWindow);
  const showPi = usePi((s) => s.show);
  const piOpen = usePi((s) => s.open);

  return (
    <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center">
      <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur">
        {DOCK_ORDER.map((id) => {
          if (id === "pi") {
            return (
              <DockIcon
                key="pi"
                id="pi"
                label="Pi"
                active={piOpen}
                open={piOpen}
                onClick={showPi}
              />
            );
          }
          const def = APPS[id as AppId];
          const open = windows.find((w) => w.appId === id);
          return (
            <DockIcon
              key={id}
              id={id as AppId}
              label={def.dockLabel}
              open={!!open}
              onClick={() => {
                if (open) {
                  focusWindow(open.id);
                } else {
                  openApp(id as AppId, {
                    title: def.title,
                    width: def.width,
                    height: def.height,
                  });
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
