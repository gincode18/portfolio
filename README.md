# Vishal OS — Portfolio at `portfolio.vishal.dpdns.org`

An interactive portfolio that boots into a **macOS-style desktop on the web** and falls back to an **iPhone home-screen** on mobile. Branded as **Vishal OS** with a custom boot animation. The killer feature is **Pi** — a Gemini-powered assistant (named after the hardware it lives on) that knows my resume, opens the right app for a recruiter's question, and runs live demos of my work.

Target persona for visitors: hiring managers and senior engineers evaluating me for **full-stack AI engineering** roles. The portfolio should communicate that profile in 30 seconds and reward 5 minutes of exploration with real engineering depth.

---

## Vision

Most "macOS portfolio" sites are visual cosplay — a draggable window with a static About page inside. This one is different in three ways:

1. **The apps are real.** The Terminal is a working command parser hitting a real API. The VS Code app reads my actual GitHub repos via the GitHub API. The Pi assistant runs RAG over my resume and project docs.
2. **It is itself a small full-stack system — 100% self-hosted on a Raspberry Pi 5.** A single Next.js + SQLite Docker container, exposed to the world via Cloudflare Tunnel. No Vercel, no managed DB, no external services beyond the Gemini API. The portfolio *is* a live demo of the engineer it advertises.
3. **Mobile is a first-class iOS experience.** Not a squished desktop — a full iPhone lockscreen → home grid → apps flow with the same content.

---

## Inspiration & Research

We studied two reference repos before scoping:

### [aabdoo23/portfolio](https://github.com/aabdoo23/portfolio) — *primary reference*

Stack: Astro 5 + React + Tailwind + Supabase + Groq.

**Patterns we are borrowing:**
- Window manager with drag/resize/minimize/Mission Control grid view.
- **Spotlight (⌘+K)** with fuzzy search + power commands.
- **AI Terminal** as the conversational entry point — but we will make ours voice-capable and tool-using (Siri persona, not raw chatbot).
- Modular config files (`src/config/projects.ts`, `experience.ts`) so content edits don't require touching components.
- Admin panel for contact-form messages with server auth.
- Keyboard shortcuts as a core UX layer (⌘+K, ⌘+W, ⌘+Tab, etc.).

**Where we improve on it:**
- Their AI is a Groq chatbot in a terminal window. **Ours is Pi** — accessible from Spotlight (⌘+Space), capable of *calling tools* (`openApp`, `searchProjects`, `runDemo`, `getContact`) to actually navigate the OS for the user. (Voice input is a v2 polish.)
- They split frontend (Astro on Vercel) from backend (Supabase). **We run one Next.js process + SQLite in a single Docker container on the Pi.** No external DB, no cloud frontend, no cross-origin glue.
- They have a desktop site. **We have a desktop site *and* a full iPhone simulation on mobile.**
- Their projects are GitHub-linked but static. **Ours run live demos inside the OS** (e.g. a chat with one of my OpenClaw agents from Pi-Home-Lab).

### [aakashsharma003/macOS-Portfolio](https://github.com/aakashsharma003/macOS-Portfolio) — *visual reference only*

Stack: React + Vite + Zustand + UnoCSS.

**What we take:** the visual chrome — window styling, dock magnification, light/dark toggle that mirrors macOS Monterey/Sonoma. The window manager is purely cosmetic in this repo (no backend, no AI), so we use it only as a styling reference, not an architecture one.

**What we leave behind:** the whole thing is static. No depth, no backend, no AI — exactly the failure mode we are avoiding.

### Key lesson from both

Both repos prove a macOS portfolio gets attention. **Neither proves it gets you hired at a senior level on its own.** The seniority signal has to come from the *contents* of the apps — system design notes, real architecture diagrams, live demos, observability. The chrome is just the frame.

---

## Tech Stack

One process, one container, one Pi.

