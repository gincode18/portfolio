"use client";

import { useState } from "react";
import { projects, type Project } from "@/content/projects";

export function ProjectsApp() {
  const [selectedId, setSelectedId] = useState<string>(projects[0].id);
  const selected = projects.find((p) => p.id === selectedId) ?? projects[0];

  return (
    <div className="grid h-full grid-cols-[200px_1fr] text-sm">
      <aside className="border-r border-border/60 bg-muted/30 p-2">
        <ul className="space-y-0.5">
          {projects.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setSelectedId(p.id)}
                className={`w-full rounded px-2 py-1.5 text-left ${
                  p.id === selectedId
                    ? "bg-foreground/10 text-foreground"
                    : "text-foreground/80 hover:bg-foreground/5"
                }`}
              >
                <div className="font-medium">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.tagline}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <ProjectDetail project={selected} />
    </div>
  );
}

function ProjectDetail({ project }: { project: Project }) {
  return (
    <div className="overflow-y-auto p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">{project.name}</h2>
        <div className="text-muted-foreground">{project.tagline}</div>
        {project.award && (
          <div className="mt-1 text-xs font-medium text-amber-500 dark:text-amber-400">
            {project.award}
          </div>
        )}
      </div>

      <p className="mb-4 leading-relaxed text-foreground/90">
        {project.description}
      </p>

      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Highlights
      </h3>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-foreground/90">
        {project.highlights.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>

      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Stack
      </h3>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {project.stack.map((s) => (
          <span
            key={s}
            className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-xs"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="flex gap-4 text-xs">
        {project.links.demo && (
          <a
            href={project.links.demo}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:underline"
          >
            Live demo
          </a>
        )}
        {project.links.github && (
          <a
            href={project.links.github}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:underline"
          >
            GitHub
          </a>
        )}
        {project.links.video && (
          <a
            href={project.links.video}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:underline"
          >
            Video
          </a>
        )}
      </div>
    </div>
  );
}
