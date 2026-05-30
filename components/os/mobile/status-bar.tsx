"use client";

import { useEffect, useState } from "react";

type Props = {
  tint?: "light" | "dark";
};

export function StatusBar({ tint = "light" }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      })
    : "--:--";

  const color = tint === "light" ? "text-white" : "text-black";

  return (
    <div
      className={`flex h-11 shrink-0 items-center justify-between px-7 pt-1.5 text-[15px] font-semibold ${color}`}
    >
      <span className="tabular-nums">{time}</span>
      <span className="flex items-center gap-1.5 opacity-95">
        <SignalDots />
        <WifiIcon />
        <BatteryIcon />
      </span>
    </div>
  );
}

function SignalDots() {
  return (
    <span className="flex items-end gap-0.5">
      {[3, 5, 7, 9].map((h) => (
        <span
          key={h}
          className="w-0.5 rounded-full bg-current"
          style={{ height: `${h}px` }}
        />
      ))}
    </span>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor" aria-hidden>
      <path d="M8 11a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 8 11Z" />
      <path
        d="M8 7.2a3.5 3.5 0 0 1 2.45 1l1-1.05a4.9 4.9 0 0 0-6.9 0l1 1.05A3.5 3.5 0 0 1 8 7.2Z"
        opacity=".9"
      />
      <path
        d="M8 3.6a7.1 7.1 0 0 1 5 2.1l1.1-1.1a8.5 8.5 0 0 0-12.2 0l1.1 1.1A7.1 7.1 0 0 1 8 3.6Z"
        opacity=".75"
      />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="22"
        height="11"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.5"
      />
      <rect x="23" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor" />
    </svg>
  );
}
