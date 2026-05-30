# Build Plan — Portfolio

Living document. Update as decisions change. See [`README.md`](./README.md) for vision and inspiration.

---

## 1. Goal

Ship a portfolio at `portfolio.vishal.dpdns.org` that:

1. Signals **senior full-stack AI engineer** in under 30 seconds.
2. Rewards 5 minutes of exploration with real engineering depth (architecture notes, live demos, working AI assistant).
3. Doubles as a live demo of self-hosted infra — **one Next.js + SQLite Docker container on a Raspberry Pi 5**, exposed via Cloudflare Tunnel. No Vercel, no managed DB, no external services beyond Gemini.
4. Works equally well on desktop (macOS) and mobile (iPhone), branded as **Vishal OS** with a custom boot animation. The assistant is named **Pi**.

**Non-goal:** matching every macOS visual detail. We borrow the metaphor, not the spec.

---

## 2. Success Criteria

- LCP < 2s on a cold load on a mid-tier phone (served from the Pi, behind Cloudflare cache).
- Pi answers a recruiter question and opens the right app in < 3s end-to-end.
- Mobile users see the iPhone UI, not a squished desktop.
- Lighthouse > 90 on Performance, Accessibility, SEO.
- Total monthly cost < $5 (Gemini usage only; Pi + Cloudflare Tunnel are free).
- Resume PDF, LinkedIn, GitHub reachable in <= 2 clicks from any state.

---

## 3. Constraints

- **One container, one process.** Single Next.js app on the Pi serves everything: pages, APIs, RAG, contact form. No separate Hono/Express backend.
- **No Vercel.** Self-hosting is part of the brand and the engineering signal.
- **No exposing homelab metrics or services.** Portfolio Docker stack is isolated on its own network with no mounts into homelab volumes.
- **No external paid DB or vector store.** SQLite + `sqlite-vec` only.
- **Gemini API only** for AI. No Claude / OpenAI fallback in v1 — keeps costs and complexity low.
- **The Terminal is a whitelist parser, never a real shell.** No `child_process`, no `exec`, no `eval` on user input.
- **Next.js 16.2.6 has breaking changes.** Always read `node_modules/next/dist/docs/` before writing code that touches routing, caching, fetch, or middleware (per `AGENTS.md`).
- Public Pi exposure only via **Cloudflare Tunnel** — no inbound ports.

---

## 4. Architecture

One Next.js app serves the entire portfolio — pages, APIs, and server actions, all in the same Node process inside one Docker container on the Pi.

### Application layout (`/app`, `/components`, `/lib`)

- **Next.js 16.2.6 App Router** with React Server Components.
- **Server Components** read directly from SQLite via `better-sqlite3` (no HTTP hop for first-render data like projects list, experience timeline).
- **Route Handlers** (`app/api/.../route.ts`) for dynamic, client-initiated endpoints:
  - `POST /api/pi` — Gemini chat + tool calls, streamed via SSE.
  - `POST /api/terminal` — whitelist command parser, reads SQLite.
  - `POST /api/contact` (or Server Action) — store contact message.
  - `GET /api/admin/messages` — list messages (basic auth).
  - `GET /healthz` — liveness probe.
- **Server Actions** for the contact form (idiomatic Next 16 form handling).
- **Tailwind v4 + shadcn/ui** already wired.
- **Zustand** for window-manager state (positions, z-index, focus, minimized).
- **Framer Motion** for drag/resize/animation.
- Single `useViewport()` hook decides desktop (macOS) vs mobile (iPhone) shell at the root layout.
- Static project/experience/note content lives in `content/` as MDX or TS files — no CMS in v1.
- Rate limiting via an in-process token bucket keyed by IP (no Redis needed).

### Data layer (`/lib/db`)

- SQLite at `/data/portfolio.db` (Docker volume mount in prod, `./data/portfolio.db` in dev).
- `better-sqlite3` driver — synchronous, native, very fast for the read-heavy access pattern.
- `sqlite-vec` extension loaded at app startup for vector search.
- WAL mode enabled; nightly backup cron on the Pi host.

