CREATE TABLE "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(200) NOT NULL,
	"blurb" text,
	"category" varchar(20) DEFAULT 'core' NOT NULL,
	"focus" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"icon" varchar(80),
	"image_id" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
/*
  The four areas as the site already shows them.

  Seeded rather than left to the team to retype, because this is not a new
  feature with no content — it is four cards that have been on the page since
  launch, moving out of `src/lib/areas.ts` and into something they can edit.
  An empty table here would have taken the Areas of Intervention band and the
  home page's pillars off the site until somebody typed them back in.

  All four are seeded as core, which is what the page says today. Moving one to
  "other" is now a field, and it is FXB's call rather than this migration's.

  The photograph is looked up by filename in the media library. A missing file
  leaves the row with no picture instead of failing the migration — the areas
  matter more than their illustrations, and a photograph is a field somebody
  can set in a moment.
*/
INSERT INTO "areas" ("title", "slug", "blurb", "category", "focus", "icon", "image_id", "order") VALUES
  (
    'Socio-Economic Strengthening',
    'socio-economic-strengthening',
    'Savings groups, startup capital and enterprise',
    'core',
    '["Entrepreneurship, VSLA savings groups & startup capital","Family resilience & violence prevention","Climate adaptation & environmental conservation"]'::jsonb,
    'socio-economic-strengthening',
    (SELECT "id" FROM "media" WHERE "filename" = 'fxbvillage-tlf-10.jpg' LIMIT 1),
    1
  ),
  (
    'ECD & Education',
    'ecd-education',
    'Early childhood, school support and vocational training',
    'core',
    '["School support & scholastic materials","Vocational & youth training","Positive parenting & early stimulation"]'::jsonb,
    'ecd-education',
    (SELECT "id" FROM "media" WHERE "filename" = 'fxbvillage-mageragere-01.jpg' LIMIT 1),
    2
  ),
  (
    'Health',
    'health',
    'HIV care, nutrition, maternal health and WASH',
    'core',
    '["HIV testing, counselling & prevention (incl. DREAMS)","Health insurance enrolment & referrals","Nutrition, maternal & child health, WASH infrastructure"]'::jsonb,
    'health',
    (SELECT "id" FROM "media" WHERE "filename" = 'fxbvillage-musambira-03.jpg' LIMIT 1),
    3
  ),
  (
    'Herbal Medicine',
    'herbal-medicine',
    'Traditional practice, cultivated and applied',
    'core',
    '[]'::jsonb,
    'herbal-medicine',
    (SELECT "id" FROM "media" WHERE "filename" = 'fostering-06.jpg' LIMIT 1),
    4
  )
ON CONFLICT ("slug") DO NOTHING;
