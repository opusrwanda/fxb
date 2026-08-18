import { unlink } from "node:fs/promises";
import path from "node:path";

import { asc, eq, isNull } from "drizzle-orm";

import {
  areas,
  board,
  db,
  media,
  milestones,
  news,
  opportunities,
  pageHeaders,
  partners,
  programmes,
  publications,
  stories,
} from "../db";
import type { RichText, Status } from "../db/schema";
import type { StaffUser } from "../auth/session";
import {
  accessTo,
  canDeleteDocument,
  canEditDocument,
  isAdmin,
  statusesFor,
} from "../auth/permissions";
import { fields } from "../fields";
import { createMedia } from "./upload";
import { bust } from "@/cms/revalidate";

/**
 * Reading and writing one document.
 *
 * The tables are looked up by name and the columns by the field definitions, so
 * this is eight collections' worth of editing in one file rather than eight
 * near-identical handlers that drift.
 */

const TABLES = {
  news,
  areas,
  stories,
  programmes,
  publications,
  board,
  partners,
  opportunities,
  pageHeaders,
  milestones,
  media,
} as const;

type Key = keyof typeof TABLES;

export const isCollection = (key: string): key is Key => key in TABLES;

/**
 * The table, as something the query builder will accept.
 *
 * Drizzle types a query against the specific table it is given, and here the
 * table is chosen at runtime from a string. That is genuinely outside what the
 * builder can check, so the escape hatch is declared once, in one place, rather
 * than as a cast at every call site — the rest of the file then reads as
 * ordinary code.
 */
type AnyTable = {
  id: never;
};

const tableFor = (collection: Key) =>
  TABLES[collection] as unknown as AnyTable;

export async function getDocument(
  collection: Key,
  id: number,
): Promise<Record<string, unknown> | null> {
  const table = tableFor(collection);
  const rows = await db
    .select()
    .from(table as never)
    .where(eq(table.id, id as never))
    .limit(1);

  return (rows[0] as Record<string, unknown> | undefined) ?? null;
}

/**
 * Everything that can be picked as a parent programme.
 *
 * Top-level programmes only: a sub-programme cannot itself have children, which
 * keeps the hierarchy one level deep. Two levels would be a tree, and a tree
 * needs a navigation to match — this is a model with projects under it.
 */
export async function getParentOptions(excludeId: number | null) {
  const rows = await db
    .select({ id: programmes.id, name: programmes.name })
    .from(programmes)
    .where(isNull(programmes.parentId))
    .orderBy(asc(programmes.name));

  return rows.filter((row) => row.id !== excludeId);
}

/** Everything that can be picked in an upload field. */
export async function getMediaOptions() {
  return db
    .select({
      id: media.id,
      filename: media.filename,
      alt: media.alt,
      mimeType: media.mimeType,
      url: media.url,
      thumb: media.sizes,
    })
    .from(media)
    .orderBy(asc(media.filename));
}

/**
 * Plain paragraphs, as the Lexical document the database stores.
 *
 * The editor writes Lexical's JSON directly, so this is the fallback path: text
 * pasted into the field by anything that is not the editor — a script, an older
 * form — still arrives as a document the site can render rather than as a
 * string nothing knows how to display.
 */
export function paragraphsToRichText(text: string): RichText | null {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: paragraphs.map((paragraph) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        children: [
          {
            type: "text",
            text: paragraph,
            format: 0,
            style: "",
            detail: 0,
            mode: "normal",
            version: 1,
          },
        ],
      })),
    },
  };
}

/**
 * What the form sent, as a stored document.
 *
 * The editor posts Lexical's own JSON. Anything else — a paste into a plain
 * textarea, an older form, a script — is treated as paragraphs separated by
 * blank lines, so no route into this field can produce something the site
 * cannot render.
 */
export function parseRichText(raw: string): RichText | null {
  const text = raw.trim();
  if (text === "") return null;

  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as RichText;
      // An empty editor still serialises to a root with one empty paragraph.
      // Storing that would make `isEmpty` false and print a blank line on the
      // site, so it is normalised back to null.
      const children = parsed?.root?.children ?? [];
      const hasText = JSON.stringify(children).includes('"text":"');
      return hasText ? parsed : null;
    } catch {
      // Not JSON after all — fall through and treat it as plain text.
    }
  }

  return paragraphsToRichText(text);
}

