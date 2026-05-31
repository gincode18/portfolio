"use client";

import { create } from "zustand";

type DesktopShellStore = {
  locked: boolean;
  unlock: () => void;
  lock: () => void;
};

export const useDesktopShell = create<DesktopShellStore>((set) => ({
  locked: true,
  unlock: () => set({ locked: false }),
  lock: () => set({ locked: true }),
}));
