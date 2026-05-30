import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const result = await db
      .select({ ok: sql<number>`1` })
      .from(sql`(SELECT 1)`)
      .get();
    return Response.json({ status: "ok", db: result?.ok === 1 });
  } catch (err) {
    return Response.json(
      { status: "error", message: (err as Error).message },
      { status: 500 }
    );
  }
}
