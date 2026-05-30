# Data Flow — Vishal OS

How content gets into the RAG index, how Pi queries it, and how new
content (notes, projects, skills, experience) is added.

---

## 1. The 30-second mental model

```
   content/*.ts            scripts/ingest.ts            data/portfolio.db
  (source of truth)   ──>  (Gemini embeddings)   ──>   (rag_chunks + rag_embeddings)
                                                                │
                                                                v
   browser  ⌘Space  ──>  /api/pi  ──>  retrieve()  ──>  Gemini Flash  ──>  ndjson stream
                                                                                 │
                                                                                 v
                                                                  text + tool events
                                                                                 │
                                                                                 v
                                                              applyToolCall → window store
```

Three things matter:

1. **The TypeScript files under `content/` are the source of truth.** Nothing else.
2. **`pnpm ingest` is the only step that touches the RAG index.** It is idempotent
   — it wipes the index and re-embeds everything.
3. **Pi is read-only.** It can answer questions and open windows, but it never
   writes to the index or the DB.

---

## 2. Content sources

All five files live in [`content/`](./content/) and are type-checked. Editing
them is just editing TS.

| File | Holds | Used by RAG? | Used by UI? |
|---|---|---|---|
| [`content/profile.ts`](./content/profile.ts) | name, role, contact, one-paragraph bio | yes | About app, menu bar links |
| [`content/experience.ts`](./content/experience.ts) | array of roles (PwC, Markopolo, intern) | yes | Experience app |
| [`content/projects.ts`](./content/projects.ts) | array of projects (Serenity-AI, NextTube, etc.) | yes | Projects app |
| [`content/skills.ts`](./content/skills.ts) | language/frontend/backend/data/cloud/ai/education/achievements | yes | About app |
| [`content/notes.ts`](./content/notes.ts) | long-form writeups (markdown body) | yes | Notes app |

Everything here is **also** what Pi sees. There is no separate "AI knowledge
base" — the same TS file powers the UI and the RAG index.

---

## 3. The ingestion pipeline (`pnpm ingest`)

You run this **whenever you edit a file under `content/`**. It takes a few
seconds and costs effectively nothing (Gemini embedding free tier covers it).

```
$ pnpm ingest
collected 26 chunks
clearing existing index…
embedding…
writing…
done — 26 chunks indexed
```

### What the script does, step by step

[`scripts/ingest.ts`](./scripts/ingest.ts) is ~50 lines. Here is the actual flow:

```
                  ┌──────────────────────────────┐
                  │  scripts/ingest.ts           │
                  └──────────────┬───────────────┘
                                 │
                                 v
                  ┌──────────────────────────────┐
                  │  collectChunks()             │  ← lib/pi/sources.ts
                  │                              │
                  │  reads:                      │
                  │   content/profile.ts         │
                  │   content/experience.ts      │
                  │   content/projects.ts        │
                  │   content/skills.ts          │
                  │   content/notes.ts           │
                  │                              │
                  │  returns SourceChunk[] with: │
                  │   - source ("project:nexttube")
                  │   - text   (formatted blob)  │
                  │   - metadata { kind, id,     │
                  │                title, route }│
                  └──────────────┬───────────────┘
                                 │  one chunk per item, notes split at ~800 chars
                                 v
                  ┌──────────────────────────────┐
                  │  embedBatch(chunks)          │  ← lib/pi/embed.ts
                  │                              │
                  │  for each chunk:             │
                  │    Gemini gemini-embedding-001 │
                  │      → Float32Array(768)     │
                  └──────────────┬───────────────┘
                                 │
                                 v
                  ┌──────────────────────────────┐
                  │  SQLite transaction          │  ← data/portfolio.db
                  │                              │
                  │  DELETE FROM rag_embeddings  │
                  │  DELETE FROM rag_chunks      │
                  │  for each chunk:             │
                  │    INSERT INTO rag_chunks    │
                  │      (source, text,          │
                  │       metadata JSON)         │
                  │    INSERT INTO rag_embeddings│
                  │      (chunk_id, embedding)   │
                  └──────────────────────────────┘
```

