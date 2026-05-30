"use client";

import { useWindows } from "@/lib/store/windows";
import { APPS, type AppId } from "@/lib/apps/registry";

export type DispatchedTool =
  | { name: "openApp"; label: string }
  | { name: "openExternalLink"; label: string };

/**
 * Apply a tool call streamed from /api/pi to the OS. Validated by the server,
 * but we re-check the appId against the registry before touching the store so
 * a stale server can never open an unknown window.
 *
 * Returns a short label describing what happened, suitable for showing inline
 * in the chat ("opened Projects · Serenity-AI").
 */
export function applyToolCall(
  name: string,
  args: Record<string, unknown>
): DispatchedTool | null {
  if (name === "openApp") {
    const appId = args.appId;
    if (typeof appId !== "string") return null;
    if (!(appId in APPS)) return null;
    const def = APPS[appId as AppId];
    const selectId =
      typeof args.selectId === "string" ? args.selectId : undefined;

    useWindows.getState().openApp(appId, {
      title: def.title,
      width: def.width,
      height: def.height,
      selectId,
    });
    return {
      name: "openApp",
      label: selectId ? `opened ${def.dockLabel} · ${selectId}` : `opened ${def.dockLabel}`,
    };
  }

  if (name === "openExternalLink") {
    const url = args.url;
    if (typeof url !== "string" || !url.startsWith("https://")) return null;
    const label = typeof args.label === "string" ? args.label : url;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    return { name: "openExternalLink", label: `opened ${label}` };
  }

  return null;
}
