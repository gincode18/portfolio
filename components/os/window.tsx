"use client";

import {
  motion,
  useDragControls,
  type PanInfo,
  type DragControls,
} from "motion/react";
import { memo } from "react";
import { useWindows, type WindowState } from "@/lib/store/windows";
import { APPS, type AppId } from "@/lib/apps/registry";

const MENU_BAR_HEIGHT = 28;
const DOCK_HEIGHT = 96;

const POSITION_SPRING = { type: "spring", stiffness: 500, damping: 38 } as const;

function WindowFrameImpl({ window: w }: { window: WindowState }) {
  const focusWindow = useWindows((s) => s.focusWindow);
  const closeWindow = useWindows((s) => s.closeWindow);
  const minimizeWindow = useWindows((s) => s.minimizeWindow);
  const moveWindow = useWindows((s) => s.moveWindow);
  const toggleMaximize = useWindows((s) => s.toggleMaximize);

  const dragControls = useDragControls();

  const def = APPS[w.appId as AppId];
  if (!def || w.minimized) return null;

  const onDragStart = () => focusWindow(w.id);

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (w.maximized) return;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const finalX = clamp(w.x + info.offset.x, 0, vw - 80);
    const finalY = clamp(w.y + info.offset.y, MENU_BAR_HEIGHT, vh - DOCK_HEIGHT);
    moveWindow(w.id, finalX, finalY);
  };

  return (
    <motion.div
      drag={!w.maximized}
      dragMomentum={false}
      dragElastic={0}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseDownCapture={() => focusWindow(w.id)}
      initial={{ opacity: 0, scale: 0.96, x: w.x, y: w.y }}
      animate={{
        opacity: 1,
        scale: 1,
        x: w.x,
        y: w.y,
        width: w.width,
        height: w.height,
      }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        ...POSITION_SPRING,
        opacity: { duration: 0.18 },
        scale: POSITION_SPRING,
      }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: w.zIndex,
        willChange: "transform",
      }}
      className="pointer-events-auto overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-2xl ring-1 ring-black/10"
    >
      <TitleBar
        title={def.title}
        maximized={w.maximized}
        controls={dragControls}
        onClose={() => closeWindow(w.id)}
        onMinimize={() => minimizeWindow(w.id)}
        onMaximize={() => toggleMaximize(w.id)}
      />
      <div className="h-[calc(100%-2rem)] overflow-hidden">{def.render()}</div>
    </motion.div>
  );
}

export const WindowFrame = memo(WindowFrameImpl, (prev, next) => {
  // Each window only re-renders when its own state changes. Without this, any
  // change to the windows array (e.g. someone else's z-index) causes every
  // open WindowFrame to re-render — which during drag is noticeable.
  return (
    prev.window.id === next.window.id &&
    prev.window.x === next.window.x &&
    prev.window.y === next.window.y &&
    prev.window.width === next.window.width &&
    prev.window.height === next.window.height &&
    prev.window.zIndex === next.window.zIndex &&
    prev.window.minimized === next.window.minimized &&
    prev.window.maximized === next.window.maximized &&
    prev.window.title === next.window.title &&
    prev.window.selectId === next.window.selectId
  );
});

function TitleBar({
  title,
  maximized,
  controls,
  onClose,
  onMinimize,
  onMaximize,
}: {
  title: string;
  maximized: boolean;
  controls: DragControls;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}) {
  return (
    <div
      onPointerDown={(e) => {
        if (maximized) return;
        controls.start(e);
      }}
      onDoubleClick={onMaximize}
      className={`flex h-8 ${
        maximized ? "" : "cursor-grab active:cursor-grabbing"
      } select-none items-center gap-2 border-b border-border bg-muted/60 px-3`}
    >
      <div className="group/lights flex items-center gap-0.5">
        <TrafficLight
          color="bg-red-500"
          onClick={onClose}
          ariaLabel="Close"
          symbol={
            <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          }
        />
        <TrafficLight
          color="bg-yellow-500"
          onClick={onMinimize}
          ariaLabel="Minimize"
          symbol={
            <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          }
        />
        <TrafficLight
          color="bg-emerald-500"
          onClick={onMaximize}
          ariaLabel={maximized ? "Restore" : "Maximize"}
          symbol={
            <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {maximized ? (
                <>
                  <polyline points="4 14 4 20 10 20" />
                  <polyline points="20 10 20 4 14 4" />
                </>
              ) : (
                <>
                  <polyline points="4 10 4 4 10 4" />
                  <polyline points="14 20 20 20 20 14" />
                </>
              )}
            </svg>
          }
        />
      </div>
      <div className="flex-1 text-center text-xs font-medium text-foreground/80">
        {title}
      </div>
      <div className="w-12" />
    </div>
  );
}

function TrafficLight({
  color,
  onClick,
  ariaLabel,
  symbol,
}: {
  color: string;
  onClick: () => void;
  ariaLabel: string;
  symbol: React.ReactNode;
}) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      aria-label={ariaLabel}
      // Visual dot is 12px; click target is 22px (h-5.5 w-5.5) for safe hits.
      className="grid h-5.5 w-5.5 cursor-pointer place-items-center"
    >
      <span
        className={`grid h-3 w-3 place-items-center rounded-full text-black/55 ${color} transition-[filter] hover:brightness-110`}
      >
        <span className="opacity-0 transition-opacity group-hover/lights:opacity-100">
          {symbol}
        </span>
      </span>
    </button>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
