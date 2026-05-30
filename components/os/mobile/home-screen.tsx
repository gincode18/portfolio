"use client";

import Image from "next/image";
import { APPS, DOCK_ORDER, type AppId } from "@/lib/apps/registry";
import { useMobileShell } from "@/lib/store/mobile-shell";
import { usePi } from "@/lib/store/pi";
import { StatusBar } from "@/components/os/mobile/status-bar";
import { HomeIndicator } from "@/components/os/mobile/home-indicator";
import { PhotoWidget } from "@/components/os/mobile/photo-widget";
import { PiWidget } from "@/components/os/mobile/pi-widget";
import { AppIcon } from "@/components/os/mobile/app-icon";

export function HomeScreen() {
  const openApp = useMobileShell((s) => s.openApp);
  const showPi = usePi((s) => s.show);

  return (
    <div className="absolute inset-0 z-10 flex flex-col overflow-hidden">
      {/* wallpaper — soft blurred photo */}
      <Image
        src="/profile-photo.jpeg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover blur-2xl brightness-50 saturate-110"
      />
      <div className="absolute inset-0 bg-linear-to-b from-indigo-950/60 via-slate-900/40 to-black/70" />

      <div className="relative z-10 flex flex-1 flex-col text-white">
        <StatusBar tint="light" />

        <div className="flex flex-1 flex-col px-5 pt-3 pb-12">
          {/* Widget row: 2x2 photo widget + 2x2 Pi widget */}
          <div className="grid grid-cols-2 gap-3">
            <PhotoWidget size="large" onClick={() => openApp("about")} />
            <PiWidget onClick={() => showPi()} />
          </div>

          {/* App grid */}
          <div className="mt-6 grid grid-cols-4 gap-x-4 gap-y-5">
            {DOCK_ORDER.map((id) => {
              if (id === "pi") {
                return (
                  <AppIcon
                    key="pi"
                    id="pi"
                    label="Pi"
                    onClick={() => showPi()}
                  />
                );
              }
              const def = APPS[id as AppId];
              return (
                <AppIcon
                  key={id}
                  id={id as AppId}
                  label={def.dockLabel}
                  onClick={() => openApp(id as AppId)}
                />
              );
            })}
          </div>

          <div className="mt-auto text-center text-[10px] uppercase tracking-widest opacity-40">
            Vishal OS · hold the bar for Pi
          </div>
        </div>

        <HomeIndicator tint="light" />
      </div>
    </div>
  );
}
