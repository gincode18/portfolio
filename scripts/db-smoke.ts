import { getDb, getRaw, smokeTest } from "../lib/db/client";
import { ragChunks } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const { sqliteVersion, vecVersion } = smokeTest();
  console.log(`sqlite: ${sqliteVersion}`);
  console.log(`sqlite-vec: ${vecVersion}`);

  const db = getDb();
  const raw = getRaw();

  const testVec = new Float32Array(768).fill(0);
  testVec[0] = 1;

  const [{ id }] = await db
    .insert(ragChunks)
    .values({
      source: "smoke-test",
      chunkIndex: 0,
      text: "hello world",
      metadata: { kind: "profile" },
    })
    .returning({ id: ragChunks.id });
  console.log("inserted chunk id:", id, typeof id);

  raw
    .prepare("INSERT INTO rag_embeddings (chunk_id, embedding) VALUES (?, ?)")
    .run(BigInt(id), Buffer.from(testVec.buffer));

  const rows = raw
    .prepare(
      `SELECT c.text, e.distance
       FROM rag_embeddings e
       JOIN rag_chunks c ON c.id = e.chunk_id
       WHERE e.embedding MATCH ? AND k = 1
       ORDER BY e.distance`
    )
    .all(Buffer.from(testVec.buffer));

  console.log("vector search result:", rows);

  raw.prepare("DELETE FROM rag_embeddings WHERE chunk_id = ?").run(BigInt(id));
  await db.delete(ragChunks).where(eq(ragChunks.source, "smoke-test"));

  console.log("smoke test passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
