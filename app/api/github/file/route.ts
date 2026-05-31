import { fetchRepoFile } from "@/lib/github/api";
import { detectLang, isBinary, toMonacoLang } from "@/lib/github/lang";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const VALID = /^[a-zA-Z0-9_.-]{1,100}$/;
const MAX_PATH = 512;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner") ?? "";
  const repo = url.searchParams.get("repo") ?? "";
  const path = url.searchParams.get("path") ?? "";

  if (!VALID.test(owner) || !VALID.test(repo)) {
    return Response.json(
      { error: "owner and repo are required" },
      { status: 400 }
    );
  }
  if (!path || path.length > MAX_PATH || path.includes("..")) {
    return Response.json({ error: "invalid path" }, { status: 400 });
  }

  const rl = checkRateLimit(clientKey(request, "gh-file"), {
    capacity: 120,
    refillPerSec: 120 / 3600,
  });
  if (!rl.allowed) {
    return Response.json(
      { error: `Slow down — try again in ${rl.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  if (isBinary(path)) {
    return Response.json(
      {
        path,
        lang: "binary",
        monacoLang: "plaintext",
        content: "// Binary file — not shown",
        lines: 0,
        binary: true,
      },
      { headers: { "Cache-Control": "private, max-age=600" } }
    );
  }

  try {
    const file = await fetchRepoFile(owner, repo, path);
    const lang = detectLang(path);
    return Response.json(
      {
        path,
        lang,
        monacoLang: toMonacoLang(lang),
        content: file.content,
        lines: file.content.split("\n").length,
        size: file.size,
        binary: false,
      },
      { headers: { "Cache-Control": "private, max-age=600" } }
    );
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
