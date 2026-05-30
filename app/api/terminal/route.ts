import { parseAndRun } from "@/lib/terminal/commands";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_INPUT_LEN = 200;

export async function POST(request: Request) {
  const rl = checkRateLimit(clientKey(request, "terminal"), {
    capacity: 60,
    refillPerSec: 60 / 3600, // 60 requests per hour
  });
  if (!rl.allowed) {
    return Response.json(
      {
        lines: [
          `slow down — try again in ${rl.retryAfterSec}s`,
        ],
        exitCode: 1,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { lines: ["error: invalid JSON"], exitCode: 1 },
      { status: 400 }
    );
  }

  const input =
    typeof (body as { input?: unknown })?.input === "string"
      ? ((body as { input: string }).input as string)
      : "";

  if (input.length > MAX_INPUT_LEN) {
    return Response.json(
      { lines: [`error: input too long (max ${MAX_INPUT_LEN} chars)`], exitCode: 1 },
      { status: 400 }
    );
  }

  const result = parseAndRun(input);
  return Response.json(result);
}
