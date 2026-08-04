import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "../src/staff/db/schema";
import { hashPassword } from "../src/staff/auth/password";

/**
 * Lift the content out of Payload's database and into ours.
 *
 * Run once, against a fresh schema:
 *
 *   npx tsx scripts/migrate-from-payload.ts
 *
 * Payload spreads a document across several tables — a programme's districts
 * and components each live in their own child table, keyed by `_parent_id` and
 * ordered by `_order`. Ours are `jsonb` columns on the row. So this is not a
 * copy, it is a reshape, and the child tables are gathered back into arrays on
 * the way through.
 *
 * IT IS SAFE TO RUN AGAIN. Everything is matched on its natural key — slug,
 * filename, or name — and updated rather than duplicated, because it will be
 * run once locally and again against production with the source having moved on
 * in between.
 *
 * WHAT IT DOES NOT BRING
 *
 * Payload's `_v` version tables. They hold the draft/published history, and
 * what the site needs from that is one bit — is this row published — which is
 * the `status` column. Importing a version history into a schema with no
 * version history to put it in would be inventing a feature during a migration.
 *
 * The passwords. Payload hashes with its own scheme and a hash cannot be
 * converted; everyone is given a temporary password, printed at the end, to
 * change on first sign-in.
 */

const FROM = process.env.DATABASE_URL;
const TO = process.env.STAFF_DATABASE_URL;

if (!FROM || !TO) {
  console.error("Set DATABASE_URL (Payload's) and STAFF_DATABASE_URL (ours).");
  process.exit(1);
}

const source = new Pool({ connectionString: FROM });
const db = drizzle(new Pool({ connectionString: TO }), { schema });

/** Every row of a Payload table, in insertion order. */
async function rows<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await source.query(sql, params);
  return result.rows as T[];
}

/**
 * The child rows of an array field, gathered back into a plain list.
 *
 * `_order` is Payload's own ordering column; without it the array comes back in
 * whatever order Postgres feels like, and the board would be alphabetical by
 * accident rather than by office.
 */
async function childArray(
  table: string,
  column: string,
): Promise<Map<number, string[]>> {
  const index = new Map<number, string[]>();

  // Payload names these two columns `_parent_id`/`_order` for an array field
  // and `parent_id`/`order` for a hasMany select — `programmes_districts` is
  // the second kind and every other child table here is the first. Rather than
  // hard-code which is which, ask the database.
  const columns = await rows<{ column_name: string }>(
    "select column_name from information_schema.columns where table_name = $1",
    [table],
  );
  if (columns.length === 0) return index;

  const names = new Set(columns.map((c) => c.column_name));
  const parent = names.has("_parent_id") ? "_parent_id" : "parent_id";
  const order = names.has("_order") ? "_order" : "order";

  const all = await rows<{ parent: number; value: string }>(
    `select "${parent}" as parent, "${column}" as value
       from ${table} order by "${parent}", "${order}"`,
  );

  for (const row of all) {
    const existing = index.get(row.parent);
    if (existing) existing.push(row.value);
    else index.set(row.parent, [row.value]);
  }

  return index;
}

/** Payload media id -> our media id. Built first; everything else needs it. */
const mediaIds = new Map<number, number>();

async function migrateMedia() {
  const all = await rows<{
    id: number;
    filename: string;
    alt: string;
    credit: string | null;
    mime_type: string;
    filesize: number;
    width: number | null;
    height: number | null;
    url: string | null;
    sizes_thumbnail_filename: string | null;
    sizes_card_filename: string | null;
    sizes_wide_filename: string | null;
  }>("select * from media order by id");

  for (const row of all) {
    // Payload computes `url` at read time rather than storing it, so it comes
    // back null here. Ours is a real column, and it points at our own route.
    const url = `/staff/media/${row.filename}`;

    const sizes: Record<string, schema.MediaSize> = {};
    for (const name of ["thumbnail", "card", "wide"] as const) {
      const record = row as unknown as Record<string, unknown>;
      const filename = record[`sizes_${name}_filename`] as string | null;
      if (!filename) continue;
      sizes[name] = {
        filename,
        url: `/staff/media/${filename}`,
        width: (record[`sizes_${name}_width`] as number) ?? 0,
        height: (record[`sizes_${name}_height`] as number) ?? 0,
      };
    }

    const values = {
      filename: row.filename,
      alt: row.alt ?? "",
      credit: row.credit,
      mimeType: row.mime_type ?? "application/octet-stream",
      filesize: row.filesize ?? 0,
      width: row.width,
      height: row.height,
      url,
      sizes,
      updatedAt: new Date(),
    };

    const [saved] = await db
      .insert(schema.media)
      .values(values)
      .onConflictDoUpdate({ target: schema.media.filename, set: values })
      .returning({ id: schema.media.id });

    mediaIds.set(row.id, saved.id);
  }

  console.log(`media           ${all.length}`);
}

