import { Type, type FunctionDeclaration } from "@google/genai";

// Apps Pi is allowed to open. Keep this in sync with lib/apps/registry's AppId.
// Pi never opens itself.
const OPENABLE_APPS = [
  "about",
  "projects",
  "experience",
  "preview",
  "notes",
  "terminal",
  "system-preferences",
] as const;

export const piTools: FunctionDeclaration[] = [
  {
    name: "openApp",
    description:
      "Open an app window in Vishal OS so the user can see something visually. Use this when the user asks to 'see', 'show', 'open', or navigate. Always also reply in text — the tool call is an extra action, not a replacement for the answer.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appId: {
          type: Type.STRING,
          enum: [...OPENABLE_APPS],
          description: "The app to open.",
        },
        selectId: {
          type: Type.STRING,
          description:
            "Optional id to focus inside the app. For projects: the project id (e.g. 'serenity-ai'). For experience: the experience id (e.g. 'markopolo-fulltime'). For notes: the note id (e.g. 'markopolo-scaling').",
        },
      },
      required: ["appId"],
    },
  },
  {
    name: "openExternalLink",
    description:
      "Open a URL in a new tab (GitHub repo, live demo, LinkedIn). Use sparingly — prefer openApp when the destination is inside Vishal OS.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: "Absolute HTTPS URL." },
        label: { type: Type.STRING, description: "Short label for logs." },
      },
      required: ["url"],
    },
  },
];

export type ToolCall =
  | { name: "openApp"; args: { appId: string; selectId?: string } }
  | { name: "openExternalLink"; args: { url: string; label?: string } };

export function validateToolCall(
  name: string,
  args: Record<string, unknown>
): ToolCall | null {
  if (name === "openApp") {
    const appId = args.appId;
    if (typeof appId !== "string") return null;
    if (!(OPENABLE_APPS as readonly string[]).includes(appId)) return null;
    const selectId =
      typeof args.selectId === "string" ? args.selectId : undefined;
    return { name: "openApp", args: { appId, selectId } };
  }
  if (name === "openExternalLink") {
    const url = args.url;
    if (typeof url !== "string") return null;
    if (!url.startsWith("https://")) return null;
    const label = typeof args.label === "string" ? args.label : undefined;
    return { name: "openExternalLink", args: { url, label } };
  }
  return null;
}
