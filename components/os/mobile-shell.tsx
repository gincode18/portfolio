"use client";

import { AnimatePresence } from "motion/react";
import { useMobileShell } from "@/lib/store/mobile-shell";
import { LockScreen } from "@/components/os/mobile/lock-screen";
import { HomeScreen } from "@/components/os/mobile/home-screen";
import { AppScreen } from "@/components/os/mobile/app-screen";
import { PiSheet } from "@/components/os/mobile/pi-sheet";

export function MobileShell() {
  const screen = useMobileShell((s) => s.screen);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      <HomeScreen />

      <AnimatePresence>
        {screen.kind === "app" && (
          <AppScreen key={`app-${screen.appId}`} appId={screen.appId} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen.kind === "lock" && <LockScreen key="lock" />}
      </AnimatePresence>

      <PiSheet />
    </div>
  );
}
