import { fetchRepoTree } from "@/lib/github/api";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const VALID = /^[a-zA-Z0-9_.-]{1,100}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner") ?? "";
  const repo = url.searchParams.get("repo") ?? "";

  if (!VALID.test(owner) || !VALID.test(repo)) {
    return Response.json(
      { error: "owner and repo are required (alphanumeric, dot, dash, underscore)" },
      { status: 400 }
    );
  }

  const rl = checkRateLimit(clientKey(request, "gh-tree"), {
    capacity: 60,
    refillPerSec: 60 / 3600,
  });
  if (!rl.allowed) {
    return Response.json(
      { error: `Slow down — try again in ${rl.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const data = await fetchRepoTree(owner, repo);
    return Response.json(data, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
