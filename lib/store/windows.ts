"use client";

import { create } from "zustand";

export type WindowState = {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  selectId?: string;
};

type WindowStore = {
  windows: WindowState[];
  zCounter: number;
  spawnOffset: number;

  openApp: (
    appId: string,
    opts: {
      title: string;
      width?: number;
      height?: number;
      selectId?: string;
    }
  ) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  closeFocused: () => void;
  minimizeFocused: () => void;
};

const DEFAULT_W = 720;
const DEFAULT_H = 480;

function initialPosition(offset: number) {
  if (typeof window === "undefined") {
    return { x: 80 + offset, y: 60 + offset };
  }
  const cx = Math.max(60, (window.innerWidth - DEFAULT_W) / 2);
  const cy = Math.max(60, (window.innerHeight - DEFAULT_H) / 2);
  return { x: cx + offset, y: cy + offset };
}

export const useWindows = create<WindowStore>((set, get) => ({
  windows: [],
  zCounter: 10,
  spawnOffset: 0,

  openApp: (appId, { title, width = DEFAULT_W, height = DEFAULT_H, selectId }) => {
    const existing = get().windows.find((w) => w.appId === appId);
    if (existing) {
      get().focusWindow(existing.id);
      if (existing.minimized) get().restoreWindow(existing.id);
      // Update selection if a new one was requested.
      if (selectId !== undefined && selectId !== existing.selectId) {
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === existing.id ? { ...w, selectId } : w
          ),
        }));
      }
      return existing.id;
    }

    const id = `${appId}-${Date.now()}`;
    const offset = (get().spawnOffset % 6) * 24;
    const { x, y } = initialPosition(offset);
    const zIndex = get().zCounter + 1;

    set((s) => ({
      zCounter: zIndex,
      spawnOffset: s.spawnOffset + 1,
      windows: [
        ...s.windows,
        {
          id,
          appId,
          title,
          x,
          y,
          width,
          height,
          zIndex,
          minimized: false,
          selectId,
        },
      ],
    }));

    return id;
  },

  closeWindow: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  focusWindow: (id) =>
    set((s) => {
      const top = s.zCounter + 1;
      return {
        zCounter: top,
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, zIndex: top, minimized: false } : w
        ),
      };
    }),

  moveWindow: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w
      ),
    })),

  restoreWindow: (id) => get().focusWindow(id),

  closeFocused: () => {
    const top = topVisible(get().windows);
    if (top) get().closeWindow(top.id);
  },

  minimizeFocused: () => {
    const top = topVisible(get().windows);
    if (top) get().minimizeWindow(top.id);
  },
}));

function topVisible(windows: WindowState[]) {
  return windows
    .filter((w) => !w.minimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0];
}

/**
 * Read the current selection (if any) for a given app. Returns the selectId
 * passed to the most recent openApp call for this app.
 */
export function useAppSelection(appId: string): string | undefined {
  return useWindows((s) => s.windows.find((w) => w.appId === appId)?.selectId);
}
