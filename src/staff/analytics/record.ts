import { createHash, randomBytes } from "node:crypto";
import { eq, lt, sql } from "drizzle-orm";

import { analyticsSalts, db } from "../db";

/**
 * Writing down that a page was opened.
 *
 * Everything that decides *whether* to count something is here, in one file, so
 * that "why is that number what it is" has one place to be answered. The panel
 * reads; this writes; nothing else touches the table.
 *
 * The rules, in short:
 *
 *   · A hit is counted once the page has actually rendered in a browser, which
 *     is why the signal comes from a script and not from the server. A server
 *     count would include Next's own prefetching — the browser fetches a page
 *     when a link merely comes near the pointer — and the top of the "most
 *     read" list would be whatever the header links to.
 *   · Bots are dropped by user agent. Most never run the script at all; the
 *     ones that do announce themselves, and are taken at their word.
 *   · The same person reloading is counted once per half minute.
 *   · No cookie is set and no address is stored. See `analyticsSalts`.
 *
 * Nothing here is allowed to fail loudly. A page that renders and a hit that
 * goes unrecorded is a small loss; a page that errors because the analytics
 * table is locked is a broken website, so every path out of `record` swallows.
 */

/**
 * Rwanda, for every boundary in this system.
 *
 * A "day" in these figures is a day in Kigali — both for the chart and for the
 * nightly rotation of the visitor secret. Counting in UTC would end each day at
 * two in the morning local time, which splits an evening's readers across two
 * columns of the chart and gives half of them two visitor hashes.
 */
export const TZ = "Africa/Kigali";

/** `YYYY-MM-DD` in Kigali. `en-CA` is the locale that formats a date that way. */
const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function kigaliDay(at: Date = new Date()): string {
  return dayFormat.format(at);
}

/**
 * Anything that is not a page somebody chose to read.
 *
 * The panel, the API, the file route and Next's own assets. `/media` is absent
 * on purpose: a PDF off that route is a download, and downloads are the point
 * of half the publications on the site.
 */
const IGNORED = ["/staff", "/api", "/_next", "/favicon", "/robots", "/sitemap"];

/**
 * Callers of themselves.
 *
 * Every automated client that has ever been polite enough to say so. Missing
 * one costs an inflated view count and nothing else, which is the right way for
 * this list to fail — the alternative, guessing that a real visitor is a robot,
 * loses a reader from the figures with nobody able to tell it happened.
 */
const BOT =
  /bot|crawl|spider|slurp|search|fetch|monitor|uptime|preview|scrape|headless|lighthouse|pagespeed|curl|wget|python|axios|okhttp|java\/|go-http|libwww|httpclient|facebookexternalhit|whatsapp|telegram|semrush|ahrefs|mj12|dotbot|petal|bytespider|gptbot|claudebot|ccbot|perplexity/i;

const TABLET = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i;
const MOBILE = /mobi|iphone|ipod|android|blackberry|iemobile|opera mini/i;

export type Device = "mobile" | "tablet" | "desktop";

/**
 * Which kind of screen, from the user agent.
 *
 * Three buckets, because three is what the answer changes anything for: if most
 * of the traffic is on a phone then the photographs need to be smaller and the
 * tables need to scroll, and that decision does not get better for knowing the
 * exact model.
 *
 * Tablet is tested before mobile: an iPad's user agent contains neither "mobi"
 * nor "iphone", but an Android tablet's contains "android", which the mobile
 * pattern would otherwise claim.
 */
export function deviceFrom(userAgent: string | null): Device {
  if (!userAgent) return "desktop";
  if (TABLET.test(userAgent)) return "tablet";
  if (MOBILE.test(userAgent)) return "mobile";
  return "desktop";
}

/**
 * The path, reduced to the thing worth counting.
 *
 * Query strings go: `?utm_source=…` on the end of a link would otherwise split
 * one page into a dozen rows in the "most read" list, which is exactly the list
 * a campaign link is most likely to be pointing at. A trailing slash goes for
 * the same reason — `/about` and `/about/` are one page to a reader.
 */
function cleanPath(raw: string): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/")) return null;

  const path = raw.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path.length > 512) return null;
  if (IGNORED.some((prefix) => path.startsWith(prefix))) return null;

  return path;
}

