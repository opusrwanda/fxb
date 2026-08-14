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

/**
 * Where a document is in its life. The site reads only what is published.
 *
 * `in_review` is an editor saying "I have finished this, an admin should look
 * before it goes out" — it is not a different kind of draft to the database or
 * to the website, both of which treat anything that is not `published` as not
 * there. It exists so the panel can tell the difference between something
 * somebody is still writing and something waiting on a person.
 */
export type Status = "draft" | "in_review" | "published";

/**
 * What somebody may do once they are signed in.
 *
 * `admin` runs the site: everything, including the settings and the mailing
 * list. `editor` writes for it — their own news, stories, publications and
 * newsletters, and the library they need to illustrate them. Everything else
 * they can read and not change.
 *
 * Two roles and not a permissions matrix, still. The matrix lives in
 * `src/staff/auth/permissions.ts` as code, so the answer to "may this person do
 * this" is one function rather than a table of checkboxes somebody has to keep
 * correct.
 */
export type Role = "admin" | "editor";

/* ── People who can sign in ───────────────────────────────────────────────── */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  /** scrypt, as `salt:hash`. See `src/staff/auth/password.ts`. */
  passwordHash: text("password_hash").notNull(),
  /**
   * `admin` or `editor`. See the `Role` type above for what each one means.
   *
   * The default is `editor`, which is the safe direction for a column to fall
   * back to: a row written by something that has forgotten to set a role gets
   * the smaller set of permissions, not the larger one.
   */
  role: varchar("role", { length: 20 }).notNull().default("editor").$type<Role>(),
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

/**
 * A sign-in halfway through.
 *
 * The password is the first step and this is the second: a six-digit code sent
 * to the address on the account, which has to come back before a session
 * exists. That is what makes a stolen or reused password not enough on its own
 * — and passwords here are chosen by a colleague and passed on somehow, so
 * "reused" is the realistic case rather than the paranoid one.
 *
 * A row of its own rather than a field on the session, because there is no
 * session yet. Nothing about this row grants access; it is a question waiting
 * for an answer, and the cookie the browser holds is only its id.
 *
 * THE CODE IS HASHED, like a password. It is short-lived and only six digits,
 * but it is a credential while it lives, and a database that anybody can read
 * a live code out of is one where the second step is decoration.
 */
