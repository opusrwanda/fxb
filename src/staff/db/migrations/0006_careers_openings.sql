CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"opportunity_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(40),
	"message" text,
	"cv_filename" varchar(255),
	"cv_original_name" varchar(255),
	"cv_bytes" integer,
	"notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
--
-- Added nullable, backfilled, then constrained. Drizzle generated this as a
-- single NOT NULL add, which fails outright the moment the table has a row —
-- and it has: the openings are already published, so a straight add would take
-- the deploy down rather than the migration.
--
-- The slug is derived from the title the same way the panel derives one:
-- lowercase, anything that is not a letter or a digit collapsed to a dash,
-- ends trimmed. The id is appended because `slug` is UNIQUE and two openings
-- may legitimately share a title — "Driver", reposted next year — and a
-- migration that fails on a duplicate at 3am is worse than a slug with a
-- number on the end.
--
ALTER TABLE "opportunities" ADD COLUMN "slug" varchar(255);--> statement-breakpoint
UPDATE "opportunities" SET "slug" = trim(both '-' from regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g')) || '-' || "id" WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "employment" text;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_slug_unique" UNIQUE("slug");