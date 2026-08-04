import { asc, eq } from "drizzle-orm";

import {
  board,
  db,
  media,
  news,
  opportunities,
  partners,
  programmes,
  publications,
  stories,
} from "../db";
import type { RichText } from "../db/schema";
import { fields } from "../fields";
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
  stories,
  programmes,
  publications,
  board,
  partners,
  opportunities,
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

    case "upload": {
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

export async function saveDocument(
  collection: Key,
  id: number | null,
  form: FormData,
): Promise<SaveResult> {
  const definitions = fields[collection] ?? [];
  const values: Record<string, unknown> = {};

  for (const field of definitions) {
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

export async function deleteDocument(collection: Key, id: number) {
  const table = tableFor(collection);
  await db.delete(table as never).where(eq(table.id, id as never));
  bust(collection);
}
