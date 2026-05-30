"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function SystemPreferencesApp() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = (theme === "system" ? systemTheme : theme) ?? "system";

  return (
    <div className="h-full overflow-y-auto p-6 text-sm">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">
        System Preferences
      </h2>

      <Row label="Appearance">
        <div className="flex gap-2">
          <ThemeButton
            label="System"
            active={mounted && theme === "system"}
            onClick={() => setTheme("system")}
          />
          <ThemeButton
            label="Light"
            active={mounted && theme === "light"}
            onClick={() => setTheme("light")}
          />
          <ThemeButton
            label="Dark"
            active={mounted && theme === "dark"}
            onClick={() => setTheme("dark")}
          />
        </div>
        {mounted && (
          <div className="mt-2 text-xs text-muted-foreground">
            Resolved: <span className="font-mono">{current}</span>
          </div>
        )}
      </Row>

      <Row label="Boot animation">
        <button
          className="rounded border border-border px-3 py-1.5 text-xs hover:bg-foreground/5"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.localStorage.removeItem("vishal-os-booted");
              window.location.reload();
            }
          }}
        >
          Replay on next load
        </button>
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function ThemeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded border px-3 py-1.5 text-xs ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border hover:bg-foreground/5"
      }`}
    >
      {label}
    </button>
  );
}