### Why per-item chunking and not arbitrary splitting?

Each project, role, or skill category becomes **one chunk**. Notes are the
only thing split (~800 chars, paragraph-aware). Two reasons:

1. **Tool routing.** Each chunk carries a `route` metadata hint like
   `{ type: "openApp", appId: "projects", selectId: "serenity-ai" }`. If Pi
   retrieves a chunk about Serenity-AI, the model can read that hint and call
   `openApp("projects", "serenity-ai")` to land the user there.
2. **Retrieval quality at this scale.** With ~25–60 chunks total, semantic
   coherence matters more than size. One chunk per project is the right grain.

### What ends up in SQLite

After ingestion, `data/portfolio.db` contains:

```sql
-- one row per chunk
rag_chunks (
  id          INTEGER PRIMARY KEY,
  source      TEXT     -- e.g. "project:serenity-ai", "note:markopolo-scaling#0"
  chunk_index INTEGER,
  text        TEXT,    -- the actual content Pi sees
  metadata    TEXT,    -- JSON: { kind, id, title, route }
  created_at  INTEGER
)

-- matching vector for each row (sqlite-vec virtual table)
rag_embeddings (
  chunk_id  INTEGER PRIMARY KEY,
  embedding FLOAT[768]
)
```

The `metadata` JSON is what makes Pi navigable — that's the bridge between
"this chunk was retrieved" and "open this window for the user."

---

## 4. The query pipeline (when Pi answers a question)

This runs on **every** Pi message. Cost: ~1 embed call + 1 Gemini Flash call.

```
   browser
     │  POST /api/pi  { messages: [{ role:"user", content:"show me serenity-ai" }] }
     v
   ┌──────────────────────────────────────────┐
   │  app/api/pi/route.ts                     │
   │                                          │
   │   1. rate-limit check  (10/IP/hour)      │
   │   2. validate JSON + length              │
   │   3. retrieve(query, k=6)                │  ← lib/pi/retrieve.ts
   │       ├─ embedOne(query)  → 768d vec     │
   │       └─ sqlite-vec MATCH                │
   │              SELECT ...                  │
   │              FROM rag_embeddings e       │
   │              JOIN rag_chunks c           │
   │              WHERE e.embedding MATCH ?   │
   │                AND k = 6                 │
   │              ORDER BY e.distance         │
   │          → ChunkHit[] (top-6 by cosine)  │
   │                                          │
   │   4. buildSystemPrompt(hits)             │  ← lib/pi/system-prompt.ts
   │       personality rules + tool guide     │
   │       + RELEVANT CONTEXT section         │
   │       + per-chunk route hints            │
   │                                          │
   │   5. Gemini Flash generateContentStream  │
   │       contents = chat history            │
   │       config   = { systemInstruction,    │
   │                    tools: [openApp,      │
   │                            openExternalLink] }
   └────────────────────┬─────────────────────┘
                        │  for each chunk in stream:
                        │    if chunk.text      → emit { type:"text",  text:"..." }
                        │    if functionCalls[] → emit { type:"tool",  name, args }
                        │                          (validated against allowlist)
                        │  end of stream         → emit { type:"done" }
                        v
   ┌──────────────────────────────────────────┐
   │  newline-delimited JSON over             │
   │  Content-Type: application/x-ndjson      │
   │  (one event per line, easy to parse)     │
   └────────────────────┬─────────────────────┘
                        │
                        v  fetch ReadableStream
   ┌──────────────────────────────────────────┐
   │  pi-overlay.tsx                          │
   │                                          │
   │  for await (ev of parsePiStream(body)):  │
   │    text  → appendAssistant(id, chunk)    │
   │    tool  → applyToolCall(name, args)     │  ← lib/pi/dispatch.ts
   │             ├─ re-validate against APPS  │
   │             └─ useWindows.openApp(...)   │
   │                attachTool(id, label)     │
   │    error → fail(message)                 │
   │    done  → finishAssistant()             │
   └──────────────────────────────────────────┘
```

