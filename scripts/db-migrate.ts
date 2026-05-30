// Explicitly run Drizzle migrations and ensure the sqlite-vec virtual table
// exists. getDb() does this lazily on first call too; this script is for CI,
// pre-deploy checks, and "just run migrations on a fresh box".

import { getDb, getRaw } from "../lib/db/client";

const db = getDb();
const raw = getRaw();

const tables = raw
  .prepare(
    `SELECT name FROM sqlite_master WHERE type IN ('table','virtual')
     AND name NOT LIKE 'sqlite_%' ORDER BY name`
  )
  .all() as Array<{ name: string }>;

void db;
console.log("tables:", tables.map((t) => t.name).join(", "));
console.log("migrate ok");