### Data flow for Pi (the assistant)

1. User asks: "What did Vishal build at Markopolo?"
2. Frontend POSTs to `/api/pi` (same origin — no CORS) with the query + chat history.
3. Route Handler embeds query with Gemini `text-embedding-004`.
4. `sqlite-vec` returns top-K relevant chunks from resume + project docs.
5. Gemini Flash receives: system prompt + retrieved chunks + tools schema + query.
6. Model either answers directly OR returns a tool call (`openApp('finder', { path: 'Projects/Markopolo' })`).
7. Route Handler streams response (SSE) back; frontend renders text and executes tool calls against the window manager (Zustand store).

### Terminal command parser (security-critical)

- A finite, hard-coded command table in `lib/terminal/commands.ts`.
- Each command is a TypeScript function that takes parsed args and returns a string (or stream of strings).
- **Allowed:** `whoami`, `experience`, `projects [--filter=tag]`, `cat resume.md`, `ask pi "..."`, `contact`, `sudo hire-me`, `help`, `clear`.
- **Forbidden:** anything not in the table returns `command not found`. Never invokes a real shell. Never reads from disk outside the SQLite DB and the bundled resume PDF.

---

## 5. Stack Decisions (with rationale)

| Decision | Choice | Why |
|---|---|---|
| Framework (full-stack) | Next.js 16.2.6 | Route Handlers + Server Actions + RSC mean no separate backend needed. |
| UI primitives | shadcn/ui + Tailwind v4 | Already installed, fully customizable. |
| Window state | Zustand | Lighter than Redux, scales to ~20 windows fine. |
| Animation | Framer Motion | Best-in-class for drag/spring physics. |
| Server runtime | Node.js 22 LTS in Docker | Stable, fast enough on Pi 5, native `better-sqlite3` works on `linux/arm64`. |
| Backend framework | **None — Next.js Route Handlers + Server Actions** | One process, shared types, no CORS, no extra deploy unit. |
| DB driver | `better-sqlite3` | Synchronous, native, the fastest SQLite option in Node for read-heavy workloads. |
| DB | SQLite + sqlite-vec | One file, no server, vector + relational in one place. |
| AI | Gemini 2.5 Flash | Cheap, fast, plenty for RAG over <100 docs. |
| Embeddings | Gemini `text-embedding-004` | Free tier covers us; same vendor as the LLM. |
| Public exposure | Cloudflare Tunnel | No inbound ports on Pi, free, DDoS protection, built-in cache. |
| Host | Raspberry Pi 5 (self-hosted) | $0/mo, full control, "100% on my Pi" is a stronger hiring signal than Vercel. |
| Voice input | Web Speech API | Free, built into browsers, no server cost. (v2.) |

---

## 6. Information Architecture

### Desktop apps (v1 = must-have, v2 = nice-to-have)

| App | Version | Notes |
|---|---|---|
| Spotlight / Pi | v1 | The hero. Text in v1, voice in v2. |
| Terminal | v1 | Whitelist parser, commands listed in `lib/terminal/commands.ts`. |
| Finder (Projects, Experience) | v1 | Drill-down into project detail pages. |
| Preview (Resume PDF) | v1 | PDF.js embed, downloadable. |
| Dock + Menu Bar | v1 | Persistent UI chrome. |
| Boot animation ("Vishal OS") | v1 | Custom-branded, skippable, cached after first visit. |
| VS Code | v2 | GitHub API integration, Shiki highlighting. |
| Notes | v2 | MDX writeups (Markopolo scaling, OpenClaw on Pi, Serenity-AI architecture). |
| Mail / Messages (contact) | v2 | Server Action → SQLite → admin route. |
| System Preferences | v2 | Theme, accent, reduce-motion, simple mode. |
| Pi voice input | v2 | Web Speech API. |
| Mission Control | v3 | Pinch / F3 to see all windows. |
| Launchpad | v3 | Full-screen app grid. |

### Mobile apps (v1)

- Lockscreen with clock + slide-to-unlock.
- Home grid with app icons matching desktop list.
- Each app opens full-screen with iOS nav patterns.
- Pi from home indicator long-press.

