"use client";

import { create } from "zustand";

type SpotlightStore = {
  open: boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
};

export const useSpotlight = create<SpotlightStore>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
