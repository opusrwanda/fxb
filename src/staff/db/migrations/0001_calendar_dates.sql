-- Publication dates become calendar dates.
--
-- These were `timestamptz`, and every one of them was a day early on the site.
-- The seed wrote "2025-07-09", Postgres read it as midnight in the server's own
-- zone and stored 2025-07-08 22:00 UTC, and a site that formats in UTC printed
-- the 8th.
--
-- The USING clause is the whole point of hand-writing this. A bare
-- `SET DATA TYPE date` converts using whatever TimeZone the session happens to
-- have, which is the same ambiguity that caused the problem — run it in UTC and
-- every date shifts back a day permanently, with no way to tell afterwards that
-- it happened. Africa/Kigali is the zone these were written in (+02, no DST),
-- so converting through it recovers the day that was meant.
--
ALTER TABLE "news"
  ALTER COLUMN "date" SET DATA TYPE date
  USING ("date" AT TIME ZONE 'Africa/Kigali')::date;
--> statement-breakpoint
ALTER TABLE "stories"
  ALTER COLUMN "date" SET DATA TYPE date
  USING ("date" AT TIME ZONE 'Africa/Kigali')::date;
--> statement-breakpoint
ALTER TABLE "publications"
  ALTER COLUMN "date" SET DATA TYPE date
  USING ("date" AT TIME ZONE 'Africa/Kigali')::date;
--> statement-breakpoint
ALTER TABLE "opportunities"
  ALTER COLUMN "closes_at" SET DATA TYPE date
  USING ("closes_at" AT TIME ZONE 'Africa/Kigali')::date;
