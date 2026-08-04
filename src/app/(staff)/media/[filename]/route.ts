import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

/**
 * Serve an uploaded file.
 *
 * The media library keeps the row and the bytes in different places: the row is
 * in Postgres, the file is on disk under `./media`. This is what joins them
 * back up for a browser.
 *
 * Served from `/media/…` rather than `/staff/media/…`, because the panel routes
 * every collection at `/staff/<collection>/<id>` — and `/staff/media/1` would
 * then mean both "edit media row 1" and "serve the file named 1". The more
 * specific route wins in Next, so the edit page silently 404'd. Files are not
 * part of the panel's namespace and should never have been inside it.
 *
 * The filename is taken apart and reassembled with `path.basename` before it
 * touches the filesystem. Without that, a request for
 * `..%2F..%2F.env.local` would be a request for the environment file — path
 * traversal is the entire risk surface of a route like this one, and it is
 * closed by refusing to accept anything that is not a bare filename.
 */
const MEDIA_DIR = path.resolve(process.cwd(), "media");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename: raw } = await params;
  const filename = path.basename(decodeURIComponent(raw));
  const file = path.join(MEDIA_DIR, filename);

  // Belt and braces: even with basename applied, the resolved path must still
  // sit inside the media directory.
  if (!file.startsWith(MEDIA_DIR + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  let size: number;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error("not a file");
    size = stats.size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const type =
    CONTENT_TYPES[path.extname(filename).toLowerCase()] ??
    "application/octet-stream";

  const stream = Readable.toWeb(
    createReadStream(file),
  ) as unknown as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(size),
      // Uploads are immutable in practice: replacing a photograph creates a new
      // row with a new filename rather than overwriting the bytes, so this can
      // be cached hard. next/image sits in front of it for images anyway.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
