import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { after, NextResponse } from "next/server";

import { record } from "@/staff/analytics/record";

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
  request: Request,
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

  const extension = path.extname(filename).toLowerCase();
  const type = CONTENT_TYPES[extension] ?? "application/octet-stream";

  /**
   * A downloaded document is counted here and nowhere else.
   *
   * The site's page counter is a script in the browser, and a PDF never runs
   * one — it opens in the viewer, or lands in a downloads folder, and as far as
   * the website is concerned nothing happened. Yet "how many people took the
   * annual report" is one of the few numbers FXB reports upwards, so the count
   * has to be taken at the only place that sees it: here, as the bytes go out.
   *
   * Documents only. Photographs go through this route too — every image on the
   * site is a request to it — and counting those would bury the reports under
   * fifty logos and say nothing about anybody's reading.
   *
   * `after` so the file starts sending immediately and the row is written
   * behind it. A download should never wait on a count.
   */
  if (extension === ".pdf") {
    after(() =>
      record({
        path: `/media/${filename}`,
        kind: "download",
        referrer: request.headers.get("referer"),
        headers: request.headers,
      }),
    );
  }

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
