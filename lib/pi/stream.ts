export type PiStreamEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; args: Record<string, unknown> }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * Newline-delimited JSON stream of PiStreamEvent.
 *
 * Each line of the response body is a JSON-encoded PiStreamEvent.
 * The terminator is a `{"type":"done"}` event followed by stream close.
 *
 * Why ndjson and not SSE: simpler client (just split on \n), no event-stream
 * spec overhead, and works fine with fetch ReadableStream.
 */

export async function* parsePiStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<PiStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        yield JSON.parse(line) as PiStreamEvent;
      } catch {
        // Skip malformed lines; the server should not emit them.
      }
    }
  }

  // Flush trailing partial line, if any.
  const tail = buffer.trim();
  if (tail) {
    try {
      yield JSON.parse(tail) as PiStreamEvent;
    } catch {
      // ignore
    }
  }
}