### Two security checkpoints

The server validates every tool call against an allowlist in
[`lib/pi/tools.ts`](./lib/pi/tools.ts). The client validates **again** against
the live `APPS` registry in [`lib/pi/dispatch.ts`](./lib/pi/dispatch.ts).
Belt and suspenders — a malicious or stale server still cannot make the
client open an unknown app or visit a non-HTTPS URL.

### Streaming format (ndjson)

Each line of the response is a JSON event:

```jsonl
{"type":"text","text":"At Markopolo AI, Vishal architected over 15 full-stack features..."}
{"type":"text","text":" and built a custom Shopify app..."}
{"type":"tool","name":"openApp","args":{"appId":"projects","selectId":"serenity-ai"}}
{"type":"done"}
```

Why ndjson and not SSE: simpler client (just split on `\n`), no event-stream
overhead, works fine over fetch ReadableStream. The shape is defined in
[`lib/pi/stream.ts`](./lib/pi/stream.ts).

---

## 5. How to add new content

### A new note

1. Open [`content/notes.ts`](./content/notes.ts).
2. Add a new entry to the `notes` array:

   ```ts
   {
     id: "deploying-to-pi",           // unique kebab-case
     title: "Deploying Next.js to a Pi 5",
     summary: "Multi-stage Docker build for ARM64, Cloudflare Tunnel, and what broke.",
     tags: ["pi", "docker", "deploy"],
     publishedAt: "2026-06",
     body: `# Deploying Next.js to a Pi 5
   
   When I moved this portfolio to the Pi...
   
   ## Step 1
   - bullet
   - another bullet
   `
   }
   ```
3. Run `pnpm ingest`.
4. (Optional) `pnpm dev` to see it in the Notes app immediately.

That's it. Pi will start retrieving it on relevant questions and can open it
via `openApp({ appId: "notes", selectId: "deploying-to-pi" })`.

### A new project

1. Open [`content/projects.ts`](./content/projects.ts).
2. Add to the `projects` array. Use a kebab-case `id`. Fill in `tagline`,
   `description`, `stack`, `highlights`, `links`, and `award` if any.
3. Run `pnpm ingest`.
4. The Projects app picks it up; Pi can open with
   `openApp({ appId: "projects", selectId: "your-id" })`.

### A new role/experience entry

1. Open [`content/experience.ts`](./content/experience.ts).
2. Add to the `experience` array. Use kebab-case `id`. Lists are
   `highlights` (bullets) and `stack` (chip-style tags).
3. Run `pnpm ingest`.
4. Experience app shows it in the timeline; Pi can scroll-to + highlight via
   `openApp({ appId: "experience", selectId: "your-id" })`.

### Skills, education, achievements

1. Open [`content/skills.ts`](./content/skills.ts).
2. Edit the relevant array (e.g. add `"Rust"` to `skills.languages`, or push
   a new `achievement`).
3. Run `pnpm ingest`.

Each category becomes one chunk (so adding one language doesn't bloat the
index by much — `Skills — languages` is one chunk regardless of length).

### Profile / bio

1. Open [`content/profile.ts`](./content/profile.ts).
2. Edit `title`, `bio`, `location`, `email`, `links`.
3. Run `pnpm ingest` so Pi sees the new bio.

### After every content edit

```bash
pnpm ingest   # required for Pi to see the change
pnpm dev      # to see the UI
```

If you forget to ingest, the **UI is still correct** (it reads the TS file
directly) but **Pi will answer from stale embeddings**.

---

## 6. Where things live (file map)

