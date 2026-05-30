import { profile } from "@/content/profile";
import { experience } from "@/content/experience";
import { projects } from "@/content/projects";
import { education, skills, achievements } from "@/content/skills";
import { notes } from "@/content/notes";
import type { ChunkMetadata } from "@/lib/pi/retrieve";

export type SourceChunk = {
  source: string;
  text: string;
  metadata: ChunkMetadata;
};

/**
 * Each source emits one or more chunks. A chunk is the unit of RAG retrieval.
 *
 * Keep chunks under ~1k chars: smaller is fine, larger gets noisy because we
 * only retrieve top-K and a single huge chunk crowds out diversity.
 */
export function collectChunks(): SourceChunk[] {
  const out: SourceChunk[] = [];

  // Profile / about
  out.push({
    source: "profile:bio",
    text: header("About", `${profile.name} — ${profile.title}`) +
      `\n${profile.location} · ${profile.email}\n\n${profile.bio}`,
    metadata: {
      kind: "profile",
      title: "About Vishal",
      route: { type: "openApp", appId: "about" },
    },
  });

  // Education
  out.push({
    source: "education:vit",
    text: header("Education", education.degree) +
      `\n${education.school} · CGPA ${education.cgpa} · ${education.start}–${education.end}`,
    metadata: {
      kind: "education",
      title: education.school,
      route: { type: "openApp", appId: "about" },
    },
  });

  // Skills (one chunk per category to avoid one giant blob)
  for (const [k, items] of Object.entries(skills) as Array<[string, readonly string[]]>) {
    out.push({
      source: `skills:${k}`,
      text: header(`Skills — ${k}`, items.join(", ")),
      metadata: { kind: "skills", id: k, title: k, route: { type: "openApp", appId: "about" } },
    });
  }

  // Achievements
  for (const a of achievements) {
    out.push({
      source: `achievement:${slug(a.title)}`,
      text: header(a.title, a.detail),
      metadata: {
        kind: "achievement",
        title: a.title,
        route: { type: "openApp", appId: "about" },
      },
    });
  }

  // Experience — one chunk per role; highlights bunched together
  for (const e of experience) {
    out.push({
      source: `experience:${e.id}`,
      text:
        header(`${e.role} @ ${e.company}`, `${e.start} – ${e.end} · ${e.location}`) +
        `\n` +
        e.highlights.map((h) => `- ${h}`).join("\n") +
        `\n\nstack: ${e.stack.join(", ")}`,
      metadata: {
        kind: "experience",
        id: e.id,
        title: `${e.role} @ ${e.company}`,
        route: { type: "openApp", appId: "experience", selectId: e.id },
      },
    });
  }

  // Projects — one chunk per project (still small)
  for (const p of projects) {
    out.push({
      source: `project:${p.id}`,
      text:
        header(p.name, p.tagline) +
        `\n${p.description}\n\n` +
        `Highlights:\n${p.highlights.map((h) => `- ${h}`).join("\n")}\n\n` +
        `Stack: ${p.stack.join(", ")}` +
        (p.award ? `\nAward: ${p.award}` : ""),
      metadata: {
        kind: "project",
        id: p.id,
        title: p.name,
        route: { type: "openApp", appId: "projects", selectId: p.id },
      },
    });
  }

  // Notes — split each note body into chunks of ~800 chars
  for (const n of notes) {
    const parts = splitForChunks(n.body, 800);
    parts.forEach((text, i) => {
      out.push({
        source: `note:${n.id}#${i}`,
        text:
          header(n.title, n.summary) +
          (parts.length > 1 ? `\n(part ${i + 1}/${parts.length})\n` : "\n") +
          text,
        metadata: {
          kind: "note",
          id: n.id,
          title: n.title,
          route: { type: "openApp", appId: "notes", selectId: n.id },
        },
      });
    });
  }

  return out;
}

function header(title: string, subtitle?: string): string {
  return subtitle ? `## ${title}\n${subtitle}` : `## ${title}`;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Naive paragraph-aware chunking. Splits on double newlines, then re-joins
 * paragraphs into chunks no larger than `target` chars. Doesn't break across
 * paragraphs — keeps semantic units intact.
 */
function splitForChunks(text: string, target: number): string[] {
  const paras = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let cur = "";
  for (const p of paras) {
    if (cur.length + p.length + 2 <= target || cur.length === 0) {
      cur = cur ? `${cur}\n\n${p}` : p;
    } else {
      chunks.push(cur);
      cur = p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}
