"use client";

import Image from "next/image";

type Variant = "desktop" | "phone";

const ASSETS: Record<Variant, { light: string; dark: string }> = {
  desktop: {
    light: "/wallpaper-light-desktop.jpg",
    dark: "/wallpaper-dark-desktop.jpg",
  },
  phone: {
    light: "/wallpaper-light-phone.png",
    dark: "/wallpaper-dark-phone.png",
  },
};

type Props = {
  variant: Variant;
  /** Optional tint overlay opacity (0–1). Defaults to 0 (no tint). */
  tint?: number;
  /** Optional extra blur for the photo, e.g. behind the lockscreen widgets. */
  blur?: boolean;
};

/**
 * Renders both light + dark wallpapers and toggles visibility via Tailwind's
 * `dark:` variant. Avoids the FOUC of swapping `src` after hydration; both
 * images preload but only one is visible.
 */
export function Wallpaper({ variant, tint = 0, blur = false }: Props) {
  const { light, dark } = ASSETS[variant];
  const blurClass = blur ? "blur-2xl" : "";

  return (
    <>
      <Image
        src={light}
        alt=""
        fill
        priority
        sizes="100vw"
        className={`object-cover dark:hidden ${blurClass}`}
      />
      <Image
        src={dark}
        alt=""
        fill
        priority
        sizes="100vw"
        className={`hidden object-cover dark:block ${blurClass}`}
      />
      {tint > 0 && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: tint }}
          aria-hidden
        />
      )}
    </>
  );
}
