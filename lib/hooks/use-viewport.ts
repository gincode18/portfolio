"use client";

import { useEffect, useState } from "react";

export type Viewport = "desktop" | "mobile";

const MOBILE_BREAKPOINT = 768;

export function useViewport(): Viewport | null {
  const [viewport, setViewport] = useState<Viewport | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const apply = () => setViewport(mq.matches ? "mobile" : "desktop");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return viewport;
}
