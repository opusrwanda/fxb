CREATE TABLE "page_headers" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" varchar(120) NOT NULL,
	"image_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_headers_path_unique" UNIQUE("path")
);
--> statement-breakpoint
ALTER TABLE "page_headers" ADD CONSTRAINT "page_headers_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;