```
content/
  profile.ts        ← bio, contact, links
  experience.ts     ← work timeline
  projects.ts       ← project cards
  skills.ts         ← languages, frontend, backend, data, cloud, ai, education, achievements
  notes.ts          ← long-form writeups

lib/
  db/
    sqlite.ts       ← better-sqlite3 + sqlite-vec, migrations, getDb()
    index.ts        ← server-only re-export
  pi/
    embed.ts        ← Gemini gemini-embedding-001 (768d)
    retrieve.ts     ← vector search + formatContext
    sources.ts      ← collectChunks() — content/* → SourceChunk[]
    system-prompt.ts ← personality + tool guide + RELEVANT CONTEXT injection
    tools.ts        ← Gemini FunctionDeclaration + server-side validation
    dispatch.ts     ← client-side tool execution (re-validated)
    stream.ts       ← ndjson event types + parser
  store/
    windows.ts      ← Zustand: open/close/focus, selectId, useAppSelection()
    pi.ts           ← Zustand: messages, streaming, attachTool
    spotlight.ts    ← Zustand: open/hide
  rate-limit.ts     ← in-process token bucket
  apps/
    registry.tsx    ← AppId, APPS map, DOCK_ORDER

app/
  api/
    pi/route.ts        ← RAG retrieve + Gemini stream + tool events
    terminal/route.ts  ← whitelist command parser
  healthz/route.ts     ← DB liveness probe
  layout.tsx           ← ThemeProvider, metadata
  page.tsx             ← <ShellSwitcher>

components/
  os/
    desktop-shell.tsx
    mobile-shell.tsx
    window.tsx
    boot-animation.tsx
    clock.tsx
    spotlight.tsx
    pi/
      pi-orb.tsx
      pi-overlay.tsx
    apps/
      about.tsx
      projects.tsx       ← honors useAppSelection("projects")
      experience.tsx     ← honors useAppSelection("experience"), scroll-to + ring
      notes.tsx          ← honors useAppSelection("notes")
      terminal.tsx
      preview.tsx
      system-preferences.tsx

scripts/
  ingest.ts         ← `pnpm ingest`
  db-smoke.ts       ← `pnpm db:smoke`

data/
  portfolio.db      ← SQLite (gitignored)
```

---

## 7. Extending the system

### Add a new content category (e.g. "blog posts" or "talks")

1. Create `content/blog.ts` with a typed array of `BlogPost`.
2. Open [`lib/pi/sources.ts`](./lib/pi/sources.ts) and add a block to
   `collectChunks()` that emits one chunk per post. Set
   `metadata.kind` to `"blog"` (and update the `ChunkMetadata.kind` union in
   [`lib/pi/retrieve.ts`](./lib/pi/retrieve.ts)).
3. Decide on a UI:
   - **Cheap:** reuse the Notes app for blogs too.
   - **Full:** add a Blog app, register in `lib/apps/registry.tsx`, add it
     to `DOCK_ORDER`, add `"blog"` to the `openApp` enum in
     [`lib/pi/tools.ts`](./lib/pi/tools.ts).
4. Add `route: { type: "openApp", appId: "blog", selectId: post.id }` to
   each chunk's metadata.
5. Run `pnpm ingest`.

Pi can now answer about blog posts and open them via tool calls.

### Ingest your GitHub repos

Not yet implemented, but the seam exists. To add it:

1. Create `content/repos.ts` with a curated list (recommended — *you* pick the
   signal repos, not the GitHub API).
2. Extend `collectChunks()` to emit one chunk per repo with metadata
   `{ kind: "project", id: repo.id, route: { type: "openExternalLink", url: repo.url } }`.

Then Pi can answer "show me your work on X" by calling `openExternalLink` to
the GitHub repo.

---

## 8. Common gotchas

- **"Pi says it doesn't know about my new note."** You forgot `pnpm ingest`.
- **"`pnpm ingest` fails with 404 on the embed model."** Your `GEMINI_API_KEY`
  doesn't have access to `gemini-embedding-001`. Check the available models:
  `curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"`.
- **"Pi opens the wrong window."** Check the `route` hint in the matching
  chunk's metadata in `lib/pi/sources.ts`. The model takes the hint seriously.
- **"Pi answers from old content even after ingest."** Make sure the DB file
  isn't stale (`data/portfolio.db`). `rm -f data/portfolio.db* && pnpm ingest`
  rebuilds from scratch.
- **"Dev mode says 'set GEMINI_API_KEY'."** It's missing in `.env.local`, or
  the dev server was started before you added it (restart `pnpm dev`).
