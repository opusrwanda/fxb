import { eq } from "drizzle-orm";

import { db, pageHeaders, sections } from "../db";
import { SECTIONS } from "@/cms/content/sections";
import type { SectionItem } from "../db/schema";
import { bust } from "@/cms/revalidate";

/**
 * Writing a section's copy.
 *
 * Only what differs from the default is stored, and a field cleared back to
 * empty is stored as null rather than as an empty string — so "put it back"
 * and "leave it blank" are the same gesture, and a row that matches the
 * default everywhere is deleted rather than kept as a no-op.
 */
export type SectionInput = {
  eyebrow: string;
  heading: string;
  body: string;
  /** A row in `media`, or null for the section's own picture. */
  imageId: number | null;
  /**
   * The blocks, or null where the section has no list to edit.
   *
   * Null and empty differ: null leaves the shipped list alone, an empty array
   * is somebody having removed every block deliberately. Only a section that
   * declares `items` in the registry can send either.
   */
  items: SectionItem[] | null;
};

export async function saveSection(
  key: string,
  input: SectionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // The key comes from a form field, and a form field is not a permission.
  // Only sections the code actually renders may be written; anything else
  // would be a row nothing reads and a way to grow the table from outside.
  if (!SECTIONS[key]) return { ok: false, error: "No such section." };

  const shipped = SECTIONS[key];

  /**
   * What to store for one field: nothing, unless it differs from the default.
   *
   * The panel now fills each box with what the page actually says rather than
   * leaving it blank until somebody types — which is the only way to edit a
   * sentence you can see, but it also means every Save posts the defaults back.
   * Storing them would turn "put it back" into "restore whatever the code said
   * the day somebody pressed Save", and the badge would say every band on the
   * site had been edited. So an unchanged field is not an override, the same
   * rule the item list below has always followed.
   *
   * Empty stays empty-means-default, so clearing a box is still how a field is
   * put back on its own.
   */
  const value = (raw: string, original?: string) => {
    // Line endings normalised first. A textarea posts CRLF on Windows, and a
    // multi-paragraph default typed by nobody would otherwise differ from the
    // shipped one by two invisible characters — stored as an override, badged
    // as edited, and frozen against the code from then on.
    const text = raw.replace(/\r\n/g, "\n").trim();
    return text === "" || text === original ? null : text;
  };

  /**
   * An item list identical to the one the code ships is not an override.
   *
   * Otherwise opening a section and pressing Save would write the defaults
   * into the database, and from then on "put it back" would restore a copy of
   * whatever the defaults happened to be that day rather than what the code
   * says today.
   */
  const items =
    input.items === null ||
    JSON.stringify(input.items) === JSON.stringify(shipped.items ?? null)
      ? null
      : input.items;

  const row = {
    eyebrow: value(input.eyebrow, shipped.eyebrow),
    heading: value(input.heading, shipped.heading),
    body: value(input.body, shipped.body),
    imageId: input.imageId,
    items,
  };

  const empty =
    !row.eyebrow && !row.heading && !row.body && row.imageId === null && row.items === null;

  if (empty) {
    // Nothing overridden any more. Deleting is what makes the default the
    // default again, rather than leaving a row of nulls behind that reads as
    // an override in the table.
    await db.delete(sections).where(eq(sections.key, key));
  } else {
    await db
      .insert(sections)
      .values({ key, ...row, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: sections.key,
        set: { ...row, updatedAt: new Date() },
      });
  }

  bust("sections");
  return { ok: true };
}

/** Put a section back to what the code ships. */
export async function resetSection(key: string): Promise<void> {
  await db.delete(sections).where(eq(sections.key, key));
  bust("sections");
}

/**
 * The banner photograph behind a page's header.
 *
 * Its own table, because the row is keyed by route and read by every page on
 * the site — but its own screen no longer, because a banner is not a thing
 * somebody sets out to edit. They set out to edit a page's opening block, and
 * the picture behind it is part of that block. So the writing lives beside the
 * section writing and the panel shows them together; see `bannerPath` in
 * `cms/content/sections.ts` for what joins a section to a route.
 */
export type BannerInput = {
  /** A row in `media`, or null for no photograph. */
  imageId: number | null;
  /** Footage over the photograph, or null. Ignored by the site without a still. */
  videoId: number | null;
};

/** Every banner that has been set, by route. */
export async function getPageBanners(): Promise<Record<string, BannerInput>> {
  const rows = await db
    .select({
      path: pageHeaders.path,
      imageId: pageHeaders.imageId,
      videoId: pageHeaders.videoId,
    })
    .from(pageHeaders);

  return Object.fromEntries(
    rows.map((row) => [row.path, { imageId: row.imageId, videoId: row.videoId }]),
  );
}

/**
 * Writing one route's banner.
 *
 * Clearing both pickers deletes the row rather than storing two nulls, for the
 * same reason a section with nothing overridden is deleted: an empty row reads
 * as "this page has its own banner" in a table where having a row is the whole
 * override, and it would keep the page off the site-wide default forever.
 */
export async function savePageBanner(path: string, input: BannerInput): Promise<void> {
  if (input.imageId === null && input.videoId === null) {
    await db.delete(pageHeaders).where(eq(pageHeaders.path, path));
  } else {
    await db
      .insert(pageHeaders)
      .values({ path, ...input, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: pageHeaders.path,
        set: { ...input, updatedAt: new Date() },
      });
  }

  bust("pageHeaders");
}