/** The reverse, for putting an existing document back in the editor. */
export function richTextToEditorJson(data: RichText | null | undefined): string {
  if (!data?.root?.children?.length) return "";
  return JSON.stringify(data);
}

/** A form value, converted to what the column expects. */
function coerce(
  field: { name: string; type: string },
  form: FormData,
): unknown {
  const raw = form.get(field.name);

  switch (field.type) {
    case "checkbox":
      // An unchecked box sends nothing at all, which is why this cannot just
      // read the value.
      return form.get(field.name) === "on";

    case "number": {
      const value = String(raw ?? "").trim();
      return value === "" ? null : Number(value);
    }

    case "upload":
    // A parent is an id chosen from a list, exactly like an upload.
    case "parent": {
      const value = String(raw ?? "").trim();
      return value === "" ? null : Number(value);
    }

    case "multiselect":
      return form.getAll(field.name).map(String);

    case "list":
      return String(raw ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    case "richtext":
      return parseRichText(String(raw ?? ""));

    case "date": {
      const value = String(raw ?? "").trim();
      // An <input type="date"> already gives "YYYY-MM-DD", which is exactly
      // what the column wants — no Date object goes anywhere near it.
      return value === "" ? null : value;
    }

    default: {
      const value = String(raw ?? "").trim();
      return value === "" ? null : value;
    }
  }
}

export type SaveResult = { ok: true; id: number } | { ok: false; error: string };

/**
 * What to tell the editor when the database refuses a write.
 *
 * Never the raw error. Drizzle wraps a failure as "Failed query: insert into
 * …" with every parameter appended, so putting `error.message` on the screen
 * shows somebody a page of SQL and their own content quoted back at them — and
 * tells them nothing about what to change.
 *
 * The useful part is Postgres' `code`, and it is on the *cause*, not the error
 * Drizzle threw, so the chain has to be walked. The real message is logged for
 * us; the editor gets a sentence about what to do.
 */
function readableError(error: unknown): string {
  let current: unknown = error;

  for (let depth = 0; current && depth < 5; depth += 1) {
    const code = (current as { code?: string }).code;
    const constraint = (current as { constraint?: string }).constraint;

    if (code === "23505") {
      return constraint?.includes("slug")
        ? "That web address is already in use. Try a different one."
        : "One of these values is already used by another entry.";
    }
    if (code === "23503") return "That refers to something that has been deleted.";
    if (code === "23502") return "Something required was left empty.";
    if (code === "22001") return "One of the values is too long.";

    current = (current as { cause?: unknown }).cause;
  }

  return "Could not save. Please check the fields and try again.";
}

/**
 * The collections that record who wrote the document.
 *
 * Only the ones an editor may write. There is no point recording an author on
 * a board member or a page banner: those are admin-only, and an author column
 * exists to answer "is this yours", which for an admin is always yes.
 */
const AUTHORED = new Set<Key>(["news", "stories", "publications", "media"]);

/** Who wrote it, for the collections that know. Null everywhere else. */
export async function authorOf(
  collection: Key,
  id: number,
): Promise<number | null> {
  if (!AUTHORED.has(collection)) return null;

  const table = tableFor(collection) as unknown as { id: never; authorId: never };
  const rows = await db
    .select({ authorId: table.authorId })
    .from(tableFor(collection) as never)
    .where(eq(table.id, id as never))
    .limit(1);

  return (rows[0] as { authorId: number | null } | undefined)?.authorId ?? null;
}

export async function saveDocument(
  collection: Key,
  id: number | null,
  form: FormData,
  actor: StaffUser,
): Promise<SaveResult> {
  /**
   * The permission check, on the server, at the write.
   *
   * Not in the page that renders the form. A server action is an endpoint, and
   * an endpoint that is only ever called by a form somebody can see is still an
   * endpoint anybody signed in can call. The form decides what is offered; this
   * decides what happens.
   */
  if (accessTo(actor, collection) !== "write") {
    return { ok: false, error: "You do not have permission to change this." };
  }

  if (id !== null) {
    const owner = await authorOf(collection, id);
    if (!canEditDocument(actor, collection, owner)) {
      return {
        ok: false,
        error:
          "This was written by somebody else. Ask an admin if it needs changing.",
      };
    }
  }

  /**
   * The status has to be one that exists, and one this person may set.
   *
   * A select posts whatever the browser sends, which is whatever the page
   * offered — and pages can be replayed. An admin may set any of the three,
   * including `in_review`, because leaving a submitted document at that status
   * while correcting a typo in it is a thing an admin does. An editor is held
   * to the list their own form offered.
   */
  const submitted = form.get("status");
  if (typeof submitted === "string" && submitted) {
    const allowed: readonly string[] = isAdmin(actor)
      ? (["draft", "in_review", "published"] satisfies Status[])
      : statusesFor(actor.role);

    if (!allowed.includes(submitted)) {
      return { ok: false, error: "You cannot set that status." };
    }
  }

  const definitions = fields[collection] ?? [];
  const values: Record<string, unknown> = {};

  // Creating a media row is an upload, not an insert.
  //
  // Everything below writes form values into columns, and `filename`,
  // `mimeType`, `filesize`, `width`, `height`, `url` and `sizes` are not form
  // values — they are facts about bytes that have to be written to disk and
  // measured first. Until this existed, `media` was the one collection whose
  // "New file" button could not succeed: the form collected a description and
  // a credit, and the insert failed on a NOT NULL filename.
  //
  // `createMedia` does the whole job and returns the row, so this hands off
  // rather than merging its results back into the loop below.
  const upload = definitions.some((field) => field.type === "file")
    ? form.get("file")
    : null;

  if (id === null && upload instanceof File && upload.size > 0) {
    // `createMedia` itself takes an empty description, because the picker
    // uploads without stopping to ask for one. This form is the other route —
    // the one whose whole job is describing a file — so it holds the field to
    // its `required`, which the loop below would otherwise never reach.
    for (const field of definitions) {
      if (field.type === "file" || !field.required) continue;
      if (!String(form.get(field.name) ?? "").trim()) {
        return { ok: false, error: `${field.label} is required.` };
      }
    }

    const result = await createMedia(
      upload,
      String(form.get("alt") ?? ""),
      String(form.get("credit") ?? ""),
      actor.id,
    );
    return result.ok ? { ok: true, id: result.id } : result;
  }

  for (const field of definitions) {
    // The bytes are never a column. On an edit there is nothing to write, and
    // on a create the branch above has already returned.
    if (field.type === "file") continue;

    // A field the form did not send is left alone rather than written as null.
    // Two reasons: a column like `language` is NOT NULL with a default, so
    // nulling it fails outright; and a form that renders a subset of the fields
    // should edit that subset, not blank the rest. Media rows are the case in
    // point — their filename and dimensions come from the upload, never from
    // this form.
    //
    // The exceptions are the two controls that say "nothing" by being absent: an
    // unchecked checkbox and a group of checkboxes with none ticked both send
    // no value at all, and both genuinely mean false and empty.
    const alwaysWrite = field.type === "checkbox" || field.type === "multiselect";
    if (!alwaysWrite && !form.has(field.name)) continue;

    values[field.name] = coerce(field, form);
  }

  // The slug is derived, never asked for.
  //
  // Every collection with a page used to carry a "Web address" field: required,
  // in the sidebar, with a sentence about hyphens and a warning that changing
  // it breaks links. It made somebody writing a news item settle a question
  // about URL syntax before they could save, and the answer was always the
  // title with dashes in it.
  //
  // ON CREATE ONLY, and that is the important half. A published page's address
  // is a promise: it is in search results, in emails, in whatever anybody has
  // bookmarked. Re-deriving it when a headline is corrected would move the page
  // and break all of them silently, from an edit that looked like fixing a
  // typo. So the slug is set once and left alone.
  if (id === null && SLUGGED.has(collection)) {
    const source = String(
      form.get("title") ?? form.get("name") ?? "",
    ).trim();
    values.slug = await uniqueSlug(collection, source);
  }

  // On a create, a null means "let the column decide", not "write null".
  //
  // An optional `select` renders an empty option and posts an empty string
  // when nobody touches it, which `coerce` turns into null. For a nullable
  // column that is correct. For `language` — NOT NULL with a default of "en" —
  // it is an insert that Postgres refuses, and the panel could only report it
  // as "Something required was left empty" about a field the writer had left
  // alone on purpose. Creating a news item failed this way every time.
  //
  // Only on create. An edit must still be able to write null, or a value that
  // has been cleared could never be cleared.
  if (id === null) {
    for (const [name, value] of Object.entries(values)) {
      if (value === null) delete values[name];
    }
  }

  for (const field of definitions) {
    if (!field.required) continue;
    const value = values[field.name];
    const missing =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value === "") ||
      (Array.isArray(value) && value.length === 0);
    if (missing) return { ok: false, error: `${field.label} is required.` };
  }

  values.updatedAt = new Date();

  // Whoever creates it owns it, and ownership never moves on an edit — an
  // admin correcting an editor's typo must not quietly become the author and
  // take the document away from the person who wrote it.
  if (id === null && AUTHORED.has(collection)) values.authorId = actor.id;

  const table = tableFor(collection);

  try {
    if (id === null) {
      const [created] = await db
        .insert(table as never)
        .values(values as never)
        .returning({ id: table.id });
      bust(collection);
      return { ok: true, id: (created as { id: number }).id };
    }

    await db
      .update(table as never)
      .set(values as never)
      .where(eq(table.id, id as never));

    bust(collection);
    return { ok: true, id };
  } catch (error) {
    console.error(`[staff] save failed for ${collection}`, error);
    return { ok: false, error: readableError(error) };
  }
}

