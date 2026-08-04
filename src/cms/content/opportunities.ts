import type { Opportunity } from "../payload-types";
import { file } from "./image";
import type { RichText } from "./news";
import { cached, cms } from "./payload";

/** A vacancy or a procurement notice — the same shape, on two pages. */
export type Opening = {
  id: number;
  title: string;
  kind: "career" | "procurement";
  /** ISO timestamp. The site stops showing the opening after this date. */
  closesAt: string;
  location?: string;
  body: RichText;
  /** The full terms of reference or job description, if there is one. */
  document: { url: string; bytes: number | null } | null;
};

const getAll = cached("opportunities", "opportunities", async (): Promise<Opening[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: "opportunities",
    sort: "closesAt",
    depth: 1,
    limit: 0,
    pagination: false,
  });

  return docs.map((doc: Opportunity) => ({
    id: doc.id,
    title: doc.title,
    kind: doc.kind,
    closesAt: doc.closesAt,
    location: doc.location ?? undefined,
    body: doc.body,
    document: file(doc.document),
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
 *
 * Both pages are written twice over in the brief — once for when there are
 * openings and once for when there are none. Both states are real, and an empty
 * list is not a failure.
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
