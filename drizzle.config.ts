import { defineConfig } from "drizzle-kit";

/**
 * Migrations are generated files, checked in, and applied on deploy.
 *
 * Not `push`. Payload pushed the schema from the collection definitions in
 * development, which is convenient and is also how a deploy quietly reshapes a
 * live table. A generated migration is a diff somebody can read before it runs
 * against production.
 */
export default defineConfig({
  schema: "./src/staff/db/schema.ts",
  out: "./src/staff/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  casing: "snake_case",
});