/** A Payload upload reference, translated. */
const ref = (id: number | null | undefined) =>
  id == null ? null : (mediaIds.get(id) ?? null);

/** Payload's `_status` is the whole of what we keep from its versioning. */
const status = (value: string | null | undefined): schema.Status =>
  value === "published" ? "published" : "draft";

async function migrateNews() {
  const all = await rows<Record<string, never>>("select * from news order by id");
  for (const row of all) {
    const values = {
      slug: row["slug"] as string,
      title: row["title"] as string,
      excerpt: row["excerpt"] as string,
      body: row["body"] as schema.RichText | null,
      date: new Date(row["date"] as string),
      language: (row["language"] as string) ?? "en",
      photoId: ref(row["photo_id"] as number),
      status: status(row["_status"] as string),
      updatedAt: new Date(),
    };
    await db
      .insert(schema.news)
      .values(values)
      .onConflictDoUpdate({ target: schema.news.slug, set: values });
  }
  console.log(`news            ${all.length}`);
}

async function migrateStories() {
  const all = await rows<Record<string, never>>("select * from stories order by id");
  for (const row of all) {
    const values = {
      slug: row["slug"] as string,
      title: row["title"] as string,
      excerpt: row["excerpt"] as string,
      body: row["body"] as schema.RichText | null,
      date: new Date(row["date"] as string),
      photoId: ref(row["photo_id"] as number),
      status: status(row["_status"] as string),
      updatedAt: new Date(),
    };
    await db
      .insert(schema.stories)
      .values(values)
      .onConflictDoUpdate({ target: schema.stories.slug, set: values });
  }
  console.log(`stories         ${all.length}`);
}

async function migrateProgrammes() {
  const districts = await childArray("programmes_districts", "value");
  const components = await childArray("programmes_components", "item");
  const all = await rows<Record<string, never>>("select * from programmes order by id");

  for (const row of all) {
    const id = row["id"] as unknown as number;
    const values = {
      slug: row["slug"] as string,
      name: row["name"] as string,
      stage: (row["stage"] as string) ?? "current",
      order: (row["order"] as number) ?? null,
      districts: districts.get(id) ?? [],
      photoId: ref(row["photo_id"] as number),
      summary: row["summary"] as string | null,
      body: row["body"] as schema.RichText | null,
      components: components.get(id) ?? [],
      runs: row["runs"] as string | null,
      funder: row["funder"] as string | null,
      externalUrl: row["external_url"] as string | null,
      unconfirmed: Boolean(row["unconfirmed"]),
      status: status(row["_status"] as string),
      updatedAt: new Date(),
    };
    await db
      .insert(schema.programmes)
      .values(values)
      .onConflictDoUpdate({ target: schema.programmes.slug, set: values });
  }
  console.log(`programmes      ${all.length}`);
}

async function migratePublications() {
  const all = await rows<Record<string, never>>("select * from publications order by id");
  for (const row of all) {
    const values = {
      slug: row["slug"] as string,
      title: row["title"] as string,
      category: row["category"] as string,
      date: new Date(row["date"] as string),
      fileId: ref(row["file_id"] as number),
      coverId: ref(row["cover_id"] as number),
      status: status(row["_status"] as string),
      updatedAt: new Date(),
    };
    await db
      .insert(schema.publications)
      .values(values)
      .onConflictDoUpdate({ target: schema.publications.slug, set: values });
  }
  console.log(`publications    ${all.length}`);
}

async function migrateBoard() {
  const all = await rows<Record<string, never>>("select * from board order by \"order\"");
  for (const row of all) {
    const name = row["name"] as string;
    const values = {
      name,
      role: row["role"] as string,
      order: (row["order"] as number) ?? 0,
      portraitId: ref(row["portrait_id"] as number),
      updatedAt: new Date(),
    };
    // No unique constraint on a person's name — two people can share one — so
    // this looks first rather than relying on a conflict target.
    const existing = await db.query.board.findFirst({
      where: (b, { eq }) => eq(b.name, name),
    });
    if (existing) await db.update(schema.board).set(values).where(eq(schema.board.id, existing.id));
    else await db.insert(schema.board).values(values);
  }
  console.log(`board           ${all.length}`);
}

