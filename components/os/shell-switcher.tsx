"use client";

import { useViewport } from "@/lib/hooks/use-viewport";
import { DesktopShell } from "@/components/os/desktop-shell";
import { MobileShell } from "@/components/os/mobile-shell";

export function ShellSwitcher() {
  const viewport = useViewport();

  if (viewport === null) {
    return <BootHoldFrame />;
  }

  return viewport === "mobile" ? <MobileShell /> : <DesktopShell />;
}

function BootHoldFrame() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-black text-white">
      <div className="font-mono text-sm opacity-50">Vishal OS</div>
    </div>
  );
}