---

## 7. Milestones

### M0 — Foundation (1–2 days)
- [ ] Read `node_modules/next/dist/docs/` to understand Next 16 routing, caching, Server Components, Server Actions.
- [ ] Set up `lib/db/index.ts` with `better-sqlite3` + `sqlite-vec` extension load. Smoke test.
- [ ] Set up `content/` directory with placeholder data (experience, projects, notes).
- [ ] Set up `useViewport()` hook + root layout that swaps between `DesktopShell` and `MobileShell`.
- [ ] Set up `infra/Dockerfile` (ARM64) + `infra/docker-compose.dev.yml` for local development parity.

### M1 — Desktop chrome (3–5 days)
- [ ] Menu bar (top), Dock (bottom), Desktop background.
- [ ] Window manager (Zustand store): open, close, focus, minimize, drag, resize.
- [ ] **Vishal OS boot animation** (skippable, cached after first visit). Custom branding, not Apple-style.
- [ ] Light/dark theme via System Preferences app stub.
- [ ] Keyboard shortcuts: ⌘+W, ⌘+M, ⌘+Tab.

### M2 — Core apps v1 (5–7 days)
- [ ] Finder app with Projects + Experience folders, project detail view (Server Components reading SQLite directly).
- [ ] Preview app rendering `Vishal_Resume_26.pdf`.
- [ ] Terminal app — whitelist command parser, `POST /api/terminal` Route Handler.
- [ ] Spotlight (⌘+K) — fuzzy search over apps + content (no AI yet).

### M3 — Pi assistant (4–6 days)
- [ ] `POST /api/pi` Route Handler with Gemini Flash + tool schema.
- [ ] Embedding ingestion script: chunks resume + project MDX → SQLite vec table.
- [ ] Frontend Pi UI in Spotlight (text first; voice deferred to v2).
- [ ] Tool calls: `openApp`, `closeApp`, `searchProjects`, `getContact`.
- [ ] Streaming responses (SSE via `ReadableStream` in the Route Handler).
- [ ] Rate limiting (10 queries/IP/hour, in-process token bucket).

### M4 — Mobile iPhone shell (3–5 days)
- [ ] Viewport-based shell swap at the root layout.
- [ ] Lockscreen, home grid, app open/close transitions.
- [ ] iOS-style status bar, home indicator.
- [ ] Pi sheet on long-press of home indicator.
- [ ] Pass through all v1 content to mobile apps.

### M5 — Deployment to Pi (2 days)
- [ ] Production Dockerfile: multi-stage build, `linux/arm64`, includes `better-sqlite3` native binary for ARM.
- [ ] `infra/docker-compose.prod.yml` on Pi with the app + `cloudflared` sibling container.
- [ ] Cloudflare Tunnel config → `portfolio.vishal.dpdns.org` → `portfolio:3000`.
- [ ] Cloudflare Cache rules: `s-maxage` + `stale-while-revalidate` on static-ish routes.
- [ ] Nightly SQLite backup cron on Pi host.
- [ ] UptimeRobot monitor on `/healthz`.
- [ ] Smoke test: real recruiter flow on phone + desktop.

### M6 — v2 apps (post-launch, prioritize by feedback)
- [ ] VS Code app with GitHub API.
- [ ] Notes app with MDX writeups (target: 3 strong pieces — Markopolo scaling, OpenClaw on Pi, Serenity-AI architecture).
- [ ] Mail/Messages contact form + admin panel.
- [ ] System Preferences full functionality.

### M7 — Polish (ongoing)
- [ ] Mission Control.
- [ ] Launchpad.
- [ ] Easter eggs (battery icon → Pi-Home-Lab, etc.).
- [ ] Performance pass: image optimization, code splitting, font subsetting.
- [ ] Accessibility pass: simple-mode flat layout, ARIA, keyboard-only navigation tested end-to-end.

---

## 8. Build Order (concrete next steps)

In order, smallest to largest:

