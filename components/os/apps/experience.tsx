"use client";

import { experience } from "@/content/experience";

export function ExperienceApp() {
  return (
    <div className="h-full overflow-y-auto p-6 text-sm">
      <h2 className="mb-4 text-xl font-semibold tracking-tight">Experience</h2>

      <ol className="space-y-6 border-l border-border pl-4">
        {experience.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-foreground" />

            <div className="flex items-baseline justify-between gap-2">
              <div>
                <div className="font-medium text-foreground">{e.role}</div>
                <div className="text-foreground/80">{e.company}</div>
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <div>
                  {e.start} – {e.end}
                </div>
                <div>{e.location}</div>
              </div>
            </div>

            <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground/90">
              {e.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {e.stack.map((s) => (
                <span
                  key={s}
                  className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px]"
                >
                  {s}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
