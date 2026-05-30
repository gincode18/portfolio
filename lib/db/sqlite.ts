import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import path from "node:path";
import fs from "node:fs";

const DB_PATH =
  process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "portfolio.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  sqliteVec.load(db);

  runMigrations(db);

  _db = db;
  return db;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const current = db
    .prepare("SELECT COALESCE(MAX(version), 0) AS v FROM schema_version")
    .get() as { v: number };

  const migrations: Array<{ version: number; sql: string }> = [
    {
      version: 1,
      sql: `
        CREATE TABLE IF NOT EXISTS rag_chunks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source TEXT NOT NULL,
          chunk_index INTEGER NOT NULL,
          text TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        CREATE INDEX IF NOT EXISTS idx_rag_chunks_source ON rag_chunks(source);

        CREATE VIRTUAL TABLE IF NOT EXISTS rag_embeddings USING vec0(
          chunk_id INTEGER PRIMARY KEY,
          embedding FLOAT[768]
        );

        CREATE TABLE IF NOT EXISTS contact_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          ip_hash TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
      `,
    },
  ];

  for (const { version, sql } of migrations) {
    if (version > current.v) {
      db.exec("BEGIN");
      try {
        db.exec(sql);
        db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(
          version
        );
        db.exec("COMMIT");
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
    }
  }
}

export function smokeTest(): { sqliteVersion: string; vecVersion: string } {
  const db = getDb();
  const { sqliteVersion } = db
    .prepare("SELECT sqlite_version() AS sqliteVersion")
    .get() as { sqliteVersion: string };
  const { vecVersion } = db
    .prepare("SELECT vec_version() AS vecVersion")
    .get() as { vecVersion: string };
  return { sqliteVersion, vecVersion };
}
