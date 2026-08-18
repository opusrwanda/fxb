import { asc, desc, eq, sql } from "drizzle-orm";

import {
  areas,
  board,
  db,
  media,
  milestones,
  pageHeaders,
  news,
  opportunities,
  partners,
  programmes,
  publications,
  stories,
} from "../db";
import type { Status } from "../db/schema";

/**
 * What a listing shows, per collection.
 *
 * Explicit rather than generated from the schema. A generated table shows every
 * column, which is how an admin ends up with `created_at` next to `id` next to
 * `photo_id` — technically the contents of the row and useless for finding the
 * thing you came for. Each list below answers "which four facts tell these
 * apart", which is a judgement, not a reflection of the table.
 */

export type Cell =
  | { kind: "title"; value: string }
  | { kind: "text"; value: string }
  | { kind: "muted"; value: string }
  | { kind: "date"; value: string }
  | { kind: "status"; value: Status }
  | { kind: "pill"; value: string }
  | { kind: "thumb"; url: string | null; alt: string };

export type Row = { id: number; cells: Cell[] };
export type Listing = { columns: string[]; rows: Row[] };

/** Human labels for the stored values, so a listing never shows a slug. */
const PUBLICATION_CATEGORIES: Record<string, string> = {
  "annual-report": "Annual Report",
  "project-report": "Project Report",
  policy: "Policy",
  brochure: "Brochure",
  newsletter: "Newsletter",
};

const PARTNER_CATEGORIES: Record<string, string> = {
  development: "Development Partner",
  government: "Government",
  donor: "Donor",
  corporate: "Corporate",
};

