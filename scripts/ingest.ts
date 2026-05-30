// Ingest content/* into rag_chunks + rag_embeddings.
//
// Usage:
//   GEMINI_API_KEY=... npx tsx scripts/ingest.ts
//
// Idempotent: clears all existing chunks first, then re-inserts.

import { getDb } from "../lib/db/sqlite";
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
  const chunks = collectChunks();
  console.log(`collected ${chunks.length} chunks`);

  console.log("clearing existing index…");
  db.exec("DELETE FROM rag_embeddings");
  db.exec("DELETE FROM rag_chunks");

  console.log("embedding…");
  const texts = chunks.map((c) => c.text);
  const vectors = await embedBatch(texts);

  console.log("writing…");
  const insertChunk = db.prepare(
    `INSERT INTO rag_chunks (source, chunk_index, text, metadata) VALUES (?, 0, ?, ?)`
  );
  const insertEmbed = db.prepare(
    `INSERT INTO rag_embeddings (chunk_id, embedding) VALUES (?, ?)`
  );

  const tx = db.transaction(() => {
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const res = insertChunk.run(c.source, c.text, JSON.stringify(c.metadata));
      const id = Number(res.lastInsertRowid);
      insertEmbed.run(BigInt(id), Buffer.from(vectors[i].buffer));
    }
  });
  tx();

  const { count } = db
    .prepare("SELECT COUNT(*) AS count FROM rag_embeddings")
    .get() as { count: number };
  console.log(`done — ${count} chunks indexed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
