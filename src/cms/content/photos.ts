import { inArray } from "drizzle-orm";

import { db, media } from "@/staff/db";
import { cached } from "./cache";
import { image, type Img } from "./image";

/**
 * A photograph from the media library, by filename.
 *
 * For the bands that break up the text-only pages. The choice of picture is
 * made in the page — these are editorial decisions about what a particular
 * section should look like, not fields the team sets — but the file itself
 * comes from the library, which is what keeps the alt text and the intrinsic
 * dimensions correct and lets somebody replace the photograph by uploading
 * over it rather than by editing a component.
 *
 * Missing files return null and the band renders nothing, so deleting a
 * photograph from the library thins a page out rather than breaking it.
 */
export const getPhotos = cached(
  "photos:by-filename",
  "media",
  async (filenames: string[]): Promise<Record<string, Img | null>> => {
    if (filenames.length === 0) return {};

    const rows = await db
      .select()
      .from(media)
      .where(inArray(media.filename, filenames));

    return Object.fromEntries(rows.map((row) => [row.filename, image(row)]));
  }
);

/**
 * Photographs by library row, for the ones somebody chose in the panel.
 *
 * The lookup above is by filename because the pictures the site ships with are
 * named in code. A picture picked in `/staff` is known by its row, and a row
 * that has since been deleted is simply missing from the answer — the caller
 * falls back to whatever it showed before.
 */
export const getPhotosById = cached(
  "photos:by-id",
  "media",
  async (ids: number[]): Promise<Record<number, Img | null>> => {
    if (ids.length === 0) return {};

    const rows = await db.select().from(media).where(inArray(media.id, ids));

    return Object.fromEntries(rows.map((row) => [row.id, image(row)]));
  }
);
