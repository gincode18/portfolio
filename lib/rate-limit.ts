import "server-only";

type Bucket = { tokens: number; lastRefill: number };

type LimiterConfig = {
  capacity: number;
  refillPerSec: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  config: LimiterConfig
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? {
    tokens: config.capacity,
    lastRefill: now,
  };

  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(
    config.capacity,
    bucket.tokens + elapsed * config.refillPerSec
  );
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return { allowed: true, retryAfterSec: 0 };
  }

  buckets.set(key, bucket);
  const retryAfterSec = Math.ceil((1 - bucket.tokens) / config.refillPerSec);
  return { allowed: false, retryAfterSec };
}

export function clientKey(req: Request, prefix: string): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0].trim() || "unknown";
  return `${prefix}:${ip}`;
}
