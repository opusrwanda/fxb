import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * The database, as we define it.
 *
 * Deliberately not the shape Payload left behind. Payload spreads one document
 * across several tables — `programmes`, `programmes_districts`,
 * `programmes_components`, plus a `_programmes_v` mirror for versions — because
 * it has to build a schema for field types it has never seen. We know exactly
 * what these documents are, so a repeated list of strings is a `jsonb` column
 * and a programme is one row.
 *
 * That trade is worth stating plainly: `jsonb` cannot be joined on or
 * constrained by a foreign key. For the districts on a programme that costs us
 * nothing — nothing queries "every programme in Huye" from SQL; the site loads
 * six programmes and indexes them in memory. Anything that genuinely is a
 * relation — a photograph, an uploaded file — is a real integer reference with
 * a real foreign key.
 *
 * Every content table carries `status`, and `updatedAt` is maintained by the
 * writes rather than a trigger, so the column means "when a person last saved
 * this" rather than "when a migration last touched the row".
 */

/** Draft or published. The site reads only what is published. */
export type Status = "draft" | "published";

/* ── People who can sign in ───────────────────────────────────────────────── */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  /** scrypt, as `salt:hash`. See `src/staff/auth/password.ts`. */
  passwordHash: text("password_hash").notNull(),
  /**
   * `admin` can manage other people; `editor` can do everything else.
   *
   * Two roles rather than a permissions matrix. A matrix is what you build when
   * you do not know who the users are; this is one communications team, and the
   * only question they actually have is who is allowed to add a colleague.
   */
  role: varchar("role", { length: 20 }).notNull().default("editor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Signed-in sessions.
 *
 * A row per session rather than a self-contained JWT, because a row can be
 * deleted. Signing someone out — or out of every device, when a laptop goes
 * missing — has to be something the database can do, and a JWT stays valid
 * until it expires no matter what we would prefer.
 */
export const sessions = pgTable("sessions", {
  /** 32 random bytes, hex. This is what the cookie carries. */
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── The media library ────────────────────────────────────────────────────── */

/** One generated rendition of an image. */
export type MediaSize = {
  width: number;
  height: number;
  filename: string;
  url: string;
};

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull().unique(),
  /**
   * Required, and not bureaucracy. This site photographs vulnerable
   * households; a screen reader user gets nothing at all from a photograph
   * with no description, and the person best placed to write one is whoever
   * just chose the picture.
   */
  alt: text("alt").notNull(),
  credit: text("credit"),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  filesize: integer("filesize").notNull(),
  /** Null for a PDF, which has no pixels. */
  width: integer("width"),
  height: integer("height"),
  /** Where the original is served from. */
  url: text("url").notNull(),
  /** The generated renditions, keyed by name: thumbnail, card, wide. */
  sizes: jsonb("sizes").$type<Record<string, MediaSize>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Rich text ────────────────────────────────────────────────────────────── */

/**
 * A Lexical document, as stored.
 *
 * Kept in Lexical's own JSON rather than HTML on purpose: HTML in a database is
 * a security problem you have to keep solving, and it welds the content to one
 * way of rendering it. The tree says "this is a heading", and the site decides
 * what a heading looks like.
 */
export type RichText = {
  root: {
    type: "root";
    children: RichTextNode[];
    direction: "ltr" | "rtl" | null;
    format: string;
    indent: number;
    version: number;
  };
};

export type RichTextNode = {
  type: string;
  version: number;
  children?: RichTextNode[];
  text?: string;
  format?: number | string;
  [key: string]: unknown;
};

/* ── Publishing ───────────────────────────────────────────────────────────── */

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: jsonb("body").$type<RichText>(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  /**
   * BCP 47. FXB Rwanda publishes in English and French, and a French headline
   * needs marking so a screen reader switches voice rather than reading it as
   * mangled English.
   */
  language: varchar("language", { length: 5 }).notNull().default("en"),
  photoId: integer("photo_id").references(() => media.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("draft").$type<Status>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: jsonb("body").$type<RichText>(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  photoId: integer("photo_id").references(() => media.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("draft").$type<Status>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const programmes = pgTable("programmes", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: text("name").notNull(),
  /**
   * `current` or `phased-out`. Named stage rather than status so it cannot be
   * confused with the draft/published one — they answer different questions and
   * both being called "status" is how an editor picks the wrong one.
   */
  stage: varchar("stage", { length: 20 }).notNull().default("current"),
  /** Lower numbers first. Null sorts to the end, then by name. */
  order: integer("order"),
  /** District names, matching `src/lib/districts.ts` — the map matches on them. */
  districts: jsonb("districts").$type<string[]>().notNull().default([]),
  photoId: integer("photo_id").references(() => media.id, { onDelete: "set null" }),
  summary: text("summary"),
  body: jsonb("body").$type<RichText>(),
  /** What the programme delivers, in its own words. */
  components: jsonb("components").$type<string[]>().notNull().default([]),
  runs: text("runs"),
  funder: text("funder"),
  externalUrl: text("external_url"),
  /** Shows a notice saying FXB has not confirmed the description yet. */
  unconfirmed: boolean("unconfirmed").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default("draft").$type<Status>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const publications = pgTable("publications", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: text("title").notNull(),
  /** annual-report | project-report | policy | brochure | newsletter */
  category: varchar("category", { length: 40 }).notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  fileId: integer("file_id").references(() => media.id, { onDelete: "set null" }),
  coverId: integer("cover_id").references(() => media.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("draft").$type<Status>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── People ───────────────────────────────────────────────────────────────── */

export const board = pgTable("board", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  /** The board is listed by office, not alphabetically. Chairperson is 1. */
  order: integer("order").notNull().default(0),
  portraitId: integer("portrait_id").references(() => media.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** development | government | donor | corporate */
  category: varchar("category", { length: 40 }).notNull(),
  logoId: integer("logo_id").references(() => media.id, { onDelete: "set null" }),
  url: text("url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  /** career | procurement */
  kind: varchar("kind", { length: 20 }).notNull(),
  /** The site stops showing it the day after this. */
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  location: text("location"),
  body: jsonb("body").$type<RichText>(),
  documentId: integer("document_id").references(() => media.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("draft").$type<Status>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── The single documents ─────────────────────────────────────────────────── */

export type SiteSettingsData = {
  email: string;
  phone: string;
  phoneHref: string;
  addressLine: string;
  addressDistrict: string;
  addressCountry: string;
  officeHours: string;
  mapUrl: string;
  mapEmbedUrl: string;
  vision: string;
  visionEmphasis: string[];
  mission: string;
  socials: { platform: string; url: string }[];
  externalSystems: { label: string; url: string }[];
};

export type ImpactData = {
  figures: {
    label: string;
    /** Null where MEL has not split this figure out. Never invent one. */
    value: number | null;
    caption: string;
    areas: string[];
    photoId: number | null;
  }[];
  projectsDelivered: number;
  note: string | null;
};

/**
 * Globals — the documents a site has exactly one of.
 *
 * One table with a slug and a `jsonb` payload, rather than a table per global.
 * There is no querying across them and never will be: the site asks for "the
 * site details" by name and gets the whole thing. A table each would be two
 * migrations every time a field moves.
 */
export const globals = pgTable("globals", {
  slug: varchar("slug", { length: 60 }).primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
