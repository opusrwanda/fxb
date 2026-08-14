import { eq } from "drizzle-orm";

import { db, sections } from "../db";
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

  const value = (raw: string) => raw.trim() || null;

  /**
   * An item list identical to the one the code ships is not an override.
   *
   * Otherwise opening a section and pressing Save would write the defaults
   * into the database, and from then on "put it back" would restore a copy of
   * whatever the defaults happened to be that day rather than what the code
   * says today.
   */
  const shipped = SECTIONS[key].items;
  const items =
    input.items === null || JSON.stringify(input.items) === JSON.stringify(shipped ?? null)
      ? null
      : input.items;

  const row = {
    eyebrow: value(input.eyebrow),
    heading: value(input.heading),
    body: value(input.body),
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
