import type { Config } from "drizzle-kit";
import path from "node:path";

const DB_PATH =
  process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "portfolio.db");

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: DB_PATH,
  },
  // Don't try to introspect/manage the sqlite-vec virtual table — we manage
  // it in code at startup. drizzle-kit will leave any table not in schema
  // alone, but listing it explicitly here documents the intent.
  tablesFilter: ["!rag_embeddings", "!_*"],
  strict: true,
  verbose: false,
} satisfies Config;
