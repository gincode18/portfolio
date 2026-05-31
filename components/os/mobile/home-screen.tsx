"use client";

import { APPS, DOCK_ORDER } from "@/lib/apps/registry";
import { useMobileShell } from "@/lib/store/mobile-shell";
import { usePi } from "@/lib/store/pi";
import { StatusBar } from "@/components/os/mobile/status-bar";
import { HomeIndicator } from "@/components/os/mobile/home-indicator";
import { PhotoWidget } from "@/components/os/mobile/photo-widget";
import { PiWidget } from "@/components/os/mobile/pi-widget";
import { AppIcon } from "@/components/os/mobile/app-icon";
import { Wallpaper } from "@/components/os/wallpaper";

export function HomeScreen() {
  const openApp = useMobileShell((s) => s.openApp);
  const showPi = usePi((s) => s.show);

  return (
    <div className="absolute inset-0 z-10 flex flex-col overflow-hidden">
      {/* wallpaper */}
      <Wallpaper variant="phone" tint={0.2} />
      <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/0 to-black/55" />

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
              const def = APPS[id];
              return (
                <AppIcon
                  key={id}
                  id={id}
                  label={def.dockLabel}
                  onClick={() => openApp(id)}
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
