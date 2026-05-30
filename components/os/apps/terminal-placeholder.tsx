"use client";

export function TerminalPlaceholderApp() {
  return (
    <div className="h-full bg-black p-4 font-mono text-xs text-emerald-300">
      <div className="opacity-70">vishal-os ~ %</div>
      <div className="mt-2">Terminal — coming in M2.</div>
      <div className="mt-1 opacity-70">
        Will support: whoami, experience, projects, cat resume.md, ask pi
        &quot;...&quot;, contact, sudo hire-me.
      </div>
    </div>
  );
}
