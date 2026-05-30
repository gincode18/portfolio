"use client";

import type { ReactNode } from "react";
import { AboutApp } from "@/components/os/apps/about";
import { ProjectsApp } from "@/components/os/apps/projects";
import { ExperienceApp } from "@/components/os/apps/experience";
import { SystemPreferencesApp } from "@/components/os/apps/system-preferences";
import { TerminalPlaceholderApp } from "@/components/os/apps/terminal-placeholder";
import { PiPlaceholderApp } from "@/components/os/apps/pi-placeholder";

export type AppId =
  | "about"
  | "projects"
  | "experience"
  | "system-preferences"
  | "terminal"
  | "pi";

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
    width: 640,
    height: 400,
    render: () => <TerminalPlaceholderApp />,
  },
  pi: {
    id: "pi",
    title: "Pi",
    dockLabel: "Pi",
    width: 560,
    height: 420,
    render: () => <PiPlaceholderApp />,
  },
};

export const DOCK_ORDER: AppId[] = [
  "pi",
  "terminal",
  "about",
  "projects",
  "experience",
  "system-preferences",
];
