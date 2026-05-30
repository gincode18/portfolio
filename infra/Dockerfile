# Multi-stage build targeting linux/arm64 (Raspberry Pi 5).
# Build with:
#   docker buildx build --platform linux/arm64 -t portfolio:latest -f infra/Dockerfile .

ARG NODE_VERSION=22

# ---------- deps ----------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- builder ----------
FROM node:${NODE_VERSION}-bookworm-slim AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---------- runner ----------
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV SQLITE_PATH=/data/portfolio.db

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs \
    && mkdir -p /data && chown -R nextjs:nodejs /data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Native modules (better-sqlite3, sqlite-vec) and the platform-matching
# sqlite-vec-* binary are bundled into .next/standalone by Next.js tracing —
# see outputFileTracingIncludes in next.config.ts.

USER nextjs
EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
