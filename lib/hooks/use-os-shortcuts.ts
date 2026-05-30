"use client";

import { useEffect } from "react";
import { useWindows } from "@/lib/store/windows";
import { APPS, type AppId } from "@/lib/apps/registry";

export function useOsShortcuts() {
  const closeFocused = useWindows((s) => s.closeFocused);
  const minimizeFocused = useWindows((s) => s.minimizeFocused);
  const openApp = useWindows((s) => s.openApp);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        (target as HTMLElement | null)?.isContentEditable;

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
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const id: AppId = "pi";
        openApp(id, {
          title: APPS[id].title,
          width: APPS[id].width,
          height: APPS[id].height,
        });
        return;
      }
      if (e.key === "Escape" && !isTyping) {
        closeFocused();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeFocused, minimizeFocused, openApp]);
}
