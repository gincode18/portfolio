import { APPS, type AppId } from "@/lib/apps/registry";
import { projects } from "@/content/projects";
import { experience } from "@/content/experience";

export type SpotlightHit = {
  id: string;
  kind: "app" | "project" | "experience" | "action";
  title: string;
  subtitle?: string;
  openApp: AppId;
  /** Optional follow-up action after the app opens (e.g. select an item). */
  selectId?: string;
  /** Higher = better. */
  score: number;
};

export function spotlightSearch(query: string): SpotlightHit[] {
  const q = query.trim().toLowerCase();

  const apps: SpotlightHit[] = (Object.keys(APPS) as AppId[]).map((id) => ({
    id: `app:${id}`,
    kind: "app",
    title: APPS[id].title,
    subtitle: `Open ${APPS[id].dockLabel}`,
    openApp: id,
    score: 0,
  }));

  const projectHits: SpotlightHit[] = projects.map((p) => ({
    id: `project:${p.id}`,
    kind: "project",
    title: p.name,
    subtitle: p.tagline,
    openApp: "projects",
    selectId: p.id,
    score: 0,
  }));

  const expHits: SpotlightHit[] = experience.map((e) => ({
    id: `exp:${e.id}`,
    kind: "experience",
    title: `${e.role} — ${e.company}`,
    subtitle: `${e.start} – ${e.end}`,
    openApp: "experience",
    selectId: e.id,
    score: 0,
  }));

  const actions: SpotlightHit[] = [
    {
      id: "action:ask-pi",
      kind: "action",
      title: "Ask Pi…",
      subtitle: "AI assistant (coming in M3)",
      openApp: "pi",
      score: 0,
    },
    {
      id: "action:terminal",
      kind: "action",
      title: "Open Terminal",
      subtitle: "Run commands like `whoami`, `projects`, `sudo hire-me`",
      openApp: "terminal",
      score: 0,
    },
  ];

  const all = [...apps, ...projectHits, ...expHits, ...actions];

  if (!q) {
    // Default suggestions when the field is empty.
    return [
      actions[0],
      actions[1],
      ...apps.filter((a) => a.openApp === "about" || a.openApp === "projects"),
    ].slice(0, 6);
  }

  return all
    .map((hit) => ({ ...hit, score: scoreHit(hit, q) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function scoreHit(hit: SpotlightHit, q: string): number {
  const title = hit.title.toLowerCase();
  const sub = (hit.subtitle ?? "").toLowerCase();

  if (title === q) return 1000;
  if (title.startsWith(q)) return 500;
  if (title.includes(q)) return 200;
  if (sub.includes(q)) return 80;

  // very loose fuzzy: every query char appears in title in order
  let ti = 0;
  for (const ch of q) {
    const next = title.indexOf(ch, ti);
    if (next === -1) return 0;
    ti = next + 1;
  }
  return 20;
}
