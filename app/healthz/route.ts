import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const { ok } = db.prepare("SELECT 1 AS ok").get() as { ok: number };
    return Response.json({ status: "ok", db: ok === 1 });
  } catch (err) {
    return Response.json(
      { status: "error", message: (err as Error).message },
      { status: 500 }
    );
  }
}
