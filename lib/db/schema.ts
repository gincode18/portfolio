import { sql } from "drizzle-orm";
import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import type { ChunkMetadata } from "@/lib/pi/retrieve";

/**
 * Chunks of indexed content. One row per logical unit (a project, a role, a
 * note section). Pairs 1:1 with rag_embeddings via id = chunk_id.
 *
 * Note: rag_embeddings is a sqlite-vec virtual table — Drizzle's schema DSL
 * can't model virtual tables, so it is created in code at startup. See
 * lib/db/client.ts → ensureVecTable().
 */
export const ragChunks = sqliteTable(
  "rag_chunks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    source: text("source").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    text: text("text").notNull(),
    metadata: text("metadata", { mode: "json" })
      .$type<ChunkMetadata>()
      .notNull()
      .default(sql`'{}'`),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_rag_chunks_source").on(t.source)]
);

export const contactMessages = sqliteTable("contact_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  ipHash: text("ip_hash"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type RagChunk = typeof ragChunks.$inferSelect;
export type NewRagChunk = typeof ragChunks.$inferInsert;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
