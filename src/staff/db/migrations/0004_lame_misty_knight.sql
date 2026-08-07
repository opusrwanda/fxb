CREATE TABLE "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" varchar(40) NOT NULL,
	"body" text NOT NULL,
	"image_id" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;