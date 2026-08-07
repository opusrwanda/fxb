import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  date,
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

/**
 * ── A note on dates ───────────────────────────────────────────────────────
 *
 * Publication dates are `date`, not `timestamp`. An article is published on a
 * day, not at an instant, and storing a day as an instant is how it moves.
 *
 * It had already moved. The seed wrote "2025-07-09", Postgres read it as
 * midnight in the server's own zone, and stored 2025-07-08 22:00 UTC — so a
 * site that formats in UTC, as this one does to keep server and client
 * agreeing, printed the 8th. Every date on the site was a day early.
 *
 * A `date` column has no time and no zone, so there is nothing to convert and
 * nothing to get wrong. It comes back as "2025-07-09" and is formatted as
 * written.
 */

/* ── Publishing ───────────────────────────────────────────────────────────── */

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: jsonb("body").$type<RichText>(),
  date: date("date", { mode: "string" }).notNull(),
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
  date: date("date", { mode: "string" }).notNull(),
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
  /**
   * The programme this one sits under, or null for a top-level programme.
   *
   * FXBVillage is not one project — it is the model, delivered as a series of
   * them, each in its own place and with its own partner: Mageragere in
   * Nyarugenge, the one run with The Light Foundation, and whichever starts
   * next. They were a single row, so the site could name the model but never
   * the projects inside it, and adding October's would have meant either
   * editing the name of an existing row or losing the grouping.
   *
   * A self-reference rather than a separate table: a sub-programme is a
   * programme. It has districts, a funder, a period and a photograph like any
   * other, and everything that already reads this table — the map, the
   * listings, the counts — keeps working without knowing about the hierarchy.
   */
  parentId: integer("parent_id").references((): AnyPgColumn => programmes.id, {
    onDelete: "set null",
  }),
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
  date: date("date", { mode: "string" }).notNull(),
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

/**
 * A milestone on the Our Story timeline.
 *
 * `year` is text, not a number: the last one reads "Today", and a timeline that
 * ends on a date rather than on the present tense is a timeline that needs
 * editing every January.
 *
 * `current` marks that final entry so it can be set apart. A flag rather than
 * "whichever sorts last", because the two are not the same thing — an entry
 * added out of order should not silently become the present.
 */
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  year: varchar("year", { length: 40 }).notNull(),
  body: text("body").notNull(),
  imageId: integer("image_id").references(() => media.id, { onDelete: "set null" }),
  order: integer("order").notNull().default(0),
  current: boolean("current").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * The photograph behind a page's opening block.
 *
 * Keyed by route rather than by a foreign key to a page, because the pages this
 * covers are files rather than documents — Contact, Careers, Procurement and
 * the listings are all hand-built routes with no row of their own anywhere.
 * `path` is what joins the two.
 *
 * The row with path `*` is the fallback, used by any page that has not been
 * given one of its own. That is what keeps this from being sixteen rows the
 * team has to fill in before the feature does anything: set the default once
 * and every page header has a photograph, then override the handful that
 * deserve their own.
 */
export const pageHeaders = pgTable("page_headers", {
  id: serial("id").primaryKey(),
  /** A route such as `/contact`, or `*` for the site-wide default. */
  path: varchar("path", { length: 120 }).notNull().unique(),
  imageId: integer("image_id").references(() => media.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  /** career | procurement */
  kind: varchar("kind", { length: 20 }).notNull(),
  /** The site stops showing it the day after this. */
  closesAt: date("closes_at", { mode: "string" }).notNull(),
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
  /**
   * Optional because rows written before the values moved in here do not carry
   * it. `getSiteDetails()` falls back to the list in the content brief rather
   * than rendering the section empty.
   */
  values?: string[];
  socials: { platform: string; url: string }[];
  externalSystems: { label: string; url: string }[];
};

/**
 * The guiding values as the content brief lists them, in its order.
 *
 * A fallback and a form default, not the source — the values are edited in Site
 * details. It exists because the field arrived after the global did, so a row
 * saved before then carries no `values` key, and five words is a better answer
 * to that than an empty band on Who We Are. The 6 August 2026 revision of the
 * brief added Accountability and Creativity and Innovation to the first three.
 */
export const DEFAULT_VALUES = [
  "Integrity",
  "Teamwork",
  "Honesty",
  "Accountability",
  "Creativity and Innovation",
];

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

/* ── The mailing list ─────────────────────────────────────────────────────── */

/**
 * Somebody who has asked to hear from FXB Rwanda.
 *
 * `consentAt` is the point of this table. Under Rwanda's data protection law —
 * and under GDPR for the European donors on this list — a subscription without
 * a recorded moment of consent is not a subscription, and "we think they signed
 * up at some point" is not a defence. It is stamped when they tick the box and
 * never overwritten.
 *
 * Unsubscribing sets the status rather than deleting the row. A deleted address
 * can be re-imported from an old spreadsheet by somebody meaning well; a row
 * that says "unsubscribed" cannot be signed up again by accident.
 */
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 200 }),
  /** subscribed | unsubscribed | bounced */
  status: varchar("status", { length: 20 }).notNull().default("subscribed"),
  /** Where they came from: footer, signup, manual, import. */
  source: varchar("source", { length: 20 }).notNull().default("footer"),
  /** When they consented. Never overwritten — it is the legal record. */
  consentAt: timestamp("consent_at", { withTimezone: true }),
  /**
   * Secret in the unsubscribe link.
   *
   * A random token rather than the address, so an unsubscribe URL cannot be
   * guessed for somebody else and one leaked link exposes only one person.
   */
  unsubscribeToken: varchar("unsubscribe_token", { length: 64 }).notNull().unique(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One email to the list.
 *
 * Called a campaign rather than a newsletter because the site already has
 * newsletters — the quarterly PDFs in Publications — and two different things
 * sharing a name in the same panel is how somebody attaches a report to an
 * email blast by mistake.
 */
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  /** The grey line after the subject in an inbox. Worth writing; often is not. */
  preheader: text("preheader"),
  body: jsonb("body").$type<RichText>(),
  /** draft | sending | sent */
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  /** How many it actually reached, filled in as it sends. */
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per person per campaign.
 *
 * The reason this exists rather than a counter: when a send fails halfway —
 * and with Gmail's daily cap it will — this is what says who already has it.
 * Resuming without it would mean either sending the whole list twice or
 * guessing where it stopped.
 */
export const campaignSends = pgTable("campaign_sends", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  subscriberId: integer("subscriber_id")
    .notNull()
    .references(() => subscribers.id, { onDelete: "cascade" }),
  /** sent | failed */
  status: varchar("status", { length: 20 }).notNull(),
  error: text("error"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});
