import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { currentUser } from "@/staff/auth/session";
import { applications, db } from "@/staff/db";
import { cvPath } from "@/staff/queries/applications";

/**
 * Download a candidate's CV.
 *
 * The counterpart to `/media/[filename]`, and deliberately not it. That route
 * serves the media library to anyone who asks, which is correct for a
 * photograph on a public page and would be indefensible here: a CV carries a
 * name, an address, a phone number and an employment history, and a public URL
 * for one needs only to be guessed to be a disclosure.
 *
 * So the file is addressed by the application's id rather than by its
 * filename, the session is checked before anything is read, and the stored
 * name — random bytes, never anything the candidate typed — is looked up from
 * the row rather than taken from the URL. There is no string in this request
 * that reaches the filesystem.
 *
 * `Content-Disposition: attachment` with the candidate's own filename, so it
 * saves as "Jean Uwase CV.pdf" rather than as thirty-two hex characters, and
 * so a browser cannot be talked into rendering a Word document inline.
 */
const TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id)) return new NextResponse("Not found", { status: 404 });

  const [row] = await db
    .select({
      filename: applications.cvFilename,
      originalName: applications.cvOriginalName,
    })
    .from(applications)
    .where(eq(applications.id, id));

  if (!row?.filename) return new NextResponse("Not found", { status: 404 });

  const file = cvPath(row.filename);
  if (!file) return new NextResponse("Not found", { status: 404 });

  let size: number;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error("not a file");
    size = stats.size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";

  // Quoted, and quotes stripped from the name itself — a filename with a `"`
  // in it would otherwise end the header value early.
  const download = (row.originalName ?? row.filename).replace(/["\\]/g, "");

  const stream = Readable.toWeb(createReadStream(file)) as unknown as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="${download}"`,
      // Never cached anywhere. A CV behind a session must not sit in a shared
      // cache or on disk after somebody signs out.
      "Cache-Control": "private, no-store",
    },
  });
}
