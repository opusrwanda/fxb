import { asc, eq } from "drizzle-orm";

import { db, media, opportunities } from "@/staff/db";
import type { RichText } from "@/staff/db/schema";
import { cached } from "./cache";
import { file } from "./image";

/** A vacancy or a procurement notice — the same shape, on two pages. */
export type Opening = {
  id: number;
  title: string;
  kind: "career" | "procurement";
  /** ISO timestamp. The site stops showing the opening after this date. */
  closesAt: string;
  location?: string;
  body: RichText | null;
  /** The full terms of reference or job description, if there is one. */
  document: { url: string; bytes: number | null } | null;
};

const getAll = cached("opportunities", "opportunities", async (): Promise<Opening[]> => {
  const rows = await db
    .select({ opening: opportunities, document: media })
    .from(opportunities)
    .leftJoin(media, eq(opportunities.documentId, media.id))
    .where(eq(opportunities.status, "published"))
    .orderBy(asc(opportunities.closesAt));

  return rows.map(({ opening, document }) => ({
    id: opening.id,
    title: opening.title,
    kind: opening.kind as "career" | "procurement",
    closesAt: opening.closesAt,
    location: opening.location ?? undefined,
    body: opening.body,
    document: file(document),
  }));
});

/**
 * The openings still accepting applications, closing soonest first.
 *
 * The closing date is applied here rather than inside the cached query on
 * purpose. The cache is held until someone edits the collection, so a filter
 * baked into it would freeze the meaning of "today" at whenever the page was
 * last built and keep offering a vacancy that closed in March. Reading them all
 * and dropping the expired ones per request costs nothing and cannot go stale.
 */
export async function getOpenings(
  kind: "career" | "procurement",
): Promise<Opening[]> {
  const today = new Date().setHours(0, 0, 0, 0);
  return (await getAll()).filter(
    (opening) =>
      opening.kind === kind && new Date(opening.closesAt).getTime() >= today,
  );
}
