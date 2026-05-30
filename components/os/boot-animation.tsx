"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "vishal-os-booted";
const BOOT_PHASES = [
  { ms: 0, label: "POST" },
  { ms: 300, label: "loading kernel" },
  { ms: 700, label: "mounting /data" },
  { ms: 1000, label: "loading sqlite-vec" },
  { ms: 1300, label: "starting Pi assistant" },
  { ms: 1700, label: "ready" },
] as const;

const TOTAL_MS = 2100;

export function BootAnimation({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState<boolean | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (seen) {
      setShow(false);
      onDone();
      return;
    }
    setShow(true);
  }, [onDone]);

  useEffect(() => {
    if (!show) return;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const e = performance.now() - start;
      setElapsed(e);
      if (e < TOTAL_MS) {
        raf = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  function finish() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
    onDone();
  }

  if (show === null || show === false) return null;

  const progress = Math.min(1, elapsed / TOTAL_MS);
  const currentPhase = [...BOOT_PHASES]
    .reverse()
    .find((p) => elapsed >= p.ms)?.label;

  return (
    <AnimatePresence>
      <motion.div
        key="boot"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 grid place-items-center bg-black text-white"
        onClick={finish}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish();
        }}
        tabIndex={0}
        ref={(el) => el?.focus()}
      >
        <div className="flex flex-col items-center gap-6">
          <Logo />

          <div className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">
            Vishal&nbsp;OS
          </div>

          <div className="h-1 w-56 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-white"
              animate={{ width: `${progress * 100}%` }}
              transition={{ ease: "linear", duration: 0.05 }}
            />
          </div>

          <div className="h-4 font-mono text-[11px] text-white/40">
            {currentPhase}
          </div>

          <div className="absolute bottom-8 text-[10px] uppercase tracking-widest text-white/30">
            Press any key to skip
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Logo() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <motion.circle
        cx="40"
        cy="40"
        r="32"
        stroke="white"
        strokeWidth="1.5"
        initial={{ pathLength: 0, opacity: 0.2 }}
        animate={{ pathLength: 1, opacity: 0.8 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      <motion.text
        x="40"
        y="48"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="22"
        fontWeight="600"
        fill="white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        V
      </motion.text>
    </svg>
  );
}