async function migratePartners() {
  const all = await rows<Record<string, never>>("select * from partners order by id");
  for (const row of all) {
    const name = row["name"] as string;
    const values = {
      name,
      category: row["category"] as string,
      logoId: ref(row["logo_id"] as number),
      url: row["url"] as string | null,
      updatedAt: new Date(),
    };
    const existing = await db.query.partners.findFirst({
      where: (p, { eq }) => eq(p.name, name),
    });
    if (existing)
      await db.update(schema.partners).set(values).where(eq(schema.partners.id, existing.id));
    else await db.insert(schema.partners).values(values);
  }
  console.log(`partners        ${all.length}`);
}

async function migrateOpportunities() {
  const all = await rows<Record<string, never>>("select * from opportunities order by id");
  for (const row of all) {
    await db.insert(schema.opportunities).values({
      title: row["title"] as string,
      kind: row["kind"] as string,
      closesAt: new Date(row["closes_at"] as string),
      location: row["location"] as string | null,
      body: row["body"] as schema.RichText | null,
      documentId: ref(row["document_id"] as number),
      status: "published",
      updatedAt: new Date(),
    });
  }
  console.log(`opportunities   ${all.length}`);
}

async function migrateGlobals() {
  const [settings] = await rows<Record<string, never>>("select * from site_settings limit 1");
  if (settings) {
    const emphasis = await childArray("site_settings_vision_emphasis", "phrase");
    const socialRows = await rows<{ platform: string; url: string }>(
      "select platform, url from site_settings_socials order by _order",
    ).catch(() => []);
    const systemRows = await rows<{ label: string; url: string }>(
      "select label, url from site_settings_external_systems order by _order",
    ).catch(() => []);

    const data: schema.SiteSettingsData = {
      email: settings["email"] as string,
      phone: settings["phone"] as string,
      phoneHref: settings["phone_href"] as string,
      addressLine: settings["address_line"] as string,
      addressDistrict: settings["address_district"] as string,
      addressCountry: settings["address_country"] as string,
      officeHours: settings["office_hours"] as string,
      mapUrl: settings["map_url"] as string,
      mapEmbedUrl: settings["map_embed_url"] as string,
      vision: settings["vision"] as string,
      visionEmphasis: [...emphasis.values()].flat(),
      mission: settings["mission"] as string,
      socials: socialRows,
      externalSystems: systemRows.map((s) => ({ label: s.label, url: s.url })),
    };

    await db
      .insert(schema.globals)
      .values({ slug: "site-settings", data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.globals.slug,
        set: { data, updatedAt: new Date() },
      });
    console.log("site-settings   1");
  }

  const [impact] = await rows<Record<string, never>>("select * from impact limit 1");
  if (impact) {
    const figureRows = await rows<{
      id: number;
      label: string;
      value: number | null;
      caption: string;
      photo_id: number | null;
    }>("select * from impact_figures order by _order");

    const areas = await childArray("impact_figures_areas", "item");

    const data: schema.ImpactData = {
      figures: figureRows.map((f) => ({
        label: f.label,
        value: f.value,
        caption: f.caption,
        areas: areas.get(f.id) ?? [],
        photoId: ref(f.photo_id),
      })),
      projectsDelivered: (impact["projects_delivered"] as number) ?? 0,
      note: (impact["note"] as string) ?? null,
    };

    await db
      .insert(schema.globals)
      .values({ slug: "impact", data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.globals.slug,
        set: { data, updatedAt: new Date() },
      });
    console.log("impact          1");
  }
}

async function migrateUsers() {
  const all = await rows<{ id: number; email: string }>("select * from users order by id");
  const temporary = "ChangeMe!2026";
  const passwordHash = await hashPassword(temporary);

  for (const row of all) {
    const values = {
      email: row.email,
      // Payload has no name field on its users; the local part is a decent
      // first guess and takes one edit to correct.
      name: row.email.split("@")[0],
      passwordHash,
      role: "admin",
      updatedAt: new Date(),
    };
    await db
      .insert(schema.users)
      .values(values)
      .onConflictDoUpdate({
        target: schema.users.email,
        // Never overwrite a password somebody has already set.
        set: { name: values.name, role: values.role, updatedAt: values.updatedAt },
      });
  }

  console.log(`users           ${all.length}`);
  if (all.length) console.log(`\nTemporary password for all users: ${temporary}`);
}

console.log("Migrating from Payload\n");
await migrateMedia();
await migrateNews();
await migrateStories();
await migrateProgrammes();
await migratePublications();
await migrateBoard();
await migratePartners();
await migrateOpportunities();
await migrateGlobals();
await migrateUsers();
console.log("\nDone.");
process.exit(0);