export const loginCodes = pgTable("login_codes", {
  /** 32 random bytes, hex. This is what the pending-sign-in cookie carries. */
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** scrypt, as `salt:hash` — the same format and the same function as a password. */
  codeHash: text("code_hash").notNull(),
  /**
   * Wrong guesses so far.
   *
   * Six digits is a million possibilities, which sounds ample and is not: a
   * script can try them all in an afternoon if nothing stops it. Five attempts
   * and the row is spent, so the code has to be guessed in five rather than in
   * a million.
   */
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  /** Set when the code has been used, so it cannot be replayed. */
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
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
  /**
   * Who uploaded it. Null for everything that predates the column.
   *
   * An editor may delete a file they put there and not one somebody else did,
   * which is the only reason this is recorded. `set null` rather than cascade:
   * a photograph outlives the colleague who uploaded it, and losing the row
   * would break every page using the picture.
   */
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
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
  /**
   * Who wrote it. Null for everything written before the column existed.
   *
   * An editor may edit their own work and read everybody else's; an admin may
   * edit anything. That is the whole use of this column, and it is why null
   * means admin-only rather than "anyone": the documents already in the
   * database have no author, and guessing one would hand an editor the right
   * to rewrite years of published news on the strength of a default.
   */
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
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
  /** Who wrote it. See `news.authorId`. */
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
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
  /** Who added it. See `news.authorId`. */
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
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
  /**
   * The URL segment, so an opening has a page of its own.
   *
   * It had none: every vacancy was printed in full on the Careers listing, so
   * there was nothing to link to, nothing to send somebody, and nothing for a
   * search engine to index as a job. A candidate could not bookmark the
   * position they were applying for.
   */
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: text("title").notNull(),
  /** career | procurement */
  kind: varchar("kind", { length: 20 }).notNull(),
  /** The site stops showing it the day after this. */
  closesAt: date("closes_at", { mode: "string" }).notNull(),
  location: text("location"),
  /** e.g. Full-time, Consultancy, Internship. Shown as a tag. */
  employment: text("employment"),
  /** One or two lines for the listing card, above the full description. */
  summary: text("summary"),
  body: jsonb("body").$type<RichText>(),
  documentId: integer("document_id").references(() => media.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("draft").$type<Status>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A message from the contact form.
 *
 * Stored as well as emailed, for the same reason applications are: a form that
 * hands somebody's message to an SMTP server and keeps no copy loses it the
 * day the mailbox refuses one, and the sender has no way of knowing. The row
 * is the record; the email is the notification.
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  subject: text("subject"),
  message: text("message").notNull(),
  /** Whether the notification email actually left. */
  notified: boolean("notified").notNull().default(false),
  /** Marked in the panel once somebody has replied. */
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * An application against an opening.
 *
 * Stored, not only emailed. A form that hands a person's application to an
 * SMTP server and keeps no copy loses it the day the mailbox rejects a 4MB
 * attachment or somebody archives the thread — and the applicant has no way of
 * knowing. The row is the record; the email is the notification.
 *
 * The CV lives outside the media library on purpose. `media/` is served by an
 * unauthenticated route at `/media/<filename>`, and a candidate's CV — name,
 * address, phone, employment history — has no business at a public URL that
 * needs only to be guessed. Uploads land in `applications/` instead, which
 * nothing serves, and reach staff through an authenticated download.
 */
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  /** The covering letter, as typed. Plain text — this is not a rich field. */
  message: text("message"),
  /** On disk under `applications/`. Null when no CV was attached. */
  cvFilename: varchar("cv_filename", { length: 255 }),
  /** What the candidate called it, for the download. */
  cvOriginalName: varchar("cv_original_name", { length: 255 }),
  cvBytes: integer("cv_bytes"),
  /** Whether the notification email actually left. */
  notified: boolean("notified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Editable section copy.
 *
 * One row per section that the team is allowed to reword — a page header, a
 * band on the home page — holding only what has been changed. A null column
 * means "use what the code ships", so the site still has a complete, sensible
 * set of words with an empty table, and resetting a section is deleting a row
 * rather than remembering what it used to say.
 *
 * Keyed by a string rather than a serial id because the key is written in the
 * code that reads it: `header:/contact`, `home:what-we-do`. An id would mean
 * the panel and the components agreeing on a number nobody can see.
 */
export const sections = pgTable("sections", {
  key: varchar("key", { length: 160 }).primaryKey(),
  /** The small tracked-capitals line above the heading. */
  eyebrow: text("eyebrow"),
  heading: text("heading"),
  /** The paragraph under it, where the section has one. */
  body: text("body"),
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
 * The strip across the top of the home page.
 *
 * For the weeks when something is running that the whole site should lead
 * with — Kwibuka, a fundraising appeal — and nothing the rest of the year.
 *
 * A picture and a link, and deliberately nothing else. FXB's campaigns arrive
 * as artwork already made for the poster and the Instagram post, so a banner
 * that let somebody retype the words in a text field would be a second version
 * of a message that already exists, drifting from the first.
 *
 * `until` is a date the banner stops showing by itself. It is optional and it
 * is the field that stops a Kwibuka strip still being up in June: a banner
 * comes down when somebody remembers, and the whole point of a banner is that
 * it is up during a week when everybody is busy.
 */
export type PromoBannerData = {
  enabled: boolean;
  /** A row in `media`. The image's own `alt` is what a screen reader reads. */
  imageId: number | null;
  /** Where it goes when clicked. Internal path or full URL. */
  href: string;
  /** ISO date, or null to run until switched off. Inclusive — the last day it shows. */
  until: string | null;
  /**
   * How tall the strip is.
   *
   * A setting rather than one number in the stylesheet, because how tall a
   * banner should be is a judgement about the artwork rather than a fact about
   * the site: a wordmark and a date read fine in a thin band, and a strip with
   * a photograph and a headline in it needs the room. Three sizes rather than
   * a pixel field — a free number is a way to make the home page look wrong,
   * and every value in between these is one somebody would have to justify.
   */
  height: PromoBannerHeight;
};

export type PromoBannerHeight = "short" | "medium" | "tall";

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
/** One story module in a newsletter. Every field is optional but the headline. */
export type CampaignStory = {
  eyebrow?: string;
  imageUrl?: string;
  headline?: string;
  excerpt?: string;
  url?: string;
  quote?: string;
  quoteAuthor?: string;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  videoTitle?: string;
  photoAUrl?: string;
  photoBUrl?: string;
  bannerHeadline?: string;
  bannerSubtext?: string;
  bannerCtaLabel?: string;
  bannerCtaUrl?: string;
};

export type CampaignContent = {
  /** Two or three sentences setting up the edition, under the greeting. */
  intro?: string;
  stories?: CampaignStory[];
  galleryTitle?: string;
  galleryImages?: string[];
  /** The impact band, filled from the site's own figures. */
  showStats?: boolean;
  /** "More From FXB Rwanda" — the two most recent news items. */
  showNews?: boolean;
};

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  /** The grey line after the subject in an inbox. Worth writing; often is not. */
  preheader: text("preheader"),
  /** e.g. "Quarterly Newsletter". Printed over the headline with the date. */
  edition: text("edition"),
  /** The photograph across the top, under the logo. */
  heroId: integer("hero_id").references(() => media.id, { onDelete: "set null" }),
  /**
   * The newsletter, as the template lays it out.
   *
   * The template is not a letter with formatting — it is a structure: an
   * intro, then repeating story modules each bundling a photograph, a
   * headline, an excerpt, a testimonial, a video, a pair of photographs and
   * its own call-to-action banner, then a gallery and the closing blocks. So
   * the campaign stores that structure rather than a rich-text body, and the
   * renderer assembles the template from it.
   *
   * `body` is kept for the campaigns written before this existed.
   */
  content: jsonb("content").$type<CampaignContent>(),
  body: jsonb("body").$type<RichText>(),
  /** Who wrote it. See `news.authorId`. */
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  /**
   * draft | in_review | sending | sent
   *
   * `in_review` is an editor handing a finished newsletter to an admin, since
   * sending is the one thing in this panel an editor cannot do. Without it the
   * handover happens over WhatsApp and the admin has to be told which draft.
   */
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
