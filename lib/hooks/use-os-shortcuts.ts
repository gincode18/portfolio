"use client";

import { useEffect } from "react";
import { useWindows } from "@/lib/store/windows";
import { useSpotlight } from "@/lib/store/spotlight";

export function useOsShortcuts() {
  const closeFocused = useWindows((s) => s.closeFocused);
  const minimizeFocused = useWindows((s) => s.minimizeFocused);
  const toggleSpotlight = useSpotlight((s) => s.toggle);
  const hideSpotlight = useSpotlight((s) => s.hide);
  const spotlightOpen = useSpotlight((s) => s.open);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        (target as HTMLElement | null)?.isContentEditable;

      // Spotlight: Cmd/Ctrl + K, or Cmd/Ctrl + Space.
      if (meta && (e.key.toLowerCase() === "k" || e.code === "Space")) {
        e.preventDefault();
        toggleSpotlight();
        return;
      }

      if (spotlightOpen) return; // Spotlight handles its own keys.

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
        if (spotlightOpen) {
          hideSpotlight();
        } else {
          closeFocused();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeFocused, minimizeFocused, toggleSpotlight, hideSpotlight, spotlightOpen]);
}
