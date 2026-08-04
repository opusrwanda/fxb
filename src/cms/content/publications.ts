import { aliasedTable, desc, eq } from "drizzle-orm";

import { db, media, publications } from "@/staff/db";
import { cached } from "./cache";
import { file, image, type Img } from "./image";

export type PublicationCategory =
  | "annual-report"
  | "project-report"
  | "policy"
  | "brochure"
  | "newsletter";

export type Publication = {
  slug: string;
  title: string;
  category: PublicationCategory;
  /** ISO timestamp, formatted at render. */
  date: string;
  /** The document itself. Null only if the upload was deleted from under it. */
  file: { url: string; bytes: number | null } | null;
  cover: Img | null;
};

// The file and the cover are both media rows, so the table is joined twice and
// needs a distinct name each time or Postgres cannot tell the two apart.
const doc = aliasedTable(media, "doc");
const cover = aliasedTable(media, "cover");

/**
 * Everything published, newest first.
 *
 * Only genuinely published documents: the eighteen entries carried over from
 * the brief are drafts, because they are titles FXB has not supplied files for.
 * The shelves stay empty and say so until the team attaches a PDF and presses
 * Publish, which is the honest state — an annual report the site claims to have
 * and cannot produce is worse than a page saying it is coming.
 */
export const getPublications = cached("publications:all", "publications", async () => {
  const rows = await db
    .select({ publication: publications, doc, cover })
    .from(publications)
    .leftJoin(doc, eq(publications.fileId, doc.id))
    .leftJoin(cover, eq(publications.coverId, cover.id))
    .where(eq(publications.status, "published"))
    .orderBy(desc(publications.date));

  return rows.map((row): Publication => ({
    slug: row.publication.slug,
    title: row.publication.title,
    category: row.publication.category as PublicationCategory,
    date: row.publication.date.toISOString(),
    file: file(row.doc),
    cover: image(row.cover),
  }));
});

export async function getPublicationsIn(
  category: PublicationCategory,
): Promise<Publication[]> {
  return (await getPublications()).filter((p) => p.category === category);
}

/**
 * The newest annual report, which the banner at the top of every page
 * announces. Publishing the next one changes the banner with no further action;
 * having none takes the banner away rather than leaving a dead link.
 */
export async function getLatestAnnualReport(): Promise<Publication | null> {
  return (await getPublicationsIn("annual-report"))[0] ?? null;
}

const monthAndYear = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * "June 2025". A publication is dated to the month it covers, not the day it
 * was uploaded, so the day would be noise.
 */
export function formatPublicationDate(value: string): string {
  return monthAndYear.format(new Date(value));
}

/** 4_194_304 -> "4.2 MB". Decimal units, as every download UI reports them. */
export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1000;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}
