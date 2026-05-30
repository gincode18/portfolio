"use client";

import { useEffect, useRef } from "react";
import { usePi } from "@/lib/store/pi";
import { parsePiStream } from "@/lib/pi/stream";
import { applyToolCall } from "@/lib/pi/dispatch";

/**
 * Shared chat-send logic for both the desktop Pi pill and the mobile Pi sheet.
 * Owns the in-flight fetch + AbortController + ndjson parser. The two
 * presentation components only render the store state.
 */
export function usePiChat() {
  const streaming = usePi((s) => s.streaming);
  const pushUser = usePi((s) => s.pushUser);
  const startAssistant = usePi((s) => s.startAssistant);
  const appendAssistant = usePi((s) => s.appendAssistant);
  const attachTool = usePi((s) => s.attachTool);
  const finishAssistant = usePi((s) => s.finishAssistant);
  const fail = usePi((s) => s.fail);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    pushUser(trimmed);
    const assistantId = startAssistant();

    const history = usePi
      .getState()
      .messages.filter((m) => m.id !== assistantId)
      .map((m) => ({ role: m.role, content: m.text }));

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
        const data = (await res.json().catch(() => ({}))) as { error?: string };
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

  return { send, streaming };
}
