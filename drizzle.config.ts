import { defineConfig } from "drizzle-kit";

/**
 * Migrations are generated files, checked in, and applied on deploy.
 *
 * Not `push`. Payload pushed the schema from the collection definitions in
 * development, which is convenient and is also how a deploy quietly reshapes a
 * live table. A generated migration is a diff somebody can read before it runs
 * against production.
 *
 * The URL is resolved in the same order as `src/staff/db/index.ts`, and that
 * ordering is the point. This read `DATABASE_URL` alone, which on a machine
 * still holding the old Payload database is a *different* database from the one
 * the panel reads — so `npm run db:migrate` would have applied our migrations
 * to Payload's schema. It never did, because drizzle-kit does not load
 * `.env.local` and the variable had to be passed by hand each time. That is
 * luck, not a design, and it stops being luck the day somebody adds a `.env`.
 */
export default defineConfig({
  schema: "./src/staff/db/schema.ts",
  out: "./src/staff/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.STAFF_DATABASE_URL || process.env.DATABASE_URL || "",
  },
  casing: "snake_case",
});
