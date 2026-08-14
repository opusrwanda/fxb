ALTER TABLE "programmes" ADD COLUMN "objectives" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "results" jsonb DEFAULT '[]'::jsonb NOT NULL;