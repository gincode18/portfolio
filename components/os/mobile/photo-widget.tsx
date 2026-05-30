"use client";

import Image from "next/image";
import { profile } from "@/content/profile";
import { cn } from "@/lib/utils";

type Props = {
  size?: "small" | "large";
  onClick?: () => void;
};

/**
 * iOS-style photo widget showing Vishal's profile picture. The "large" size is
 * a 2x2 grid widget; "small" is 1x1 for tighter layouts.
 */
export function PhotoWidget({ size = "large", onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={`Open About ${profile.name}`}
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-neutral-900 text-left text-white shadow-lg ring-1 ring-white/10 transition active:scale-[0.98]",
        size === "large" ? "aspect-square w-full" : "aspect-square w-full"
      )}
    >
      <Image
        src="/profile-photo.jpeg"
        alt={profile.name}
        fill
        sizes="(max-width: 768px) 50vw, 200px"
        className="object-cover transition-transform duration-500 group-active:scale-105"
        priority
      />
      {/* gradient overlay for readability */}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/0 to-black/0" />
      {/* iOS-widget caption */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="text-[11px] uppercase tracking-wider opacity-70">
          {size === "large" ? "Portfolio" : ""}
        </div>
        <div
          className={cn(
            "font-semibold leading-tight",
            size === "large" ? "text-lg" : "text-sm"
          )}
        >
          {profile.name}
        </div>
        {size === "large" && (
          <div className="text-[11px] opacity-80">{profile.title}</div>
        )}
      </div>
    </button>
  );
}
