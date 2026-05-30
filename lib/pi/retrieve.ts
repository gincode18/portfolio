import { getDb } from "@/lib/db/sqlite";
import { embedOne } from "@/lib/pi/embed";

export type ChunkHit = {
  chunkId: number;
  source: string;
  text: string;
  metadata: ChunkMetadata;
  distance: number;
};

export type ChunkMetadata = {
  kind: "profile" | "education" | "experience" | "project" | "note" | "skills" | "achievement";
  id?: string;
  title?: string;
  // Optional explicit routing hint for tool calls (e.g. open the projects window
  // and select this id). The model is free to ignore it.
  route?:
    | { type: "openApp"; appId: string; selectId?: string }
    | { type: "openExternalLink"; url: string };
};

export async function retrieve(
  query: string,
  k = 6
): Promise<ChunkHit[]> {
  const db = getDb();

  // If we haven't ingested yet, there will be no embeddings — caller should
  // fall back to inline context.
  const { count } = db
    .prepare("SELECT COUNT(*) AS count FROM rag_embeddings")
    .get() as { count: number };
  if (count === 0) return [];

  const vec = await embedOne(query);

  const rows = db
    .prepare(
      `SELECT c.id AS chunkId, c.source, c.text, c.metadata, e.distance
       FROM rag_embeddings e
       JOIN rag_chunks c ON c.id = e.chunk_id
       WHERE e.embedding MATCH ? AND k = ?
       ORDER BY e.distance`
    )
    .all(Buffer.from(vec.buffer), k) as Array<{
      chunkId: number;
      source: string;
      text: string;
      metadata: string;
      distance: number;
    }>;

  return rows.map((r) => ({
    chunkId: r.chunkId,
    source: r.source,
    text: r.text,
    metadata: safeJson(r.metadata),
    distance: r.distance,
  }));
}

function safeJson(s: string): ChunkMetadata {
  try {
    return JSON.parse(s) as ChunkMetadata;
  } catch {
    return { kind: "profile" };
  }
}

export function formatContext(hits: ChunkHit[]): string {
  if (hits.length === 0) return "";
  return hits
    .map((h, i) => {
      const tag = h.metadata.title
        ? `${h.metadata.kind}: ${h.metadata.title}`
        : h.metadata.kind;
      return `[ctx ${i + 1} · ${tag}]\n${h.text}`;
    })
    .join("\n\n");
}
