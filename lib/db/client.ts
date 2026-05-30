import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as sqliteVec from "sqlite-vec";
import path from "node:path";
import fs from "node:fs";
import * as schema from "@/lib/db/schema";

export type Db = BetterSQLite3Database<typeof schema>;

const DB_PATH =
  process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "portfolio.db");

const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");

let _db: Db | null = null;
let _raw: Database.Database | null = null;

/**
 * Lazy, process-singleton connection. First call:
 *   1. Opens SQLite (creates the data dir if missing)
 *   2. Sets WAL + foreign-key pragmas
 *   3. Loads the sqlite-vec extension
 *   4. Runs Drizzle migrations from ./drizzle
 *   5. Ensures the rag_embeddings vec0 virtual table exists (Drizzle can't
 *      model virtual tables, so we manage it here)
 */
export function getDb(): Db {
  if (_db) return _db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqliteVec.load(sqlite);

  const db = drizzle(sqlite, { schema });

  if (fs.existsSync(MIGRATIONS_DIR)) {
    migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  }

  ensureVecTable(sqlite);

  _raw = sqlite;
  _db = db;
  return db;
}

/**
 * Access the raw better-sqlite3 connection. Use this only for sqlite-vec
 * virtual-table queries (MATCH operator) that Drizzle's query builder cannot
 * express. Returns the same connection getDb() opened.
 */
export function getRaw(): Database.Database {
  if (!_raw) getDb();
  if (!_raw) throw new Error("DB initialization failed");
  return _raw;
}

function ensureVecTable(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS rag_embeddings USING vec0(
      chunk_id INTEGER PRIMARY KEY,
      embedding FLOAT[768]
    );
  `);
}

export function smokeTest(): { sqliteVersion: string; vecVersion: string } {
  const sqlite = getRaw();
  const { sqliteVersion } = sqlite
    .prepare("SELECT sqlite_version() AS sqliteVersion")
    .get() as { sqliteVersion: string };
  const { vecVersion } = sqlite
    .prepare("SELECT vec_version() AS vecVersion")
    .get() as { vecVersion: string };
  return { sqliteVersion, vecVersion };
}

export { schema };
