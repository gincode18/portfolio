"use client";

import type { ReactNode } from "react";
import { AboutApp } from "@/components/os/apps/about";
import { ProjectsApp } from "@/components/os/apps/projects";
import { ExperienceApp } from "@/components/os/apps/experience";
import { SystemPreferencesApp } from "@/components/os/apps/system-preferences";
import { TerminalApp } from "@/components/os/apps/terminal";
import { PreviewApp } from "@/components/os/apps/preview";
import { NotesApp } from "@/components/os/apps/notes";

export type AppId =
  | "about"
  | "projects"
  | "experience"
  | "preview"
  | "notes"
  | "system-preferences"
  | "terminal";

export type AppDef = {
  id: AppId;
  title: string;
  dockLabel: string;
  width?: number;
  height?: number;
  render: () => ReactNode;
};

export const APPS: Record<AppId, AppDef> = {
  about: {
    id: "about",
    title: "About — Vishal",
    dockLabel: "About",
    width: 600,
    height: 520,
    render: () => <AboutApp />,
  },
  projects: {
    id: "projects",
    title: "Projects",
    dockLabel: "Projects",
    width: 760,
    height: 520,
    render: () => <ProjectsApp />,
  },
  experience: {
    id: "experience",
    title: "Experience",
    dockLabel: "Experience",
    width: 720,
    height: 520,
    render: () => <ExperienceApp />,
  },
  "system-preferences": {
    id: "system-preferences",
    title: "System Preferences",
    dockLabel: "Settings",
    width: 480,
    height: 360,
    render: () => <SystemPreferencesApp />,
  },
  terminal: {
    id: "terminal",
    title: "Terminal",
    dockLabel: "Terminal",
    width: 700,
    height: 460,
    render: () => <TerminalApp />,
  },
  preview: {
    id: "preview",
    title: "Preview — resume.pdf",
    dockLabel: "Resume",
    width: 760,
    height: 600,
    render: () => <PreviewApp />,
  },
  notes: {
    id: "notes",
    title: "Notes",
    dockLabel: "Notes",
    width: 800,
    height: 560,
    render: () => <NotesApp />,
  },
};

/**
 * Dock entries. "pi" is a special overlay (not a window) — see DOCK_ITEMS in
 * the desktop shell for how it is wired.
 */
export const DOCK_ORDER: ("pi" | AppId)[] = [
  "pi",
  "terminal",
  "about",
  "projects",
  "experience",
  "notes",
  "preview",
  "system-preferences",
];
