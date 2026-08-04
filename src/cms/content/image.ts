import type { InferSelectModel } from "drizzle-orm";
import type { media } from "@/staff/db/schema";

type MediaRow = InferSelectModel<typeof media>;

/**
 * A photograph, ready for `next/image`.
 *
 * The intrinsic dimensions travel with it so the browser can reserve the space
 * before the file arrives and the page never jumps as photographs land.
 */
export type Img = {
  url: string;
  /** The description the uploader wrote. Pass `""` where the image is decorative. */
  alt: string;
  width: number;
  height: number;
};

/**
 * A joined media row, resolved.
 *
 * Returns null rather than throwing when the image is missing. The reference
 * points at a row somebody can delete from the media library, and an editor
 * tidying up should not be able to take a page down — every caller renders
 * without the photograph instead.
 */
export function image(row: MediaRow | null | undefined): Img | null {
  if (!row?.url || !row.width || !row.height) return null;
  return { url: row.url, alt: row.alt ?? "", width: row.width, height: row.height };
}

/** The file behind an upload — a PDF, usually — and how big it is. */
export function file(
  row: MediaRow | null | undefined,
): { url: string; bytes: number | null } | null {
  if (!row?.url) return null;
  return { url: row.url, bytes: row.filesize ?? null };
}
