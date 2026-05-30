import type { AppId } from "@/lib/apps/registry";

export type AppIconKey = AppId | "pi";

export type AppIconConfig = {
  /** Tailwind classes for the icon background (squircle interior). */
  gradient: string;
  /** Tailwind classes for the foreground glyph color. */
  fg: string;
  /** The glyph rendered inside the square, sized to `size` px. */
  glyph: (size: number) => React.ReactNode;
};

const githubLogo = (size: number) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const briefcase = (size: number) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="2.5" y="7" width="19" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M2.5 12h19" />
  </svg>
);

const notepad = (size: number) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M5 4h14v16H5z" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

const gear = (size: number) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </svg>
);

const infoI = (size: number) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <circle cx="12" cy="6" r="1.8" />
    <rect x="10.5" y="10" width="3" height="10" rx="1.2" />
  </svg>
);

const terminalGlyph = (size: number) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <polyline points="5 8 10 12 5 16" />
    <line x1="13" y1="16" x2="19" y2="16" />
  </svg>
);

const documentPdf = (size: number) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
  >
    <path
      d="M7 3h7l4 4v14H7z"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fontFamily="ui-sans-serif, system-ui"
      fontSize="6"
      fontWeight="800"
      fill="currentColor"
      letterSpacing="0.3"
    >
      PDF
    </text>
  </svg>
);

const piPlaceholder = (size: number) => (
  // Placeholder used by the icon system in places where Pi is shown like an
  // ordinary app. The live, rotating orb is rendered by <PiOrb /> directly in
  // the dock and on the lockscreen for the breathing effect.
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <defs>
      <linearGradient id="piGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ff6b9d" />
        <stop offset="35%" stopColor="#c66dff" />
        <stop offset="70%" stopColor="#6db3ff" />
        <stop offset="100%" stopColor="#6dffce" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="8" fill="url(#piGrad)" />
  </svg>
);

export const APP_ICONS: Record<AppIconKey, AppIconConfig> = {
  pi: {
    gradient: "bg-black",
    fg: "text-white",
    glyph: piPlaceholder,
  },
  terminal: {
    gradient: "bg-linear-to-br from-neutral-800 to-black",
    fg: "text-emerald-400",
    glyph: terminalGlyph,
  },
  about: {
    gradient: "bg-linear-to-br from-sky-400 to-blue-600",
    fg: "text-white",
    glyph: infoI,
  },
  projects: {
    // GitHub colors — charcoal squircle with the Octocat mark.
    gradient: "bg-linear-to-br from-zinc-700 to-zinc-900",
    fg: "text-white",
    glyph: githubLogo,
  },
  experience: {
    gradient: "bg-linear-to-br from-fuchsia-500 to-purple-700",
    fg: "text-white",
    glyph: briefcase,
  },
  notes: {
    gradient: "bg-linear-to-br from-yellow-300 to-amber-500",
    fg: "text-amber-900",
    glyph: notepad,
  },
  preview: {
    gradient: "bg-linear-to-br from-rose-400 to-red-600",
    fg: "text-white",
    glyph: documentPdf,
  },
  "system-preferences": {
    gradient: "bg-linear-to-br from-slate-400 to-slate-700",
    fg: "text-white",
    glyph: gear,
  },
};
