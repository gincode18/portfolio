export type Note = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  publishedAt: string;
  body: string;
};

// Starter writeups — replace these and add more. Each note is independently
// ingested into the RAG index, so Pi can answer questions about any of them
// and open this app at the right note via tool calls.
export const notes: Note[] = [
  {
    id: "markopolo-scaling",
    title: "Scaling Markopolo to 1000+ daily users",
    summary:
      "What changed in the architecture as we crossed 1k DAU at Markopolo — webhook fan-out, idempotency, and the shape of a multi-tenant ETL.",
    tags: ["backend", "node", "postgres", "scale"],
    publishedAt: "2026-04",
    body: `# Scaling Markopolo to 1000+ daily users

When I joined Markopolo as a full-stack dev, the platform served a few dozen merchant stores.
By the time I left it was serving 500+ stores and 1000+ daily users on the dashboard, with
real-time event capture from Shopify and HubSpot integrations.

This is what changed.

## The shape of the problem

A Shopify merchant generates events constantly — add-to-cart, checkout, purchase. Each event
is small, but the fan-out is large: every event has to be:

1. Captured at the merchant's site via the Shopify Web Pixel API
2. Normalized into our internal event shape
3. Persisted (PostgreSQL for relational, MongoDB for raw audit)
4. Forwarded to downstream destinations (HubSpot, ad pixels, analytics)

At low volume you can do all four in one synchronous request. At a few hundred
stores, you can't.

## What broke first

Webhooks. Our HubSpot integration was a synchronous \`fetch\` inside the request handler.
A slow HubSpot response = a slow event capture = a backed-up Node event loop = dropped
pixels at the storefront. The first thing we did was push every outbound integration
behind a queue (BullMQ on Redis) with retry + dead-letter.

## Idempotency

Once you have retries, you need idempotency. Every event got a deterministic
\`event_id\` derived from \`(store_id, shopify_event_id)\`. The PostgreSQL ingest used
\`ON CONFLICT DO NOTHING\` on \`(event_id)\`. Downstream integrations stored their
own \`processed_event_id\` table. Replaying a queue could no longer double-fire.

## Multi-tenancy

50+ enterprise clients meant we couldn't rely on a single schema. We landed on
shared-schema multi-tenancy with row-level \`tenant_id\` on every table and a
Postgres RLS policy. Every request carried a JWT with the tenant; the connection
set \`SET LOCAL app.tenant\` and RLS filtered the queries. Mistakes can't leak
across tenants by accident.

## What I'd do differently

Two things. (1) I'd start with a typed event schema and a versioned dispatcher
on day one, instead of growing a switch statement that eventually got long.
(2) I'd push more aggressively for observability earlier — we did fine with logs
+ Sentry, but a real trace would have caught the HubSpot tail-latency a week
sooner.`,
  },
  {
    id: "pi-homelab-agents",
    title: "OpenClaw agent orchestration on a Raspberry Pi 5",
    summary:
      "How I run a small fleet of AI agents 24/7 on a Pi 5 alongside Jellyfin, Immich, and Pi-hole — isolation, restart policies, and what the Pi actually handles before falling over.",
    tags: ["pi", "docker", "ai", "self-hosting"],
    publishedAt: "2026-05",
    body: `# OpenClaw agent orchestration on a Raspberry Pi 5

The Raspberry Pi 5 (8GB) running my homelab also runs a small fleet of AI agents
under a framework I call OpenClaw. This post is the honest version of what works,
what doesn't, and what I'd hand to a recruiter as evidence that I can actually
operate a system.

## What's on the box

- Jellyfin (~3GB RAM peak, transcoding offloaded to client)
- Immich (~1.5GB RAM, mainly idle, spikes on uploads)
- qBittorrent (light)
- Pi-hole (negligible)
- Samba (negligible)
- OpenClaw agent runtime (varies: 200MB idle, 700MB during a run)

That leaves enough headroom that Jellyfin streaming + an agent task can
coexist. What does NOT work: running a local 7B model on the Pi for the
agents' reasoning. I tried llama.cpp with quantization and it's painful.
The agents reason via Gemini Flash over the network instead.

## The portfolio uses this

The Pi assistant you're talking to right now runs on the same Pi 5. The
portfolio Docker stack lives on its own isolated bridge network so the
public-facing container has no path into Jellyfin, Immich, or any homelab
volume. Cloudflare Tunnel means the Pi opens zero inbound ports.

## Restart policy

Every container has \`restart: unless-stopped\`. Power blips happen — a small
UPS HAT solved 90% of them. The remaining 10% are kernel updates, which I
schedule manually. Uptime over the last 90 days has been somewhere north of
99% based on UptimeRobot.

## What I'd do differently

Storage. I started with a single SSD and have already filled it once. Next
build will start with a 2TB NVMe and an external HDD for cold backup, not
the other way around.`,
  },
  {
    id: "nexttube-trpc",
    title: "Why tRPC over REST for NextTube",
    summary:
      "On a 1-person side project, tRPC's type-safety wasn't the win — the win was that I stopped writing API client code at all.",
    tags: ["typescript", "trpc", "nextjs"],
    publishedAt: "2025-12",
    body: `# Why tRPC over REST for NextTube

NextTube is a small T3-stack video streaming app I built (Next.js + tRPC +
Prisma + NextAuth + Tailwind). I get asked sometimes "why tRPC, not just REST
+ Zod?" — fair question. Here's the honest answer.

## The marketed benefit isn't the real benefit

The tRPC pitch is "end-to-end type safety." That's true. It's also what every
client codegen tool (OpenAPI + openapi-typescript, GraphQL + codegen) gives
you. So that's not the differentiator.

## The real benefit on a solo project

I stopped writing API client code. Not just types — I never wrote a single
\`fetch\` call by hand. The router IS the client. Adding an endpoint is:

1. Add a procedure to the router.
2. Call \`trpc.thing.useQuery()\` from the component.

No fetcher, no error-handling wrapper, no \`useEffect\` lifecycle, no manual
cache invalidation logic. On a 1-person project where the cost of writing
"boring" code dominates, that compression matters.

## Where it stops being the right call

The moment you have a second client that isn't TypeScript (mobile, third-party,
a public API), tRPC's tight coupling becomes a liability. NextTube has one
client, written in TypeScript, by me. So it works. At Markopolo I would have
picked REST + OpenAPI, no question.

## What I'd do differently

Use Next.js Server Actions for mutations. tRPC mutations are still slightly
more boilerplate than \`<form action={createPost}>\` with a Server Action. On
a fresh build today I'd reach for actions + a thin tRPC layer only for the
client-side queries that benefit from React Query's cache.`,
  },
];
