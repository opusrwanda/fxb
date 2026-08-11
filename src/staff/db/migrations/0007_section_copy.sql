CREATE TABLE "sections" (
	"key" varchar(160) PRIMARY KEY NOT NULL,
	"eyebrow" text,
	"heading" text,
	"body" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
