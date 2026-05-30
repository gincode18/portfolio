"use client";

import { useEffect } from "react";
import { useWindows } from "@/lib/store/windows";
import { useSpotlight } from "@/lib/store/spotlight";
import { usePi } from "@/lib/store/pi";

export function useOsShortcuts() {
  const closeFocused = useWindows((s) => s.closeFocused);
  const minimizeFocused = useWindows((s) => s.minimizeFocused);

  const toggleSpotlight = useSpotlight((s) => s.toggle);
  const hideSpotlight = useSpotlight((s) => s.hide);
  const spotlightOpen = useSpotlight((s) => s.open);

  const togglePi = usePi((s) => s.toggle);
  const hidePi = usePi((s) => s.hide);
  const piOpen = usePi((s) => s.open);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        (target as HTMLElement | null)?.isContentEditable;

      // Spotlight on Cmd/Ctrl+K.
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (piOpen) hidePi();
        toggleSpotlight();
        return;
      }

      // Pi on Cmd/Ctrl+Space.
      if (meta && e.code === "Space") {
        e.preventDefault();
        if (spotlightOpen) hideSpotlight();
        togglePi();
        return;
      }

      // Let overlays handle their own keys.
      if (spotlightOpen || piOpen) return;

      if (meta && e.key.toLowerCase() === "w" && !isTyping) {
        e.preventDefault();
        closeFocused();
        return;
      }
      if (meta && e.key.toLowerCase() === "m" && !isTyping) {
        e.preventDefault();
        minimizeFocused();
        return;
      }
      if (e.key === "Escape" && !isTyping) {
        closeFocused();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    closeFocused,
    minimizeFocused,
    toggleSpotlight,
    hideSpotlight,
    spotlightOpen,
    togglePi,
    hidePi,
    piOpen,
  ]);
}