const listings: Record<string, () => Promise<Listing>> = {
  async news() {
    const rows = await db.select().from(news).orderBy(desc(news.date));
    return {
      columns: ["Title", "Date", "Language", "Status"],
      rows: rows.map((row) => ({
        id: row.id,
        cells: [
          { kind: "title", value: row.title },
          { kind: "date", value: row.date },
          { kind: "muted", value: row.language === "fr" ? "French" : "English" },
          { kind: "status", value: row.status },
        ],
      })),
    };
  },

  async milestones() {
    const rows = await db
      .select({ id: milestones.id, year: milestones.year, body: milestones.body,
                order: milestones.order, filename: media.filename })
      .from(milestones)
      .leftJoin(media, eq(milestones.imageId, media.id))
      .orderBy(asc(milestones.order));
    return {
      columns: ["Year", "What happened", "Photograph"],
      rows: rows.map((row) => ({
        id: row.id,
        cells: [
          { kind: "title" as const, value: row.year },
          { kind: "muted" as const, value: row.body.slice(0, 70) + (row.body.length > 70 ? "…" : "") },
          { kind: "muted" as const, value: row.filename ?? "Year panel" },
        ],
      })),
    };
  },

  async pageHeaders() {
    const rows = await db
      .select({ id: pageHeaders.id, path: pageHeaders.path, filename: media.filename })
      .from(pageHeaders)
      .leftJoin(media, eq(pageHeaders.imageId, media.id))
      .orderBy(pageHeaders.path);
    return {
      columns: ["Page", "Photograph"],
      rows: rows.map((row) => ({
        id: row.id,
        cells: [
          {
            kind: "title" as const,
            value: row.path === "*" ? "Default — every other page" : row.path,
          },
          {
            kind: "muted" as const,
            value: row.filename ?? "No image set",
          },
        ],
      })),
    };
  },

  async stories() {
    const rows = await db.select().from(stories).orderBy(desc(stories.date));
    return {
      columns: ["Title", "Date", "Status"],
      rows: rows.map((row) => ({
        id: row.id,
        cells: [
          { kind: "title", value: row.title },
          { kind: "date", value: row.date },
          { kind: "status", value: row.status },
        ],
      })),
    };
  },

  async programmes() {
    const rows = await db
      .select()
      .from(programmes)
      .orderBy(sql`${programmes.order} asc nulls last`, asc(programmes.name));

    return {
      columns: ["Name", "Stage", "Districts", "Status"],
      rows: rows.map((row) => ({
        id: row.id,
        cells: [
          { kind: "title", value: row.name },
          {
            kind: "pill",
            value: row.stage === "phased-out" ? "Phased out" : "Running",
          },
          {
            // The count, not the list. Five district names is a paragraph in a
            // table cell, and the number is what tells two programmes apart at
            // a glance.
            kind: "muted",
            value: `${row.districts.length} district${row.districts.length === 1 ? "" : "s"}`,
          },
          { kind: "status", value: row.status },
        ],
      })),
    };
  },

  async publications() {
    const rows = await db
      .select()
      .from(publications)
      .orderBy(desc(publications.date));

    return {
      columns: ["Title", "Category", "Date", "Status"],
      rows: rows.map((row) => ({
        id: row.id,
        cells: [
          { kind: "title", value: row.title },
          { kind: "pill", value: PUBLICATION_CATEGORIES[row.category] ?? row.category },
          { kind: "date", value: row.date },
          { kind: "status", value: row.status },
        ],
      })),
    };
  },

  async areas() {
    const rows = await db
      .select({
        id: areas.id,
        title: areas.title,
        category: areas.category,
        focus: areas.focus,
        order: areas.order,
      })
      .from(areas)
      .orderBy(asc(areas.category), asc(areas.order));

    return {
      columns: ["Name", "Category", "Focus areas", "Order"],
      rows: rows.map((row) => ({
        id: row.id,
        cells: [
          { kind: "title" as const, value: row.title },
          {
            kind: "pill" as const,
            value: row.category === "core" ? "Core" : "Other",
          },
          {
            kind: "muted" as const,
            value:
              row.focus.length === 0
                ? "—"
                : `${row.focus.length} listed`,
          },
          { kind: "muted" as const, value: String(row.order) },
        ],
      })),
    };
  },

  async board() {
    const rows = await db.select().from(board).orderBy(asc(board.order));
    return {
      columns: ["Name", "Role", "Order"],
      rows: rows.map((row) => ({
        id: row.id,
        cells: [
          { kind: "title", value: row.name },
          { kind: "text", value: row.role },
          { kind: "muted", value: String(row.order) },
        ],
      })),
    };
  },

  async partners() {
    const rows = await db.select().from(partners).orderBy(asc(partners.name));
    return {
      columns: ["Name", "Category", "Website"],
      rows: rows.map((row) => ({
        id: row.id,
        cells: [
          { kind: "title", value: row.name },
          { kind: "pill", value: PARTNER_CATEGORIES[row.category] ?? row.category },
          { kind: "muted", value: row.url ?? "—" },
        ],
      })),
    };
  },

  async opportunities() {
    const rows = await db
      .select()
      .from(opportunities)
      .orderBy(asc(opportunities.closesAt));

    return {
      columns: ["Title", "Kind", "Closes", "Status"],
      rows: rows.map((row) => ({
        id: row.id,
        cells: [
          { kind: "title", value: row.title },
          {
            kind: "pill",
            value: row.kind === "procurement" ? "Procurement" : "Vacancy",
          },
          { kind: "date", value: row.closesAt },
          { kind: "status", value: row.status },
        ],
      })),
    };
  },

  async media() {
    const rows = await db.select().from(media).orderBy(desc(media.createdAt));
    return {
      columns: ["", "File", "Description", "Size"],
      rows: rows.map((row) => ({
        id: row.id,
        cells: [
          {
            kind: "thumb",
            // The generated thumbnail where there is one — sending a 4MB camera
            // file to draw at 40px is what makes a media library crawl.
            url: row.sizes?.thumbnail?.url ?? row.url,
            alt: row.alt,
          },
          { kind: "title", value: row.filename },
          { kind: "muted", value: row.alt },
          {
            kind: "muted",
            value:
              row.width && row.height
                ? `${row.width}×${row.height}`
                : row.mimeType.replace("application/", ""),
          },
        ],
      })),
    };
  },
};

export async function getListing(collection: string): Promise<Listing | null> {
  const read = listings[collection];
  return read ? read() : null;
}
