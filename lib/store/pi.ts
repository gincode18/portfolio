"use client";

import { create } from "zustand";

export type PiMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type PiStore = {
  open: boolean;
  messages: PiMessage[];
  streaming: boolean;
  error: string | null;

  show: () => void;
  hide: () => void;
  toggle: () => void;
  reset: () => void;

  // Streaming message lifecycle
  pushUser: (text: string) => void;
  startAssistant: () => string; // returns the new assistant message id
  appendAssistant: (id: string, chunk: string) => void;
  finishAssistant: () => void;
  fail: (message: string) => void;
};

export const usePi = create<PiStore>((set, get) => ({
  open: false,
  messages: [],
  streaming: false,
  error: null,

  show: () => set({ open: true, error: null }),
  hide: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open, error: null })),
  reset: () => set({ messages: [], streaming: false, error: null }),

  pushUser: (text) => {
    const m: PiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    set((s) => ({ messages: [...s.messages, m], error: null }));
  },

  startAssistant: () => {
    const id = `a-${Date.now()}`;
    const m: PiMessage = { id, role: "assistant", text: "" };
    set((s) => ({ messages: [...s.messages, m], streaming: true }));
    return id;
  },

  appendAssistant: (id, chunk) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, text: m.text + chunk } : m
      ),
    }));
  },

  finishAssistant: () => set({ streaming: false }),

  fail: (message) => {
    const last = get().messages[get().messages.length - 1];
    set((s) => ({
      streaming: false,
      error: message,
      messages:
        last?.role === "assistant" && last.text === ""
          ? s.messages.slice(0, -1)
          : s.messages,
    }));
  },
}));
