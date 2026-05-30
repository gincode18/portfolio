"use client";

import { motion, type PanInfo } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useMobileShell } from "@/lib/store/mobile-shell";
import { usePi } from "@/lib/store/pi";
import { StatusBar } from "@/components/os/mobile/status-bar";
import { PhotoWidget } from "@/components/os/mobile/photo-widget";
import { PiWidget } from "@/components/os/mobile/pi-widget";

const SWIPE_UP_THRESHOLD = 80;

export function LockScreen() {
  const unlock = useMobileShell((s) => s.unlock);
  const showPi = usePi((s) => s.show);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(id);
  }, []);

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
      })
    : "";

  function onPan(_e: unknown, info: PanInfo) {
    if (info.offset.y < -SWIPE_UP_THRESHOLD) unlock();
  }

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.4}
      onDragEnd={onPan}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: "-100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="absolute inset-0 z-20 flex flex-col overflow-hidden"
    >
      {/* wallpaper */}
      <Image
        src="/profile-photo.jpeg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover blur-xl brightness-50 saturate-110"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/60" />

      {/* foreground */}
      <div className="relative z-10 flex flex-1 flex-col text-white">
        <StatusBar tint="light" />

        <div className="flex flex-1 flex-col px-6">
          <div className="mt-6 text-center">
            <div className="text-sm opacity-80">{date}</div>
            <div className="font-mono text-[88px] font-thin leading-none tracking-tight">
              {time}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <PhotoWidget
              size="large"
              onClick={() => unlock()}
            />
            <PiWidget
              onClick={() => {
                showPi();
              }}
            />
          </div>

          <div className="mt-auto pb-12 text-center text-xs opacity-70">
            swipe up · or tap a widget to unlock
          </div>
        </div>
      </div>
    </motion.div>
  );
}
