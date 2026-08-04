import type { Publication as PublicationDoc } from "../payload-types";
import { file, image, type Img } from "./image";
import { cached, cms } from "./payload";

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

function toPublication(doc: PublicationDoc): Publication {
  return {
    slug: doc.slug,
    title: doc.title,
    category: doc.category,
    date: doc.date,
    file: file(doc.file),
    cover: image(doc.cover),
  };
}

/**
 * Everything published, newest first.
 *
 * Only genuinely published documents: the eighteen entries seeded from the
 * brief are Payload drafts, because they are titles FXB has not yet supplied
 * files for. The shelves stay empty and say so until the team attaches a PDF
 * and presses Publish, which is the honest state — an annual report the site
 * claims to have and cannot produce is worse than a page saying it is coming.
 */
export const getPublications = cached(
  "publications:all",
  "publications",
  async () => {
    const payload = await cms();
    const { docs } = await payload.find({
      collection: "publications",
      where: { _status: { equals: "published" } },
      sort: "-date",
      depth: 1,
      limit: 0,
      pagination: false,
    });
    return docs.map(toPublication);
  },
);

export async function getPublicationsIn(
  category: PublicationCategory,
): Promise<Publication[]> {
  return (await getPublications()).filter(
    (publication) => publication.category === category,
  );
}

/**
 * The newest annual report, which the banner at the top of every page
 * announces. Publishing the next one changes the banner with no further action;
 * having none takes the banner away rather than leaving a dead link.
 */
export async function getLatestAnnualReport(): Promise<Publication | null> {
  const reports = await getPublicationsIn("annual-report");
  return reports[0] ?? null;
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
