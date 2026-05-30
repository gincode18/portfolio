export type Project = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  highlights: string[];
  links: {
    demo?: string;
    github?: string;
    video?: string;
  };
  award?: string;
};

export const projects: Project[] = [
  {
    id: "serenity-ai",
    name: "Serenity-AI",
    tagline: "Mental wellness companion powered by Gemini",
    description:
      "Personalized mental wellness companion built with Next.js, FastAPI, Supabase, and Google Gemini. Implements JWT authentication, REST APIs, and a responsive interface that serves personalized AI recommendations.",
    stack: ["Next.js", "FastAPI", "Supabase", "Google Gemini", "JWT"],
    highlights: [
      "2nd place out of 11,000+ registrations at the Amdocs GenAI Hackathon 2025.",
      "Personalized recommendations driven by Gemini with persistent user context.",
    ],
    links: {
      github: "https://github.com/gincode18",
    },
    award: "2nd Place / 11,000+ — Amdocs GenAI Hackathon 2025",
  },
  {
    id: "pi-home-lab",
    name: "Pi-Home-Lab",
    tagline: "Self-hosted Raspberry Pi 5 homelab with AI agents",
    description:
      "AI-powered self-hosted homelab on a Raspberry Pi 5 running 7+ Dockerized services: Jellyfin, Immich, qBittorrent, Pi-hole, Samba, and OpenClaw AI agents. Built with Docker Compose, Tailscale VPN for secure remote access, network-wide ad-blocking, NAS, and 24/7 self-hosted AI agent orchestration.",
    stack: [
      "Docker Compose",
      "Tailscale",
      "Pi-hole",
      "Jellyfin",
      "Immich",
      "OpenClaw",
    ],
    highlights: [
      "Runs 7+ Dockerized services on consumer hardware with 24/7 uptime.",
      "Hosts the OpenClaw AI agent orchestration runtime — the basis for the Pi assistant in this portfolio.",
      "Network-wide ad-blocking via Pi-hole; NAS over Samba; secure remote access via Tailscale.",
    ],
    links: {
      github: "https://github.com/gincode18",
    },
  },
  {
    id: "nexttube",
    name: "NextTube",
    tagline: "Full-stack video streaming on the T3 stack",
    description:
      "Video streaming platform using the T3 stack (Next.js, TypeScript, tRPC). Features NextAuth authentication, Prisma ORM, and Tailwind CSS, with real-time streaming for 200+ concurrent users.",
    stack: ["Next.js", "TypeScript", "tRPC", "NextAuth", "Prisma", "Tailwind"],
    highlights: [
      "Streamed video for 200+ concurrent users.",
      "End-to-end type safety with tRPC between Next.js client and server.",
    ],
    links: {
      github: "https://github.com/gincode18",
    },
  },
  {
    id: "formwave",
    name: "FormWave",
    tagline: "Advanced drag-and-drop form builder",
    description:
      "Form builder using Next.js 13 and Dnd-kit, built with TypeScript, Tailwind CSS, and React Hooks. Drag-and-drop interface with persistent submissions in a database.",
    stack: ["Next.js", "Dnd-kit", "TypeScript", "Tailwind"],
    highlights: [
      "Drag-and-drop form authoring with live preview.",
      "Per-form submission storage and admin views.",
    ],
    links: {
      github: "https://github.com/gincode18",
    },
  },
];
