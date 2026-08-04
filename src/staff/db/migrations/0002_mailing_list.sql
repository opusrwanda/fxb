CREATE TABLE "campaign_sends" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"subscriber_id" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"preheader" text,
	"body" jsonb,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp with time zone,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(200),
	"status" varchar(20) DEFAULT 'subscribed' NOT NULL,
	"source" varchar(20) DEFAULT 'footer' NOT NULL,
	"consent_at" timestamp with time zone,
	"unsubscribe_token" varchar(64) NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
ALTER TABLE "campaign_sends" ADD CONSTRAINT "campaign_sends_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_sends" ADD CONSTRAINT "campaign_sends_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;