/** The collections whose table has a slug column. */
const SLUGGED = new Set<Key>([
  "areas",
  "news",
  "stories",
  "programmes",
  "publications",
  "opportunities",
]);

/**
 * A title, as a URL segment.
 *
 * NFKD first so "résilience" decomposes and the accents fall out as combining
 * marks rather than the whole word being stripped — without it an accented
 * French headline can slug down to almost nothing.
 */
function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

/**
 * The slug, with a number on the end if it is already taken.
 *
 * `slug` is UNIQUE on every one of these tables, and two documents may
 * legitimately share a title — "Driver", reposted next year; two newsletters
 * both called "Q3". Without this the second one fails the insert with a
 * constraint error, which `readableError` can only report as "one of these
 * values is already used by another entry" for a field the writer cannot see
 * and did not fill in.
 */
async function uniqueSlug(collection: Key, source: string): Promise<string> {
  const base = slugify(source) || collection;
  const table = tableFor(collection) as unknown as { slug: never };

  const taken = new Set(
    (
      await db
        .select({ slug: table.slug })
        .from(tableFor(collection) as never)
    ).map((row) => (row as { slug: string }).slug),
  );

  if (!taken.has(base)) return base;

  for (let n = 2; n < 500; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }

  // Five hundred documents sharing one title is not a real state, but a slug
  // that cannot be generated must not become a slug that is silently blank.
  return `${base}-${Date.now()}`;
}

