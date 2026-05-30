"use client";

import { profile } from "@/content/profile";

export function DesktopShell() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <MenuBar />
      <Desktop />
      <Dock />
    </div>
  );
}

function MenuBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-30 flex h-7 items-center justify-between border-b border-white/10 bg-black/40 px-4 text-xs backdrop-blur">
      <div className="flex items-center gap-4">
        <span className="font-semibold">Vishal OS</span>
        <span className="opacity-70">File</span>
        <span className="opacity-70">Edit</span>
        <span className="opacity-70">View</span>
        <span className="opacity-70">Window</span>
        <span className="opacity-70">Help</span>
      </div>
      <div className="flex items-center gap-3 opacity-80">
        <a
          href={profile.links.github}
          target="_blank"
          rel="noreferrer"
          className="hover:opacity-100"
        >
          GitHub
        </a>
        <a
          href={profile.links.linkedin}
          target="_blank"
          rel="noreferrer"
          className="hover:opacity-100"
        >
          LinkedIn
        </a>
        <Clock />
      </div>
    </div>
  );
}

function Clock() {
  return <span className="tabular-nums">--:--</span>;
}

function Desktop() {
  return (
    <div className="absolute inset-x-0 top-7 bottom-20 grid place-items-center">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          Vishal OS
        </h1>
        <p className="mt-2 text-sm opacity-60">
          Press ⌘K to ask Pi anything.
        </p>
        <p className="mt-1 text-xs opacity-40">
          Desktop scaffold — apps coming in M1.
        </p>
      </div>
    </div>
  );
}

function Dock() {
  return (
    <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center">
      <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 backdrop-blur">
        <DockIcon label="Pi" />
        <DockIcon label="Terminal" />
        <DockIcon label="Finder" />
        <DockIcon label="Preview" />
      </div>
    </div>
  );
}

function DockIcon({ label }: { label: string }) {
  return (
    <button
      className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-[10px] font-medium hover:bg-white/20"
      aria-label={label}
    >
      {label}
    </button>
  );
}
