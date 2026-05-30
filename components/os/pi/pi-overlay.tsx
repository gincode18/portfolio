"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { usePi } from "@/lib/store/pi";
import { PiOrb } from "@/components/os/pi/pi-orb";
import { parsePiStream } from "@/lib/pi/stream";
import { applyToolCall } from "@/lib/pi/dispatch";

const SUGGESTIONS = [
  "What did Vishal build at Markopolo?",
  "Tell me about Serenity-AI.",
  "Show me his AI agent work.",
  "How is this portfolio hosted?",
];

export function PiOverlay() {
  const open = usePi((s) => s.open);
  const messages = usePi((s) => s.messages);
  const streaming = usePi((s) => s.streaming);
  const error = usePi((s) => s.error);
  const hide = usePi((s) => s.hide);
  const reset = usePi((s) => s.reset);
  const pushUser = usePi((s) => s.pushUser);
  const startAssistant = usePi((s) => s.startAssistant);
  const appendAssistant = usePi((s) => s.appendAssistant);
  const attachTool = usePi((s) => s.attachTool);
  const finishAssistant = usePi((s) => s.finishAssistant);
  const fail = usePi((s) => s.fail);

  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    pushUser(trimmed);
    setDraft("");

    const assistantId = startAssistant();

    const history = [
      ...usePi.getState().messages.filter((m) => m.id !== assistantId),
    ].map((m) => ({ role: m.role, content: m.text }));

    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/pi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        fail(data.error ?? `HTTP ${res.status}`);
        return;
      }

      for await (const ev of parsePiStream(res.body)) {
        if (ev.type === "text") {
          appendAssistant(assistantId, ev.text);
        } else if (ev.type === "tool") {
          const result = applyToolCall(ev.name, ev.args);
          if (result) attachTool(assistantId, result.label);
        } else if (ev.type === "error") {
          fail(ev.message);
          return;
        } else if (ev.type === "done") {
          break;
        }
      }
      finishAssistant();
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      fail((err as Error).message);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    } else if (e.key === "Escape") {
      e.preventDefault();
      hide();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-40 flex justify-center pt-[10vh]"
          onClick={hide}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 460, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-[min(640px,92vw)] flex-col items-stretch gap-2"
          >
            {/* Chat history (above the pill, mac-Siri style) */}
            {messages.length > 0 && (
              <div
                ref={scrollRef}
                className="max-h-[55vh] overflow-y-auto rounded-3xl border border-white/10 bg-neutral-900/85 p-4 text-sm text-white shadow-2xl ring-1 ring-black/40 backdrop-blur-xl"
              >
                <div className="space-y-3">
                  {messages.map((m) => (
                    <ChatBubble
                      key={m.id}
                      role={m.role}
                      text={m.text}
                      tools={m.tools}
                    />
                  ))}
                  {error && (
                    <div className="rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-200">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* The Siri-style pill */}
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-neutral-900/80 px-4 py-3 text-white shadow-2xl ring-1 ring-black/40 backdrop-blur-xl">
              <PiOrb size={28} active={streaming} />
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  streaming
                    ? "Pi is thinking…"
                    : messages.length === 0
                      ? "Type to Pi"
                      : "Ask a follow-up"
                }
                disabled={streaming}
                className="w-full bg-transparent text-base outline-hidden placeholder:text-white/45 disabled:opacity-60"
                autoComplete="off"
                spellCheck={false}
                aria-label="Ask Pi"
              />
              <MicButton />
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  className="text-[11px] uppercase tracking-wider text-white/40 hover:text-white/70"
                  aria-label="New conversation"
                  title="New conversation"
                >
                  new
                </button>
              )}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 px-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-white/70 backdrop-blur transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChatBubble({
  role,
  text,
  tools,
}: {
  role: "user" | "assistant";
  text: string;
  tools?: { label: string }[];
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-3 py-1.5 text-white/95">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <PiOrb size={20} className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-1.5">
        {text ? (
          <div className="whitespace-pre-wrap text-white/90">{text}</div>
        ) : tools && tools.length > 0 ? null : (
          <div className="text-white/40">…</div>
        )}
        {tools && tools.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tools.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70"
              >
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  className="opacity-70"
                  aria-hidden
                >
                  <circle cx="4" cy="4" r="3" fill="currentColor" />
                </svg>
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MicButton() {
  return (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      title="Voice input — coming in v2"
      aria-label="Voice input (coming soon)"
      className="grid h-7 w-7 shrink-0 cursor-not-allowed place-items-center rounded-full text-white/40"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    </button>
  );
}
