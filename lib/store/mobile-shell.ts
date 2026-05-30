"use client";

import { create } from "zustand";
import type { AppId } from "@/lib/apps/registry";

export type MobileScreen =
  | { kind: "lock" }
  | { kind: "home" }
  | { kind: "app"; appId: AppId };

type MobileShellStore = {
  screen: MobileScreen;
  unlock: () => void;
  lock: () => void;
  goHome: () => void;
  openApp: (appId: AppId) => void;
};

export const useMobileShell = create<MobileShellStore>((set) => ({
  screen: { kind: "lock" },
  unlock: () => set({ screen: { kind: "home" } }),
  lock: () => set({ screen: { kind: "lock" } }),
  goHome: () => set({ screen: { kind: "home" } }),
  openApp: (appId) => set({ screen: { kind: "app", appId } }),
}));
