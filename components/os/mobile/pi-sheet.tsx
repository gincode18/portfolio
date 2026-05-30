"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { usePi } from "@/lib/store/pi";
import { usePiChat } from "@/lib/hooks/use-pi-chat";
import { PiOrb } from "@/components/os/pi/pi-orb";

const SUGGESTIONS = [
  "What did Vishal build at Markopolo?",
  "Tell me about Serenity-AI.",
  "Show me his AI agent work.",
  "How is this portfolio hosted?",
];

const SWIPE_DOWN_THRESHOLD = 80;

export function PiSheet() {
  const open = usePi((s) => s.open);
  const messages = usePi((s) => s.messages);
  const streaming = usePi((s) => s.streaming);
  const error = usePi((s) => s.error);
  const hide = usePi((s) => s.hide);
  const reset = usePi((s) => s.reset);

  const { send } = usePiChat();

  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function submit(text: string) {
    setDraft("");
    await send(text);
  }

  function onPan(_e: unknown, info: PanInfo) {
    if (info.offset.y > SWIPE_DOWN_THRESHOLD) hide();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 z-40 flex items-end bg-black/40 backdrop-blur-sm"
          onClick={hide}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-neutral-900/95 text-white shadow-2xl ring-1 ring-black/40 backdrop-blur-xl"
          >
            {/* Drag handle */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={onPan}
              className="flex shrink-0 cursor-grab justify-center py-2 active:cursor-grabbing"
            >
              <span className="h-1 w-10 rounded-full bg-white/30" />
            </motion.div>

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 pb-3">
              <div className="flex items-center gap-2">
                <PiOrb size={22} active={streaming} />
                <div>
                  <div className="text-sm font-semibold">Pi</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40">
                    {streaming ? "thinking…" : "assistant"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {messages.length > 0 && (
                  <button
                    onClick={reset}
                    className="text-[11px] uppercase tracking-wider text-white/40 hover:text-white/80"
                  >
                    new
                  </button>
                )}
                <button
                  onClick={hide}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/15"
                  aria-label="Close"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conversation */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 text-sm"
            >
              {messages.length === 0 ? (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] uppercase tracking-wider text-white/40">
                    Try
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(s)}
                        className="rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-white/80 active:bg-white/10"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pb-1">
                  {messages.map((m) =>
                    m.role === "user" ? (
                      <div key={m.id} className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-3 py-1.5 text-white/95">
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className="flex gap-2">
                        <PiOrb size={18} className="mt-0.5" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          {m.text ? (
                            <div className="whitespace-pre-wrap text-white/90">
                              {m.text}
                            </div>
                          ) : m.tools && m.tools.length > 0 ? null : (
                            <div className="text-white/40">…</div>
                          )}
                          {m.tools && m.tools.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {m.tools.map((t, i) => (
                                <span
                                  key={i}
                                  className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70"
                                >
                                  {t.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                  {error && (
                    <div className="rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-200">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-white/10 px-3 py-3 pb-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(draft);
                }}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"
              >
                <PiOrb size={18} />
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={streaming ? "Pi is thinking…" : "Ask Pi"}
                  disabled={streaming}
                  enterKeyHint="send"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  className="w-full bg-transparent text-[15px] outline-hidden placeholder:text-white/40 disabled:opacity-60"
                  aria-label="Ask Pi"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || streaming}
                  aria-label="Send"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-black disabled:opacity-30"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
