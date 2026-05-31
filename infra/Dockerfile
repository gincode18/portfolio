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

# Use the built-in `node` user (uid 1000) that ships with node:bookworm-slim
# rather than creating a fresh user. uid 1000 is also the typical uid of the
# first interactive user on a Raspberry Pi (`pi`, `gincode`, etc.), so when a
# host directory is bind-mounted at /data the container can write to it
# without any chown gymnastics.
RUN mkdir -p /data && chown -R node:node /data

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Native modules (better-sqlite3, sqlite-vec) and the platform-matching
# sqlite-vec-* binary are bundled into .next/standalone by Next.js tracing —
# see outputFileTracingIncludes in next.config.ts.

USER node
EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
