import type { Media } from "../payload-types";

/**
 * A photograph, ready for `next/image`.
 *
 * The intrinsic dimensions travel with it so the browser can reserve the space
 * before the file arrives and the page never jumps as photographs land — the
 * same contract `src/lib/photos.ts` held for the supplied library, now coming
 * from whatever the team uploaded instead.
 */
export type Img = {
  url: string;
  /** The description the uploader wrote. Pass `""` where the image is decorative. */
  alt: string;
  width: number;
  height: number;
};

/**
 * An upload field, resolved.
 *
 * Returns null rather than throwing when the image is missing. The old library
 * threw on an unknown photo id, and that was right when photographs were a
 * fixed manifest checked into the repository — a missing one was a typo worth
 * failing the build over. It is wrong now: the reference points at a row
 * somebody can delete from `/staff`, and an editor tidying the media library
 * should not be able to take a page down. Every caller renders without the
 * photograph instead.
 *
 * A number means the relation was not populated — the read asked for too
 * shallow a depth — which is a bug in the query, not in the content.
 */
export function image(
  value: number | Media | null | undefined,
): Img | null {
  if (!value || typeof value === "number") return null;
  if (!value.url || !value.width || !value.height) return null;

  return {
    url: value.url,
    alt: value.alt ?? "",
    width: value.width,
    height: value.height,
  };
}

/** The file behind an upload — a PDF, usually — and how big it is. */
export function file(
  value: number | Media | null | undefined,
): { url: string; bytes: number | null } | null {
  if (!value || typeof value === "number" || !value.url) return null;
  return { url: value.url, bytes: value.filesize ?? null };
}
