import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";

import { db, media } from "../db";
import type { MediaSize } from "../db/schema";
import { bust } from "@/cms/revalidate";

/**
 * Putting a file into the library.
 *
 * The library had a table, a picker and a route that serves the bytes, and no
 * way to put anything in it: every row came from the Payload migration, the
 * media form collected a description and a credit, and `filename` is NOT NULL —
 * so "New file" could not succeed. This is the missing half.
 *
 * Bytes on disk under `./media`, row in Postgres, joined by `/media/<filename>`
 * — the arrangement `app/(staff)/media/[filename]/route.ts` already documents.
 * Nothing here changes where files live; it only writes what was previously
 * only ever read.
 *
 * NOTE ON DEPLOYS: `media/` is gitignored and excluded from the deploy rsync,
 * which is what stops a deploy from wiping uploads — and also means a file
 * uploaded on a laptop does not exist on the server, and vice versa. Uploading
 * through the live panel is the only way to put a file on the live site. That
 * is a property of local-disk storage, not of this function; `docs/cms.md`
 * tracks moving the library to Bunny.
 */

/** What a browser is allowed to hand us. */
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
};

/**
 * 25MB.
 *
 * Generous for a photograph off a phone and mean for anything that should not
 * be here. The real limit is the field staff on a district connection who have
 * to wait for the upload; a 25MB original at 1Mbps is three and a half minutes.
 */
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * The renditions, and why these three.
 *
 * They match the names already in the table — `thumbnail`, `card`, `wide` —
 * because `MediaPicker` reads exactly those keys, in that order, to find
 * something small enough to put in a grid tile. A row uploaded with an empty
 * `sizes` still works (the picker falls through to the original), but it makes
 * the panel pull a 4MB photograph into a 150px box, forty at a time.
 *
 * Only ever down. A rendition wider than the original would be an upscale,
 * which costs bytes to invent detail that is not there.
 */
const RENDITIONS = [
  { name: "thumbnail", width: 400 },
  { name: "card", width: 1024 },
  { name: "wide", width: 1600 },
];

const MEDIA_DIR = path.resolve(process.cwd(), "media");

/**
 * A filename that is safe to put in a URL and cannot collide.
 *
 * The original name is kept — recognisably, because somebody looking at a list
 * of 163 files needs to know which one they just added — but stripped to
 * lowercase alphanumerics and dashes, and given a short random suffix.
 *
 * The suffix is not decoration. `filename` is UNIQUE, so two people uploading
 * `photo.jpg` from two districts would collide on the second insert, and
 * without it the second upload would also have overwritten the first one's
 * bytes on disk before the database ever refused it.
 */
function safeName(original: string, extension: string): string {
  const base = path
    .basename(original, path.extname(original))
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${base || "file"}-${randomBytes(4).toString("hex")}${extension}`;
}

export type UploadResult =
  | { ok: true; id: number; filename: string; url: string; mimeType: string; sizes: Record<string, MediaSize> }
  | { ok: false; error: string };

/**
 * Write a file to the library and return the row.
 *
 * Every failure is a sentence somebody can act on. The panel is used by people
 * who did not choose this stack and cannot be asked to read a stack trace.
 */
export async function createMedia(
  file: File,
  alt: string,
  credit?: string | null,
): Promise<UploadResult> {
  if (!file || file.size === 0) return { ok: false, error: "Choose a file to upload." };
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 25MB — try exporting it smaller.`,
    };
  }

  const extension = ALLOWED[file.type];
  if (!extension) {
    return {
      ok: false,
      error: "That file type is not accepted. Upload a JPG, PNG, WebP, AVIF, GIF, SVG or PDF.",
    };
  }

  const description = alt.trim();
  if (!description) {
    return {
      ok: false,
      error: "Describe what is in the file, so people using a screen reader know what it shows.",
    };
  }

  const filename = safeName(file.name, extension);
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(path.join(MEDIA_DIR, filename), buffer);

  let width: number | null = null;
  let height: number | null = null;
  const sizes: Record<string, MediaSize> = {};

  // A PDF has no pixels, and sharp does not read SVG dimensions reliably
  // enough to store as truth. Both are stored as originals with no renditions,
  // which is exactly what the picker's fallback is for.
  const raster = file.type.startsWith("image/") && file.type !== "image/svg+xml";

  if (raster) {
    try {
      const image = sharp(buffer, { animated: file.type === "image/gif" });
      const meta = await image.metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;

      for (const rendition of RENDITIONS) {
        if (!width || width <= rendition.width) continue;

        const name = `${path.basename(filename, extension)}-${rendition.width}.webp`;
        const output = await sharp(buffer)
          .resize({ width: rendition.width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer({ resolveWithObject: true });

        await writeFile(path.join(MEDIA_DIR, name), output.data);
        sizes[rendition.name] = {
          url: `/media/${name}`,
          width: output.info.width,
          height: output.info.height,
          filename: name,
        };
      }
    } catch {
      // A file that sharp cannot read is still a file worth keeping: the
      // original is already on disk and the row still serves it. Losing the
      // renditions costs bandwidth, not the upload.
    }
  }

  try {
    const [row] = await db
      .insert(media)
      .values({
        filename,
        alt: description,
        credit: credit?.trim() || null,
        mimeType: file.type,
        filesize: file.size,
        width,
        height,
        url: `/media/${filename}`,
        sizes,
      })
      .returning({ id: media.id });

    // Anything already rendering a picture from the library is now out of date
    // — including the picker's own option list, which is fetched on the server.
    bust("media");

    return { ok: true, id: row.id, filename, url: `/media/${filename}`, mimeType: file.type, sizes };
  } catch (error) {
    console.error("[media] insert failed", error);
    return { ok: false, error: "The file was saved but could not be recorded. Try again." };
  }
}
