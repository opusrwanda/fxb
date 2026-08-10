import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { db, applications, opportunities } from "../db";
import { desc, eq } from "drizzle-orm";

/**
 * Receiving an application.
 *
 * Two things have to be true of a form a person spends an hour on. It must not
 * lose the application, and it must tell the applicant the truth about what
 * happened. So the row is written first and the notification sent second: if
 * the mail server is down, the application is still on record and `notified`
 * says it needs chasing, and the applicant is still told it arrived — because
 * it did.
 *
 * The CV does not go into the media library. `media/` is served to anyone at
 * `/media/<filename>` with no session, and a CV carries a name, an address, a
 * phone number and an employment history. These land in `applications/`, which
 * nothing serves, and staff read them through an authenticated download.
 */

const DIR = path.resolve(process.cwd(), "applications");

/** What a CV may be. Deliberately narrow — this is not a general uploader. */
const CV_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

/** 8MB. A CV that does not fit is a CV with photographs in it. */
const MAX_CV = 8 * 1024 * 1024;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ApplyResult =
  | {
      ok: true;
      id: number;
      /** The name on disk, so the notification can attach the file. */
      cvFilename: string | null;
      /** What the candidate called it, for the attachment's own name. */
      cvOriginalName: string | null;
    }
  | { ok: false; error: string };

export type ApplyInput = {
  opportunityId: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  cv: File | null;
};

export async function createApplication(input: ApplyInput): Promise<ApplyResult> {
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const message = input.message.trim();

  if (!name) return { ok: false, error: "Please tell us your name." };
  if (!EMAIL.test(email)) {
    return { ok: false, error: "Please enter an email address we can reply to." };
  }
  if (name.length > 200) return { ok: false, error: "That name is too long." };
  if (phone.length > 40) return { ok: false, error: "That phone number is too long." };
  if (message.length > 5000) {
    return {
      ok: false,
      error: "That covering note is too long. Please keep it under 5,000 characters.",
    };
  }

  // The opening has to exist and be published. Without this the id is just a
  // number in a form field, and the table would accept applications against
  // drafts — or against anything at all, until the foreign key refused.
  const [opening] = await db
    .select({ id: opportunities.id, status: opportunities.status, closesAt: opportunities.closesAt })
    .from(opportunities)
    .where(eq(opportunities.id, input.opportunityId));

  if (!opening || opening.status !== "published") {
    return { ok: false, error: "That opening is no longer open for applications." };
  }
  if (new Date(opening.closesAt).getTime() < new Date().setHours(0, 0, 0, 0)) {
    return { ok: false, error: "Applications for this position have closed." };
  }

  let cvFilename: string | null = null;
  let cvOriginalName: string | null = null;
  let cvBytes: number | null = null;

  if (input.cv && input.cv.size > 0) {
    const extension = CV_TYPES[input.cv.type];
    if (!extension) {
      return { ok: false, error: "Attach your CV as a PDF or a Word document." };
    }
    if (input.cv.size > MAX_CV) {
      return {
        ok: false,
        error: `That file is ${(input.cv.size / 1024 / 1024).toFixed(1)}MB. Please keep your CV under 8MB.`,
      };
    }

    // Named from random bytes, not from the candidate. The stored name is
    // never shown and never derived from anything they control, so nothing
    // they type can reach the filesystem; the name they used travels in the
    // database column instead and is put back on the download.
    cvFilename = `${randomBytes(16).toString("hex")}${extension}`;
    cvOriginalName = input.cv.name.slice(0, 255);
    cvBytes = input.cv.size;

    await mkdir(DIR, { recursive: true });
    await writeFile(
      path.join(DIR, cvFilename),
      Buffer.from(await input.cv.arrayBuffer()),
    );
  }

  try {
    const [row] = await db
      .insert(applications)
      .values({
        opportunityId: input.opportunityId,
        name,
        email,
        phone: phone || null,
        message: message || null,
        cvFilename,
        cvOriginalName,
        cvBytes,
      })
      .returning({ id: applications.id });

    return { ok: true, id: row.id, cvFilename, cvOriginalName };
  } catch (error) {
    console.error("[applications] insert failed", error);
    return {
      ok: false,
      error: "We could not record your application. Please try again in a moment.",
    };
  }
}

/** Mark an application as notified, once the email has actually left. */
export async function markNotified(id: number): Promise<void> {
  await db.update(applications).set({ notified: true }).where(eq(applications.id, id));
}

/** The absolute path of a stored CV, or null if the name is not a bare file. */
export function cvPath(filename: string): string | null {
  const safe = path.basename(filename);
  const full = path.join(DIR, safe);
  // Belt and braces against a name that climbed out of the directory, even
  // though these are generated rather than supplied.
  return full.startsWith(DIR + path.sep) ? full : null;
}

/** An application, joined to the post it is for, for the panel's register. */
export type ApplicationRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  cvFilename: string | null;
  cvOriginalName: string | null;
  cvBytes: number | null;
  notified: boolean;
  createdAt: Date;
  opening: string;
  openingSlug: string;
};

/** Every application, newest first. */
export async function listApplications(): Promise<ApplicationRow[]> {
  const rows = await db
    .select({
      id: applications.id,
      name: applications.name,
      email: applications.email,
      phone: applications.phone,
      message: applications.message,
      cvFilename: applications.cvFilename,
      cvOriginalName: applications.cvOriginalName,
      cvBytes: applications.cvBytes,
      notified: applications.notified,
      createdAt: applications.createdAt,
      opening: opportunities.title,
      openingSlug: opportunities.slug,
    })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .orderBy(desc(applications.createdAt));

  return rows;
}
