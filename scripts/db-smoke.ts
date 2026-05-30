import { getDb, smokeTest } from "../lib/db/sqlite";

const { sqliteVersion, vecVersion } = smokeTest();
console.log(`sqlite: ${sqliteVersion}`);
console.log(`sqlite-vec: ${vecVersion}`);

const db = getDb();

const testVec = new Float32Array(768).fill(0);
testVec[0] = 1;

const insert = db.prepare(
  `INSERT INTO rag_chunks (source, chunk_index, text) VALUES (?, ?, ?)`
).run("smoke-test", 0, "hello world");

const id = Number(insert.lastInsertRowid);
console.log("inserted chunk id:", id, typeof id);

db.prepare(
  `INSERT INTO rag_embeddings (chunk_id, embedding) VALUES (?, ?)`
).run(BigInt(id), Buffer.from(testVec.buffer));

const rows = db
  .prepare(
    `SELECT c.text, e.distance
     FROM rag_embeddings e
     JOIN rag_chunks c ON c.id = e.chunk_id
     WHERE e.embedding MATCH ? AND k = 1
     ORDER BY e.distance`
  )
  .all(Buffer.from(testVec.buffer));

console.log("vector search result:", rows);

db.prepare(`DELETE FROM rag_chunks WHERE source = 'smoke-test'`).run();

console.log("smoke test passed");
