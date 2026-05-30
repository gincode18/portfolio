"use client";

import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  active?: boolean;
  className?: string;
};

export function PiOrb({ size = 28, active = false, className }: Props) {
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* outer rotating gradient (the colorful halo) */}
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          active ? "pi-orb-spin-fast" : "pi-orb-spin"
        )}
        style={{
          background:
            "conic-gradient(from 0deg, #ff6b9d, #c66dff, #6db3ff, #6dffce, #ffeb6d, #ff8a4c, #ff6b9d)",
          filter: "blur(2px)",
        }}
      />
      {/* inner counter-rotating layer for depth */}
      <div
        className={cn(
          "absolute inset-[15%] rounded-full mix-blend-screen",
          active ? "pi-orb-spin-reverse-fast" : "pi-orb-spin-reverse"
        )}
        style={{
          background:
            "conic-gradient(from 180deg, #c66dff, #6db3ff, #ff6b9d, #ffeb6d, #6dffce, #c66dff)",
          filter: "blur(1px)",
        }}
      />
      {/* glossy highlight */}
      <div
        className="absolute inset-[10%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), transparent 55%)",
        }}
      />
      {/* subtle dark core for contrast against light backgrounds */}
      <div className="absolute inset-[35%] rounded-full bg-white/5 backdrop-blur-sm" />
    </div>
  );
}
