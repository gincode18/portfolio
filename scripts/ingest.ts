// Ingest content/* into rag_chunks + rag_embeddings.
//
// Usage:
//   GEMINI_API_KEY=... pnpm ingest
//
// Idempotent: clears all existing chunks first, then re-inserts.

import { getDb, getRaw } from "../lib/db/client";
import { ragChunks } from "../lib/db/schema";
import { embedBatch } from "../lib/pi/embed";
import { collectChunks } from "../lib/pi/sources";

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "Refusing to run: set GEMINI_API_KEY in your shell or .env.local."
    );
    process.exit(1);
  }

  const db = getDb();
  const raw = getRaw();

  const chunks = collectChunks();
  console.log(`collected ${chunks.length} chunks`);

  console.log("clearing existing index…");
  raw.exec("DELETE FROM rag_embeddings");
  await db.delete(ragChunks);

  console.log("embedding…");
  const vectors = await embedBatch(chunks.map((c) => c.text));

  console.log("writing…");
  const insertEmbed = raw.prepare(
    "INSERT INTO rag_embeddings (chunk_id, embedding) VALUES (?, ?)"
  );

  // Wrap in a single transaction using the underlying connection — Drizzle's
  // own .transaction() also works, but we need raw.prepare for the vec0 insert
  // so it's simpler to use one transaction primitive for both.
  raw.exec("BEGIN");
  try {
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const [{ id }] = await db
        .insert(ragChunks)
        .values({
          source: c.source,
          chunkIndex: 0,
          text: c.text,
          metadata: c.metadata,
        })
        .returning({ id: ragChunks.id });

      insertEmbed.run(BigInt(id), Buffer.from(vectors[i].buffer));
    }
    raw.exec("COMMIT");
  } catch (err) {
    raw.exec("ROLLBACK");
    throw err;
  }

  const { count } = raw
    .prepare("SELECT COUNT(*) AS count FROM rag_embeddings")
    .get() as { count: number };
  console.log(`done — ${count} chunks indexed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
