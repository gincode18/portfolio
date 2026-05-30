"use client";

import {
  motion,
  useDragControls,
  type PanInfo,
  type DragControls,
} from "motion/react";
import { useRef } from "react";
import { useWindows, type WindowState } from "@/lib/store/windows";
import { APPS, type AppId } from "@/lib/apps/registry";

const MENU_BAR_HEIGHT = 28;
const DOCK_HEIGHT = 96;

export function WindowFrame({ window: w }: { window: WindowState }) {
  const focusWindow = useWindows((s) => s.focusWindow);
  const closeWindow = useWindows((s) => s.closeWindow);
  const minimizeWindow = useWindows((s) => s.minimizeWindow);
  const moveWindow = useWindows((s) => s.moveWindow);

  const dragControls = useDragControls();
  const dragStartRef = useRef({ x: 0, y: 0 });

  const def = APPS[w.appId as AppId];
  if (!def || w.minimized) return null;

  const onDragStart = () => {
    dragStartRef.current = { x: w.x, y: w.y };
    focusWindow(w.id);
  };

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const nx = clamp(dragStartRef.current.x + info.offset.x, 0, vw - 80);
    const ny = clamp(
      dragStartRef.current.y + info.offset.y,
      MENU_BAR_HEIGHT,
      vh - DOCK_HEIGHT
    );
    moveWindow(w.id, nx, ny);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseDownCapture={() => focusWindow(w.id)}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      style={{
        position: "absolute",
        left: w.x,
        top: w.y,
        width: w.width,
        height: w.height,
        zIndex: w.zIndex,
      }}
      className="overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-2xl ring-1 ring-black/10"
    >
      <TitleBar
        title={def.title}
        controls={dragControls}
        onClose={() => closeWindow(w.id)}
        onMinimize={() => minimizeWindow(w.id)}
      />
      <div className="h-[calc(100%-2rem)] overflow-hidden">{def.render()}</div>
    </motion.div>
  );
}

function TitleBar({
  title,
  controls,
  onClose,
  onMinimize,
}: {
  title: string;
  controls: DragControls;
  onClose: () => void;
  onMinimize: () => void;
}) {
  return (
    <div
      onPointerDown={(e) => controls.start(e)}
      className="flex h-8 cursor-grab select-none items-center gap-2 border-b border-border bg-muted/60 px-3 active:cursor-grabbing"
    >
      <div className="flex items-center gap-1.5">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="h-3 w-3 rounded-full bg-red-500 hover:brightness-110"
          aria-label="Close"
        />
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onMinimize}
          className="h-3 w-3 rounded-full bg-yellow-500 hover:brightness-110"
          aria-label="Minimize"
        />
        <span className="h-3 w-3 rounded-full bg-emerald-500 opacity-40" />
      </div>
      <div className="flex-1 text-center text-xs font-medium text-foreground/80">
        {title}
      </div>
      <div className="w-12" />
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
