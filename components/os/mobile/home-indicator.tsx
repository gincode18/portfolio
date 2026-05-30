"use client";

import { useMobileShell } from "@/lib/store/mobile-shell";
import { usePi } from "@/lib/store/pi";
import { useRef } from "react";

type Props = {
  tint?: "light" | "dark";
};

const LONG_PRESS_MS = 350;

/**
 * iOS home indicator at the bottom of the screen.
 *  - Tap: go to home screen.
 *  - Long-press: open the Pi assistant sheet (mirrors macOS Siri behavior).
 */
export function HomeIndicator({ tint = "light" }: Props) {
  const goHome = useMobileShell((s) => s.goHome);
  const showPi = usePi((s) => s.show);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  function onPointerDown() {
    longPressedRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      showPi();
    }, LONG_PRESS_MS);
  }

  function onPointerUp() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!longPressedRef.current) goHome();
  }

  function onPointerLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  const color = tint === "light" ? "bg-white/80" : "bg-black/60";

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex h-8 items-end justify-center pb-2">
      <button
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        aria-label="Home — hold for Pi"
        className={`h-1 w-32 rounded-full ${color} transition-transform active:scale-95`}
      />
    </div>
  );
}
