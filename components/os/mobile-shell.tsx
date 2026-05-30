"use client";

export function MobileShell() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-linear-to-b from-indigo-900 via-purple-900 to-slate-900 text-white">
      <StatusBar />
      <HomeGrid />
      <HomeIndicator />
    </div>
  );
}

function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 flex h-11 items-center justify-between px-6 pt-2 text-xs font-semibold">
      <span>--:--</span>
      <span className="opacity-70">Vishal OS</span>
      <span className="tabular-nums">100%</span>
    </div>
  );
}

function HomeGrid() {
  const apps = ["Pi", "Terminal", "Finder", "Preview", "Notes", "Contact"];
  return (
    <div className="absolute inset-x-0 top-16 bottom-16 px-6">
      <div className="grid grid-cols-4 gap-x-4 gap-y-6">
        {apps.map((label) => (
          <AppIcon key={label} label={label} />
        ))}
      </div>
      <p className="mt-12 text-center text-xs opacity-50">
        Mobile scaffold — apps coming in M4.
      </p>
    </div>
  );
}

function AppIcon({ label }: { label: string }) {
  return (
    <button className="flex flex-col items-center gap-1">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-[10px] font-medium backdrop-blur">
        {label}
      </span>
      <span className="text-[11px] opacity-90">{label}</span>
    </button>
  );
}

function HomeIndicator() {
  return (
    <div className="absolute inset-x-0 bottom-2 flex justify-center">
      <div className="h-1 w-32 rounded-full bg-white/70" />
    </div>
  );
}