### Application (Next.js 16.2.6, fullstack)
- **Next.js 16.2.6** App Router + **React 19** — frontend, Server Components, Route Handlers, and Server Actions all in one process.
- **Tailwind CSS v4** + **shadcn/ui** as primitives.
- **Framer Motion** for window physics (drag, resize, minimize, Mission Control).
- **Zustand** for window-manager state (lightweight, no Redux ceremony).
- **Shiki** for syntax highlighting inside the VS Code app.
- **`better-sqlite3`** as the native SQLite driver — Server Components query the DB directly with zero network hop.
- **`sqlite-vec`** extension for vector search over resume + project embeddings.
- **Web Speech API** for Pi voice input (v2 polish).

### Data
- **One SQLite file** (`/data/portfolio.db`) mounted as a Docker volume. Holds: project metadata, resume chunks, vector embeddings, contact messages.
- **WAL mode** enabled (concurrent reads + single writer).
- Backups: nightly `cp` to a separate disk, weekly rsync off-Pi.

### AI
- **Google Gemini 2.5 Flash** for Pi reasoning + tool calls (cheap, fast, plenty smart for this scope).
- **Gemini `text-embedding-004`** for RAG embeddings over resume + project docs.
- Strict-scope assistant: only answers about Vishal's work, refuses off-topic; can call a small set of tools (`openApp`, `searchProjects`, `runDemo`, `getContact`).

### Deployment
- **Single Docker image** built for `linux/arm64`, containing the full Next.js production build.
- **`docker compose up -d`** on the Pi 5 with a persistent `/data` volume.
- **Cloudflare Tunnel** routes `portfolio.vishal.dpdns.org` → the container. No inbound ports on the Pi.
- **Cloudflare Cache** in front of the tunnel with `s-maxage` + `stale-while-revalidate` so static-ish routes stay warm even if the Pi briefly blinks.
- **UptimeRobot** (free) pings the site every 5 min for failure alerting.

### Why these choices
- **Single Next.js process over Vercel + separate API**: zero monthly cost, no cross-origin glue, no managed-service quotas, and the "100% self-hosted on a Pi" story is a stronger hiring signal than "deployed to Vercel."
- **Next.js for both frontend and backend (no Hono)**: Route Handlers + Server Actions + Server Components cover every server need we have. One package, one type system, one deploy. Hono would only earn its keep if we wanted a separately-deployable API; we don't.
- **SQLite over Postgres**: portfolio-scale data fits in one file. No separate DB container, no connection pooling. `sqlite-vec` removes the need for a separate vector DB.
- **Gemini over Claude**: ~10x cheaper for this use case, fast enough for live UX, quality is more than enough for RAG over a 1-page resume + a few project docs.
- **Cloudflare Tunnel over port-forward**: no inbound ports on the Pi, free DDoS protection, edge cache "for free."

---

## What's Inside the OS

### Desktop (macOS view)

| App | What it does |
|---|---|
| **Spotlight / Pi** (⌘+Space) | RAG over resume + projects. Tool-calling to open apps and run demos. Voice input in v2. |
| **Terminal** | A whitelist command parser (not a real shell) hitting `/api/terminal`. Commands: `whoami`, `experience`, `projects`, `cat resume.md`, `ask pi "question"`, `contact`, `sudo hire-me`. Never executes arbitrary code. |
| **VS Code** | Live GitHub repos via the GH API. File tree, syntax-highlighted code, `README` rendered, "Run Demo" buttons. |
| **Finder** | `Projects/`, `Experience/`, `Achievements/` folders. Drill into Serenity-AI, NextTube, FormWave, Pi-Home-Lab — each with architecture diagram, tech stack, and "what I'd do differently". |
| **Notes** | Technical writeups: "Scaling Markopolo to 1000+ users", "OpenClaw agent orchestration on a Pi", "Why tRPC over REST for NextTube". This is the strongest senior-engineer signal in the whole site. |
| **Preview** | The actual resume PDF, downloadable. |
| **Mail / Messages** | Contact form, messages stored in SQLite on the Pi. |
| **System Preferences** | Theme (light/dark/auto), accent color, reduce motion, language, "Simple Mode" accessibility toggle. |
| **Dock** | Persistent, magnifies on hover, activity badges. |
| **Menu Bar** | Clock, GitHub/LinkedIn shortcuts, easter-egg battery icon → Pi-Home-Lab repo. |

