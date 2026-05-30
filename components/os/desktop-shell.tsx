"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { profile } from "@/content/profile";
import { useWindows } from "@/lib/store/windows";
import { APPS, DOCK_ORDER, type AppId } from "@/lib/apps/registry";
import { WindowFrame } from "@/components/os/window";
import { BootAnimation } from "@/components/os/boot-animation";
import { Clock } from "@/components/os/clock";
import { Spotlight } from "@/components/os/spotlight";
import { useSpotlight } from "@/lib/store/spotlight";
import { useOsShortcuts } from "@/lib/hooks/use-os-shortcuts";

export function DesktopShell() {
  const [booted, setBooted] = useState(false);
  useOsShortcuts();

  return (
    <div className="fixed inset-0 overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
      <MenuBar />
      <Desktop />
      <Windows />
      <Dock />
      <Spotlight />
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
      <div className="pointer-events-none text-center">
        <h1 className="text-5xl font-semibold tracking-tight">Vishal OS</h1>
        <p className="mt-2 text-sm opacity-60">
          Click an icon below, or press <kbd>⌘K</kbd> to ask Pi.
        </p>
        <p className="mt-1 text-[11px] opacity-40">
          Drag windows by their title bar · ⌘W close · ⌘M minimize · Esc close
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

  return (
    <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center">
      <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur">
        {DOCK_ORDER.map((appId) => {
          const def = APPS[appId];
          const open = windows.find((w) => w.appId === appId);
          return (
            <button
              key={appId}
              onClick={() => {
                if (open) {
                  focusWindow(open.id);
                } else {
                  openApp(appId, {
                    title: def.title,
                    width: def.width,
                    height: def.height,
                  });
                }
              }}
              className="group relative grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-[10px] font-medium transition-all hover:scale-110 hover:bg-white/20"
              aria-label={def.dockLabel}
              title={def.dockLabel}
            >
              {def.dockLabel}
              {open && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