/**
 * The referring site, as a bare host, or null for "came here directly".
 *
 * Our own pages are null too: a visitor moving from the home page to a story
 * did not arrive from anywhere, and counting fxb.opus.rw as a referrer would
 * put it at the top of the list every time and say nothing.
 */
function referrerHost(referrer: string | null | undefined, self: string | null): string | null {
  if (!referrer) return null;

  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    if (!host || host === "localhost") return null;
    if (self && host === self.toLowerCase().replace(/^www\./, "")) return null;
    return host.slice(0, 255);
  } catch {
    return null;
  }
}

/**
 * Today's secret, made once and remembered.
 *
 * Held in a module variable so this costs one query a day per process rather
 * than one per visit. Two processes racing at midnight both try to insert;
 * `on conflict do nothing` means the loser's row is discarded and the read that
 * follows gives both of them the same secret, so a visitor does not get two
 * hashes for having arrived during the changeover.
 *
 * The delete is the half that matters. Yesterday's secret is kept briefly —
 * long enough that a slow request started before midnight can still finish —
 * and then it is gone, and with it any way of connecting an old row to an
 * address. Anonymity that depends on a stored key is not anonymity.
 */
let held: { day: string; salt: string } | null = null;

async function saltFor(day: string): Promise<string> {
  if (held?.day === day) return held.salt;

  const fresh = randomBytes(16).toString("hex");
  await db.insert(analyticsSalts).values({ day, salt: fresh }).onConflictDoNothing();

  const [row] = await db
    .select({ salt: analyticsSalts.salt })
    .from(analyticsSalts)
    .where(eq(analyticsSalts.day, day));

  const salt = row?.salt ?? fresh;
  held = { day, salt };

  const cutoff = new Date(`${day}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 2);
  await db
    .delete(analyticsSalts)
    .where(lt(analyticsSalts.day, cutoff.toISOString().slice(0, 10)));

  return salt;
}

/**
 * Who this is, for today only.
 *
 * Address and browser, hashed with a secret that will not exist next week. 128
 * bits of the digest is kept, which is far more than enough to keep a few
 * thousand people a day apart.
 */
async function visitorHash(ip: string, userAgent: string, day: string): Promise<string> {
  const salt = await saltFor(day);
  return createHash("sha256")
    .update(`${salt}:${ip}:${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

/** The address, from whatever the proxy in front of us called it. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export type Hit = {
  path: string;
  kind?: "view" | "download";
  /** `document.referrer` as the browser reports it, or the request's own. */
  referrer?: string | null;
  headers: Headers;
};

/**
 * Count it, unless it should not be counted.
 *
 * Returns nothing in every case, including the failures. Callers are a route
 * handler and a file download, and neither has anything useful to do about an
 * analytics write that did not happen.
 */
export async function record(hit: Hit): Promise<void> {
  try {
    const path = cleanPath(hit.path);
    if (!path) return;

    const userAgent = hit.headers.get("user-agent");
    if (!userAgent || BOT.test(userAgent)) return;

    const day = kigaliDay();
    const kind = hit.kind ?? "view";
    const visitor = await visitorHash(clientIp(hit.headers), userAgent, day);

    /**
     * One statement, and it decides for itself whether to write.
     *
     * A reload, a back button, and React re-running an effect in development
     * all produce a second hit for a page somebody opened once. Half a minute
     * of quiet per visitor per page removes all three without touching the
     * case that matters — somebody reading a story, going back to the list,
     * and opening it again an hour later is two genuine views.
     *
     * Doing it as `insert … where not exists` rather than a select and then an
     * insert keeps it to a single round trip, and means two requests arriving
     * together cannot both find nothing and both write.
     */
    await db.execute(sql`
      insert into page_views (path, kind, referrer_host, device, visitor)
      select ${path}, ${kind}, ${referrerHost(hit.referrer, hit.headers.get("host"))},
             ${deviceFrom(userAgent)}, ${visitor}
      where not exists (
        select 1 from page_views
         where visitor = ${visitor}
           and path = ${path}
           and kind = ${kind}
           and created_at > now() - interval '30 seconds'
      )
    `);
  } catch (error) {
    // Never the visitor's problem, and never the page's. Logged so that a
    // table that has stopped accepting writes is findable in pm2's log rather
    // than showing up as a chart that quietly went flat.
    console.error("[analytics] could not record a hit", error);
  }
}
