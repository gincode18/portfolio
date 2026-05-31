"use client";

import { create } from "zustand";

type Bounds = { x: number; y: number; width: number; height: number };

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
  maximized: boolean;
  prevBounds: Bounds | null;
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
  toggleMaximize: (id: string) => void;
  setBounds: (id: string, b: Bounds) => void;
  closeFocused: () => void;
  minimizeFocused: () => void;

  /**
   * macOS-style dock click. Visible+focused → minimize. Minimized → restore.
   * Visible-but-blurred → focus. Not open → caller should openApp instead.
   */
  toggleFromDock: (id: string) => "missing" | "minimized" | "restored" | "focused";
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
          maximized: false,
          prevBounds: null,
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

  toggleMaximize: (id) =>
    set((s) => {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      const top = s.zCounter + 1;

      return {
        zCounter: top,
        windows: s.windows.map((w) => {
          if (w.id !== id) return w;
          if (w.maximized && w.prevBounds) {
            return {
              ...w,
              x: w.prevBounds.x,
              y: w.prevBounds.y,
              width: w.prevBounds.width,
              height: w.prevBounds.height,
              maximized: false,
              prevBounds: null,
              zIndex: top,
            };
          }
          return {
            ...w,
            prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
            x: 0,
            y: 28, // below menu bar
            width: vw,
            height: vh - 28 - 96, // minus menu bar (28) and dock area (96)
            maximized: true,
            minimized: false,
            zIndex: top,
          };
        }),
      };
    }),

  setBounds: (id, b) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, ...b } : w)),
    })),

  closeFocused: () => {
    const top = topVisible(get().windows);
    if (top) get().closeWindow(top.id);
  },

  minimizeFocused: () => {
    const top = topVisible(get().windows);
    if (top) get().minimizeWindow(top.id);
  },

  toggleFromDock: (appId) => {
    const w = get().windows.find((x) => x.appId === appId);
    if (!w) return "missing";
    if (w.minimized) {
      get().restoreWindow(w.id);
      return "restored";
    }
    const focusedTop = topVisible(get().windows);
    if (focusedTop?.id === w.id) {
      get().minimizeWindow(w.id);
      return "minimized";
    }
    get().focusWindow(w.id);
    return "focused";
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

/**
 * Returns the appId of the topmost non-minimized window, or null if no window
 * is focused. Used by the menu bar to show the active app name (macOS feel).
 */
export function useFocusedAppId(): string | null {
  return useWindows((s) => {
    const top = s.windows
      .filter((w) => !w.minimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0];
    return top?.appId ?? null;
  });
}
