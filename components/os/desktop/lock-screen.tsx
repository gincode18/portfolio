"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { profile } from "@/content/profile";
import { useDesktopShell } from "@/lib/store/desktop-shell";
import { Wallpaper } from "@/components/os/wallpaper";

export function DesktopLockScreen() {
  const unlock = useDesktopShell((s) => s.unlock);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") return;
      unlock();
    }
    window.addEventListener("keydown", onKey, { once: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [unlock]);

  const time = now
    ? now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      })
    : "--:--";
  const date = now
    ? now.toLocaleDateString([], {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-50 flex flex-col text-white"
      onClick={unlock}
    >
      <Wallpaper variant="desktop" tint={0.35} blur />

      {/* Top status row */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 text-sm">
        <span className="font-semibold">Vishal OS</span>
        <span className="opacity-80">
          {date} · {time}
        </span>
      </div>

      {/* Center: clock + login card */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10">
        <div className="text-center">
          <div className="text-base opacity-70">{date}</div>
          <div className="font-mono text-[140px] font-thin leading-none tracking-tight drop-shadow-2xl">
            {time}
          </div>
        </div>

        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            unlock();
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex flex-col items-center gap-3 rounded-3xl bg-white/10 px-10 py-6 backdrop-blur-md ring-1 ring-white/15 transition hover:bg-white/15"
        >
          <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-white/40">
            <Image
              src="/profile-photo.jpeg"
              alt={profile.name}
              fill
              priority
              sizes="112px"
              className="object-cover"
            />
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold">{profile.name}</div>
            <div className="text-sm opacity-75">{profile.title}</div>
          </div>
        </motion.button>
      </div>

      {/* Bottom hint */}
      <div className="relative z-10 pb-10 text-center text-xs uppercase tracking-[0.3em] opacity-60">
        click anywhere · or press any key to enter
      </div>
    </motion.div>
  );
}
