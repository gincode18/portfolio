"use client";

export function PiPlaceholderApp() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm">
      <div className="text-2xl">Pi</div>
      <div className="max-w-xs text-muted-foreground">
        Gemini-powered assistant with RAG over Vishal&apos;s resume and
        projects. Coming in M3.
      </div>
      <div className="text-xs text-muted-foreground">
        Will run on the same Raspberry Pi 5 this portfolio is hosted on.
      </div>
    </div>
  );
}
