import { profile } from "@/content/profile";
import { experience } from "@/content/experience";
import { projects } from "@/content/projects";
import { education, skills, achievements } from "@/content/skills";

export type CommandResult = {
  lines: string[];
  exitCode?: number;
};

export type CommandFn = (args: string[]) => CommandResult;

const HORIZONTAL_RULE = "─".repeat(48);

const commands: Record<string, { fn: CommandFn; help: string }> = {
  help: {
    help: "show this help",
    fn: () => ({
      lines: [
        "Available commands:",
        ...Object.entries(commands)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, { help }]) => `  ${name.padEnd(14)} ${help}`),
      ],
    }),
  },

  whoami: {
    help: "print profile summary",
    fn: () => ({
      lines: [
        `${profile.name} — ${profile.title}`,
        `${profile.location} · ${profile.email}`,
        "",
        profile.bio,
      ],
    }),
  },

  experience: {
    help: "list work experience",
    fn: () => ({
      lines: experience.flatMap((e) => [
        `${e.role} @ ${e.company}`,
        `  ${e.start} – ${e.end} · ${e.location}`,
        ...e.highlights.map((h) => `  · ${h}`),
        "",
      ]),
    }),
  },

  projects: {
    help: "list projects, e.g. `projects --filter=ai`",
    fn: (args) => {
      const filterArg = args.find((a) => a.startsWith("--filter="));
      const filter = filterArg?.split("=")[1]?.toLowerCase();
      const list = filter
        ? projects.filter(
            (p) =>
              p.stack.some((s) => s.toLowerCase().includes(filter)) ||
              p.name.toLowerCase().includes(filter) ||
              p.tagline.toLowerCase().includes(filter)
          )
        : projects;
      if (list.length === 0) {
        return { lines: [`no projects match "${filter}"`] };
      }
      return {
        lines: list.flatMap((p) => [
          `${p.name}  —  ${p.tagline}`,
          `  ${p.stack.join(" · ")}`,
          p.award ? `  ${p.award}` : "",
          "",
        ]),
      };
    },
  },

  "cat resume.md": {
    help: "print resume as markdown",
    fn: () => ({
      lines: [
        `# ${profile.name}`,
        `${profile.title} · ${profile.location} · ${profile.email}`,
        "",
        "## Bio",
        profile.bio,
        "",
        "## Education",
        `${education.degree}`,
        `${education.school} · CGPA ${education.cgpa} · ${education.start}–${education.end}`,
        "",
        "## Experience",
        ...experience.flatMap((e) => [
          `### ${e.role} — ${e.company} (${e.start} – ${e.end})`,
          ...e.highlights.map((h) => `- ${h}`),
          "",
        ]),
        "## Projects",
        ...projects.flatMap((p) => [
          `### ${p.name} — ${p.tagline}`,
          p.description,
          "",
        ]),
        "## Stack",
        `- Languages: ${skills.languages.join(", ")}`,
        `- Frontend: ${skills.frontend.join(", ")}`,
        `- Backend: ${skills.backend.join(", ")}`,
        `- Data: ${skills.data.join(", ")}`,
        `- Cloud: ${skills.cloud.join(", ")}`,
        `- AI: ${skills.ai.join(", ")}`,
        "",
        "## Achievements",
        ...achievements.map((a) => `- ${a.title} — ${a.detail}`),
      ],
    }),
  },

  contact: {
    help: "show contact info",
    fn: () => ({
      lines: [
        `email     ${profile.email}`,
        `phone     ${profile.phone}`,
        `github    ${profile.links.github}`,
        `linkedin  ${profile.links.linkedin}`,
        "",
        "The Mail app (M3) will let you send a message that lands in my inbox.",
      ],
    }),
  },

  "ask pi": {
    help: 'ask the Pi assistant, e.g. `ask pi "what did you build at Markopolo?"`',
    fn: (args) => {
      const q = args.join(" ").replace(/^["']|["']$/g, "");
      if (!q) {
        return {
          lines: ['Usage: ask pi "your question"'],
        };
      }
      return {
        lines: [
          `> ${q}`,
          "",
          "Pi assistant (Gemini-backed RAG) is coming in M3.",
          "Until then, open the Pi app from the Dock for a placeholder.",
        ],
      };
    },
  },

  "sudo hire-me": {
    help: "(easter egg)",
    fn: () => ({
      lines: [
        HORIZONTAL_RULE,
        "  Hiring signal acknowledged.",
        HORIZONTAL_RULE,
        "",
        `  ${profile.name} is open to senior full-stack / AI`,
        "  engineering roles at product companies.",
        "",
        `  Reach me:`,
        `    ${profile.email}`,
        `    ${profile.links.linkedin}`,
        "",
        HORIZONTAL_RULE,
      ],
    }),
  },

  clear: {
    help: "clear the screen",
    fn: () => ({ lines: ["__CLEAR__"] }),
  },
};

export const COMMAND_NAMES = Object.keys(commands).sort();

export function parseAndRun(input: string): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { lines: [] };

  // Match multi-word commands first (e.g. "cat resume.md", "ask pi", "sudo hire-me").
  const multiWord = Object.keys(commands)
    .filter((c) => c.includes(" "))
    .sort((a, b) => b.length - a.length);

  for (const name of multiWord) {
    if (trimmed === name || trimmed.startsWith(name + " ")) {
      const rest = trimmed.slice(name.length).trim();
      const args = rest ? splitArgs(rest) : [];
      return safeRun(commands[name].fn, args);
    }
  }

  const [head, ...rest] = splitArgs(trimmed);
  const cmd = commands[head];
  if (!cmd) {
    return {
      lines: [
        `command not found: ${head}`,
        `type \`help\` to see available commands`,
      ],
      exitCode: 127,
    };
  }
  return safeRun(cmd.fn, rest);
}

function safeRun(fn: CommandFn, args: string[]): CommandResult {
  try {
    return fn(args);
  } catch (err) {
    return {
      lines: [`error: ${(err as Error).message}`],
      exitCode: 1,
    };
  }
}

// Tiny tokenizer that respects single/double-quoted strings — no shell escapes.
function splitArgs(s: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur) {
        out.push(cur);
        cur = "";
      }
      continue;
    }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}
