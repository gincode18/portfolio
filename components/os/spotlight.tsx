"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSpotlight } from "@/lib/store/spotlight";
import { useWindows } from "@/lib/store/windows";
import { usePi } from "@/lib/store/pi";
import { APPS } from "@/lib/apps/registry";
import { spotlightSearch, type SpotlightHit } from "@/lib/spotlight/search";

export function Spotlight() {
  const open = useSpotlight((s) => s.open);
  const hide = useSpotlight((s) => s.hide);
  const openApp = useWindows((s) => s.openApp);
  const showPi = usePi((s) => s.show);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hits = useMemo<SpotlightHit[]>(() => spotlightSearch(query), [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function commit(hit: SpotlightHit) {
    if (hit.action === "open-pi") {
      hide();
      showPi();
      return;
    }
    if (hit.openApp) {
      const def = APPS[hit.openApp];
      openApp(hit.openApp, {
        title: def.title,
        width: def.width,
        height: def.height,
      });
    }
    hide();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(hits.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (hits[active]) commit(hits[active]);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      hide();
      return;
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
          className="fixed inset-0 z-40 grid place-items-start justify-center bg-black/40 backdrop-blur-sm pt-[14vh]"
          onClick={hide}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="w-[min(560px,92vw)] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/95 text-white shadow-2xl ring-1 ring-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <span className="text-lg opacity-50">⌘</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search apps, projects, experience — or ask Pi…"
                className="w-full bg-transparent text-base outline-hidden placeholder:text-white/40"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <ul className="max-h-[55vh] overflow-y-auto py-1">
              {hits.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-white/40">
                  no matches
                </li>
              )}
              {hits.map((hit, i) => (
                <li key={hit.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => commit(hit)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left ${
                      i === active ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <KindBadge kind={hit.kind} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{hit.title}</div>
                      {hit.subtitle && (
                        <div className="truncate text-xs text-white/50">
                          {hit.subtitle}
                        </div>
                      )}
                    </div>
                    {i === active && (
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-white/40">
                        ↵
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[10px] uppercase tracking-wider text-white/40">
              <span>Vishal OS Spotlight</span>
              <span>↑↓ navigate · ↵ open · esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function KindBadge({ kind }: { kind: SpotlightHit["kind"] }) {
  const label =
    kind === "app"
      ? "app"
      : kind === "project"
        ? "proj"
        : kind === "experience"
          ? "exp"
          : "act";
  return (
    <span className="shrink-0 rounded border border-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/60">
      {label}
    </span>
  );
}