1. Read `node_modules/next/dist/docs/` (App Router routing, RSC, Route Handlers, Server Actions, caching/`revalidate`).
2. Wire up `better-sqlite3` + `sqlite-vec` in `lib/db/index.ts`. Smoke test with a trivial table + vector search.
3. Sketch the Zustand window store: types for `Window`, actions for open/close/focus/move.
4. Scaffold the desktop layout: `app/page.tsx` + `components/desktop/{MenuBar,Dock,Desktop,Window}.tsx`.
5. Build one app end-to-end (Finder → Projects → Project detail) — Server Components read projects from SQLite directly. This validates the window manager + data layer in one slice.
6. Add `app/api/terminal/route.ts` with the whitelist command parser. Wire the Terminal app to it.
7. Add the Spotlight fuzzy-search shell (no AI yet — just searches across apps and content).
8. Layer Pi (RAG + Gemini, `app/api/pi/route.ts`) on top of Spotlight. Streamed via SSE.
9. Build the Vishal OS boot animation.
10. Build the iPhone shell, then port apps.
11. Production Dockerfile (ARM64 multi-stage). Deploy to Pi via Cloudflare Tunnel.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Scope creep — macOS portfolios eat months | Hard scope cut: v1 ships with 5 apps, not 12. Anything not in M0–M5 is post-launch. |
| Pi goes down mid-interview (single point of failure now) | Cloudflare Cache with `stale-while-revalidate` keeps static routes alive briefly. UptimeRobot alerts within 5 min. Pi 5 + UPS HAT handles power blips (most common outage cause). |
| Gemini quota exhausted / abuse | Rate limit per IP. Cache embeddings (only re-embed on content change). Free tier covers expected traffic. |
| Mobile MacOS UI is unusable | Don't try to port macOS to mobile — build the iPhone shell instead. Full swap at <768px. |
| Recruiter doesn't "get" how to navigate | Vishal OS boot animation ends with a 3-second hint ("Press ⌘+Space to ask Pi anything"). Spotlight is the discoverable entry point. |
| Next.js 16 breaking changes bite us | Always check the bundled docs before adding routes, middleware, caching, or fetch patterns. |
| SQLite write contention | Portfolio is read-heavy (RAG + projects). Contact-form writes are negligible. WAL mode enabled. |
| `sqlite-vec` or `better-sqlite3` fails on ARM in Docker | Pin `node:22-bookworm` base image (known to ship the right glibc + build tools). Smoke test extension load in M0 before relying on it. |
| Terminal abused as RCE vector | **Hard constraint:** parser-only, no `child_process`/`exec`/`eval` anywhere in the codebase. Add a lint rule that bans these symbols in `app/api/terminal/**`. |

---

## 10. Open Questions

- **Voice for Pi responses** — TTS via Web Speech `SpeechSynthesis` (free, robotic) or paid TTS API (Gemini's audio out is cheap, much better quality). Deferred to v2.
- **Analytics** — Plausible (cheap, hosted) or self-hosted Umami on the Pi (free, but adds another container). Lean toward self-hosted Umami in a sibling container to keep with the "100% on the Pi" theme.
- **Dark vs light default** — auto (system preference) for v1. Recruiters often use light mode on managed laptops.
- **Should the homelab be mentioned in About?** Yes, as a *project* with the GitHub link. No live metrics, no exposed services.
- **Analytics** — deferred. Will revisit before M5 deployment.

### Resolved decisions
- ✅ Assistant name: **Pi** (lives on a Pi, single syllable, no trademark risk).
- ✅ Boot animation: custom **Vishal OS** branding (not Apple-style).
- ✅ Architecture: single Next.js + SQLite Docker container on Pi. No Vercel. No Hono. No separate API tier.
- ✅ Stack: Next.js Route Handlers + Server Actions + `better-sqlite3` + `sqlite-vec` + Gemini 2.5 Flash.

---

## 11. Out of Scope (explicitly)

- 3D / Three.js effects.
- Multi-user accounts.
- A blog CMS — MDX in repo is enough.
- Comments / social features.
- Internationalization beyond English.
- Anything that requires a paid third-party service in v1.

---

_Last updated: 2026-05-30._
