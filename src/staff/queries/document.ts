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
 * The editor is a textarea for now — one blank line between paragraphs — and
 * this is what turns that into the tree. It deliberately produces the same
 * shape a real Lexical editor would, so the day one is wired in, everything
 * written before it stays readable and nothing needs converting.
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

/** The reverse, for putting an existing document back in the textarea. */
export function richTextToParagraphs(data: RichText | null | undefined): string {
  if (!data?.root?.children) return "";
  return data.root.children
    .map((node) =>
      (node.children ?? []).map((child) => child.text ?? "").join(""),
    )
    .filter((line) => line.trim().length > 0)
    .join("\n\n");
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
      return paragraphsToRichText(String(raw ?? ""));

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

export async function saveDocument(
  collection: Key,
  id: number | null,
  form: FormData,
): Promise<SaveResult> {
  const definitions = fields[collection] ?? [];
  const values: Record<string, unknown> = {};

  for (const field of definitions) {
    // Media rows are created by uploading, not by this form; their filename and
    // dimensions are not editable and must not be nulled by a save.
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
    // A unique slug collision is the one an editor actually hits, and the raw
    // Postgres text is not something to put in front of them.
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("duplicate key")) {
      return { ok: false, error: "That web address is already in use." };
    }
    return { ok: false, error: message };
  }
}

export async function deleteDocument(collection: Key, id: number) {
  const table = tableFor(collection);
  await db.delete(table as never).where(eq(table.id, id as never));
  bust(collection);
}
