ALTER TABLE "campaigns" ADD COLUMN "edition" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "hero_id" integer;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_hero_id_media_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;