export async function deleteDocument(
  collection: Key,
  id: number,
  actor: StaffUser,
): Promise<{ ok: boolean; error?: string }> {
  // The same reasoning as the check in `saveDocument`, and more load-bearing:
  // a delete here is immediate and total, so the one place it must be right is
  // the server.
  if (!canDeleteDocument(actor, collection, await authorOf(collection, id))) {
    return {
      ok: false,
      error:
        collection === "media"
          ? "Somebody else uploaded this file. Ask an admin to remove it."
          : "Only an admin can delete this. To take it off the website, set it back to draft.",
    };
  }

  // Deleting a media row leaves its bytes behind unless somebody removes them,
  // and nothing else ever will — the filename only exists in the row that is
  // about to go. Read it first, delete the row, then unlink. In that order: a
  // file removed before a failed delete would leave a row pointing at nothing,
  // which is the worse of the two halves to be left holding.
  const files =
    collection === "media" ? await mediaFilesFor(id) : [];

  const table = tableFor(collection);
  await db.delete(table as never).where(eq(table.id, id as never));
  bust(collection);

  for (const name of files) {
    await unlink(path.join(process.cwd(), "media", path.basename(name))).catch(
      // Already gone, or never written. The row is what mattered.
      () => {},
    );
  }

  return { ok: true };
}

/** The original and every rendition belonging to one media row. */
async function mediaFilesFor(id: number): Promise<string[]> {
  const [row] = await db
    .select({ filename: media.filename, sizes: media.sizes })
    .from(media)
    .where(eq(media.id, id));

  if (!row) return [];

  const renditions = Object.values(row.sizes ?? {})
    .map((size) => (size as { filename?: string }).filename)
    .filter((name): name is string => Boolean(name));

  return [row.filename, ...renditions];
}
