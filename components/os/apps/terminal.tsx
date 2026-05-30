"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";

type Entry =
  | { kind: "input"; text: string }
  | { kind: "output"; lines: string[]; exitCode?: number };

const PROMPT = "vishal-os ~ %";
const BANNER = [
  `Vishal OS Terminal · type \`help\` for commands`,
  `${profile.name} — ${profile.title}`,
  "",
];

export function TerminalApp() {
  const [history, setHistory] = useState<Entry[]>([
    { kind: "output", lines: BANNER },
  ]);
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  async function run(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    setHistory((h) => [...h, { kind: "input", text: input }]);
    setSubmitted((s) => [...s, input]);
    setHistoryIndex(null);
    setBusy(true);
    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });
      const data = (await res.json()) as { lines: string[]; exitCode?: number };
      if (data.lines?.length === 1 && data.lines[0] === "__CLEAR__") {
        setHistory([]);
        return;
      }
      setHistory((h) => [
        ...h,
        { kind: "output", lines: data.lines ?? [], exitCode: data.exitCode },
      ]);
    } catch (err) {
      setHistory((h) => [
        ...h,
        {
          kind: "output",
          lines: [`network error: ${(err as Error).message}`],
          exitCode: 1,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = draft;
      setDraft("");
      run(input);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (submitted.length === 0) return;
      const next = historyIndex === null ? submitted.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setDraft(submitted[next]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      const next = historyIndex + 1;
      if (next >= submitted.length) {
        setHistoryIndex(null);
        setDraft("");
      } else {
        setHistoryIndex(next);
        setDraft(submitted[next]);
      }
      return;
    }
    if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setHistory([]);
      return;
    }
  }

  return (
    <div
      className="flex h-full flex-col bg-black font-mono text-[12.5px] leading-[1.55] text-emerald-200"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
        {history.map((entry, i) =>
          entry.kind === "input" ? (
            <div key={i} className="flex">
              <span className="mr-2 shrink-0 text-emerald-500">{PROMPT}</span>
              <span className="text-emerald-50">{entry.text}</span>
            </div>
          ) : (
            <pre
              key={i}
              className={`whitespace-pre-wrap break-words ${
                entry.exitCode && entry.exitCode !== 0
                  ? "text-rose-300"
                  : "text-emerald-100/90"
              }`}
            >
              {entry.lines.join("\n")}
            </pre>
          )
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = draft;
          setDraft("");
          run(input);
        }}
        className="flex items-center border-t border-emerald-900/50 bg-black px-3 py-1.5"
      >
        <span className="mr-2 shrink-0 text-emerald-500">{PROMPT}</span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={busy}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full bg-transparent text-emerald-50 outline-hidden placeholder:text-emerald-700"
          placeholder={busy ? "..." : "type a command and press enter"}
          aria-label="terminal input"
        />
      </form>
    </div>
  );
}
