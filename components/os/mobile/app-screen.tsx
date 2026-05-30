"use client";

import { motion, type PanInfo } from "motion/react";
import { APPS, type AppId } from "@/lib/apps/registry";
import { useMobileShell } from "@/lib/store/mobile-shell";
import { StatusBar } from "@/components/os/mobile/status-bar";
import { HomeIndicator } from "@/components/os/mobile/home-indicator";

const SWIPE_DOWN_THRESHOLD = 100;

type Props = {
  appId: AppId;
};

export function AppScreen({ appId }: Props) {
  const goHome = useMobileShell((s) => s.goHome);
  const def = APPS[appId];

  function onPan(_e: unknown, info: PanInfo) {
    if (info.offset.y > SWIPE_DOWN_THRESHOLD) goHome();
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 16 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="absolute inset-0 z-20 flex flex-col bg-background text-foreground"
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={onPan}
        className="flex shrink-0 items-center justify-between border-b border-border bg-muted/60 px-3 py-2 text-sm font-medium backdrop-blur"
      >
        <button
          onClick={goHome}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-foreground/80 hover:bg-foreground/5"
          aria-label="Back to home"
        >
          <BackChevron />
          <span>Home</span>
        </button>
        <div className="text-foreground">{def.title}</div>
        <div className="w-[60px]" />
      </motion.div>

      <div className="relative flex-1 overflow-hidden">{def.render()}</div>

      <div className="shrink-0 bg-background">
        <StatusBarSafeArea />
        <HomeIndicator tint="dark" />
      </div>
    </motion.div>
  );
}

function BackChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

// Reserve bottom space for the home indicator without showing the status bar
// chrome inside apps (some apps already have their own internal status).
function StatusBarSafeArea() {
  return <div className="h-2" />;
}

// Re-render the StatusBar at the top of an app on platforms where the page
// is fully scrolled. Currently unused — apps fill the full viewport between
// the title bar and home indicator. Left here for future iOS-Safari quirks.
export { StatusBar };
