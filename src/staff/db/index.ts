import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, types } from "pg";

import * as schema from "./schema";

/**
 * A `date` column is a calendar date, and stays a string.
 *
 * `node-postgres` parses DATE into a JavaScript `Date` at midnight *local*
 * time, so "2025-07-09" arrives as 2025-07-08T22:00:00Z on a +02 machine. Every
 * date on the site was then formatted in UTC and printed a day early.
 *
 * Returning the raw text is the fix, and it is the honest type: a publication
 * date has no time and no zone, so it should never become an instant that one
 * of them can move. This covers raw queries too, not just Drizzle's own
 * mapping.
 */
types.setTypeParser(types.builtins.DATE, (value) => value);

/**
 * The connection pool.
 *
 * Held on `globalThis` because Next's dev server re-evaluates modules on every
 * edit, and a fresh pool per reload exhausts Postgres' connection limit within
 * a few minutes of ordinary work. In production the module is evaluated once
 * and this is simply a module-level singleton.
 */
const globalForDb = globalThis as unknown as { pool?: Pool };

/**
 * `STAFF_DATABASE_URL` while the new panel is built alongside the old one — the
 * two schemas want the same table names, so they cannot share a database. It
 * disappears at the cutover, when `DATABASE_URL` points here and Payload's
 * database is dropped.
 */
export const connectionString =
  process.env.STAFF_DATABASE_URL || process.env.DATABASE_URL || "";

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    // Neon and Vercel Postgres both terminate idle connections themselves; a
    // small ceiling keeps a serverless deploy from opening one per invocation.
    max: 10,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });

export { schema };
export * from "./schema";
