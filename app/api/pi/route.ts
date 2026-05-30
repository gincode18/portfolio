import { GoogleGenAI } from "@google/genai";
import { buildSystemPrompt } from "@/lib/pi/system-prompt";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import type { PiStreamEvent } from "@/lib/pi/stream";

export const dynamic = "force-dynamic";

const MODEL = "gemini-2.5-flash";
const MAX_INPUT_CHARS = 2000;
const MAX_HISTORY = 16;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const rl = checkRateLimit(clientKey(request, "pi"), {
    capacity: 10,
    refillPerSec: 10 / 3600, // 10 requests per IP per hour
  });
  if (!rl.allowed) {
    return Response.json(
      { error: `Slow down — try again in ${rl.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = (await request.json()) as { messages?: ChatMessage[] };
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const messages = (body.messages ?? []).slice(-MAX_HISTORY);
  if (messages.length === 0) {
    return Response.json({ error: "messages must not be empty" }, { status: 400 });
  }
  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return Response.json(
      { error: "last message must be from the user" },
      { status: 400 }
    );
  }
  if (last.content.length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: `Message too long (max ${MAX_INPUT_CHARS} chars).` },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return ndjsonStream(async function* () {
      yield {
        type: "text",
        text:
          "Pi is in dev mode without a Gemini API key. Set `GEMINI_API_KEY` in `.env.local` to enable real responses. Your question was: " +
          JSON.stringify(last.content),
      };
      yield { type: "done" };
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = buildSystemPrompt();

  // Gemini expects { role: "user" | "model", parts: [{text}] }
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  return ndjsonStream(async function* () {
    try {
      const stream = await ai.models.generateContentStream({
        model: MODEL,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
          maxOutputTokens: 1024,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          yield { type: "text", text };
        }
      }
      yield { type: "done" };
    } catch (err) {
      yield {
        type: "error",
        message: (err as Error).message || "Gemini request failed.",
      };
    }
  });
}

function ndjsonStream(
  source: () => AsyncGenerator<PiStreamEvent>
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of source()) {
          controller.enqueue(encoder.encode(JSON.stringify(ev) + "\n"));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              message: (err as Error).message,
            }) + "\n"
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