### Mobile (iPhone view)

When viewport width is below 768px:

- **Lockscreen** with clock + a tap-to-unlock — sets the tone.
- **Home screen** with iOS-style app icons in a grid.
- Tapping an app opens it full-screen with iOS navigation patterns (swipe-back, sheet modals).
- **Pi** is reachable from a long-press of the home indicator or a button on the lockscreen.
- Content is identical to the desktop apps; only the chrome and navigation change.

---

## Architecture (high level)

```
                    Browser (portfolio.vishal.dpdns.org)
                              |
                              v
                  +-----------------------+
                  |   Cloudflare Edge     |
                  |  - DDoS protection    |
                  |  - Cache (s-maxage)   |
                  +-----------+-----------+
                              |
                  Cloudflare Tunnel (outbound from Pi)
                              |
                              v
              +-------------------------------+
              |   Raspberry Pi 5              |
              |   isolated Docker network     |
              |   +-----------------------+   |
              |   | Next.js container     |   |
              |   |  - RSC + static pages |   |
              |   |  - /api/pi (Gemini)   |   |
              |   |  - /api/terminal      |   |
              |   |  - /api/contact       |   |
              |   |  - Server Actions     |   |
              |   |        |              |   |
              |   |        v              |   |
              |   |  better-sqlite3       |   |
              |   |        |              |   |
              |   |        v              |   |
              |   |  /data/portfolio.db   |   |
              |   |  (SQLite + sqlite-vec)|   |
              |   +-----------------------+   |
              +-------------------------------+
              (no access to homelab volumes)
```

**Security & isolation:**
- Portfolio container runs on its own Docker bridge network with **no mounts** into homelab volumes (Jellyfin/Immich/etc. are unreachable from this container).
- Cloudflare Tunnel means the Pi opens **zero inbound ports** — the connection is outbound-initiated.
- **The Terminal app is a whitelist parser, not a real shell.** No `exec`, no `child_process`, no `eval`. Commands are a finite set that read from SQLite only.
- Rate limits (in-process token bucket): Pi 10 req/IP/hour, Terminal 60 req/IP/hour, Contact 5 req/IP/day.
- Gemini API key only lives in the container env; never shipped to the browser.

---

## Local Development

```bash
pnpm install
pnpm dev          # Next.js dev server at localhost:3000, SQLite at ./data/portfolio.db
```

Required env in `.env.local`:
- `GEMINI_API_KEY` — for Pi assistant + embeddings
- `ADMIN_PASSWORD` — for the contact-messages admin route
- `SQLITE_PATH` — defaults to `./data/portfolio.db` in dev, `/data/portfolio.db` in prod

> **Note on Next.js docs**: this repo uses Next.js 16.2.6 with breaking changes from older versions. Before writing any code that touches routing, caching, fetch behavior, or middleware, read the relevant guide in `node_modules/next/dist/docs/` (as instructed in `AGENTS.md`).

---

## Deployment

Everything lives in one container on the Pi.

```bash
# on the Pi
docker compose -f infra/docker-compose.prod.yml build
docker compose -f infra/docker-compose.prod.yml up -d
```

- Build target: `linux/arm64` (use `docker buildx` if building from a non-ARM dev machine).
- `/data` is a persistent volume holding `portfolio.db`.
- Cloudflare Tunnel runs as a sibling container (`cloudflared`) and points `portfolio.vishal.dpdns.org` at `portfolio:3000` on the internal Docker network.
- Nightly cron on the Pi host: `cp /data/portfolio.db /backups/portfolio-$(date +%F).db`, plus a weekly rsync to a separate disk.
- UptimeRobot monitors `https://portfolio.vishal.dpdns.org/healthz` every 5 min.

---

## Status

See [`plan.md`](./plan.md) for the milestone-by-milestone build plan and current progress.
