import { and, gte, inArray, lt, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import {
  applications,
  db,
  media,
  messages,
  news,
  opportunities,
  programmes,
  publications,
  stories,
  subscribers,
} from "../db";
import { TZ } from "../analytics/record";

/**
 * The questions the analytics page asks.
 *
 * All of it is aggregation over one table, so it is written as SQL rather than
 * through the query builder: `count(*) filter (where …)` in a single pass is
 * the difference between one round trip and four, and Drizzle's builder has no
 * spelling for a filtered aggregate or for `generate_series`.
 *
 * Nothing here is cached. The rest of the site's reads are, because the content
 * changes a few times a month and the pages are public — but this is one admin
 * looking at today's figures, and a cached answer would be a chart that does not
 * move when you reload it, which is the one thing that would make somebody stop
 * trusting the page.
 *
 * DAYS ARE KIGALI DAYS throughout. `date_trunc` on a UTC timestamp would cut
 * each day at two in the morning local time and split every evening's readers
 * across two columns.
 */

/** The ranges the page offers, in days. */
export const RANGES = [7, 30, 90, 365] as const;
export type Range = (typeof RANGES)[number];

export function rangeFrom(value: string | undefined): Range {
  const days = Number(value);
  return (RANGES as readonly number[]).includes(days) ? (days as Range) : 30;
}

/** How the range is written in a sentence. */
export const RANGE_LABELS: Record<Range, string> = {
  7: "Last 7 days",
  30: "Last 30 days",
  90: "Last 90 days",
  365: "Last 12 months",
};

/**
 * The zone, written into the statement rather than sent as a parameter.
 *
 * `at time zone $1` leaves Postgres unable to work out what type the parameter
 * is meant to be, and it refuses the statement rather than guessing. The value
 * is a constant in our own source, so there is nothing here to inject.
 */
const ZONE = sql.raw(`'${TZ}'`);

/** A whole number, written into the statement, for the same reason. */
const int = (value: number) => sql.raw(String(Math.trunc(value)));

/** Local midnight today, in Kigali, as a timestamp Postgres can compare. */
const TODAY = sql`date_trunc('day', now() at time zone ${ZONE})`;

/**
 * The first moment of the window, as a real instant.
 *
 * `back = 0` is the window being looked at, `back = 1` the one before it of the
 * same length — which is what every "up 12%" on the page is measured against.
 *
 * The window runs to now, so its last day is a partial one while the comparison
 * period's last day is complete. That biases every comparison slightly against
 * today, which is the honest direction for it to lean: a figure that flatters
 * the present because the day is not over yet is worse than one that catches up
 * by evening.
 */
function windowStart(days: number, back = 0): SQL {
  return sql`((${TODAY} - make_interval(days => ${int(days * (back + 1) - 1)})) at time zone ${ZONE})`;
}

/** `created_at` inside the window, for the plain Drizzle queries below. */
function within(column: PgColumn, days: number, back = 0) {
  return back === 0
    ? gte(column, windowStart(days))
    : and(gte(column, windowStart(days, back)), lt(column, windowStart(days, back - 1)));
}

/* ── Traffic ──────────────────────────────────────────────────────────────── */

export type Totals = {
  views: number;
  visitors: number;
  downloads: number;
};

export type Day = { day: string; views: number; visitors: number };

/**
 * One row per day in the range, including the days nobody came.
 *
 * `generate_series` and a left join, rather than filling the gaps in
 * JavaScript. A chart drawn only from the days that have rows is a chart with
 * no quiet days in it — every bar the same height, evenly spaced, and a
 * fortnight of silence rendered as a busy fortnight.
 */
export async function daily(days: number): Promise<Day[]> {
  const result = await db.execute<{ day: string; views: number; visitors: number }>(sql`
    select to_char(series.day, 'YYYY-MM-DD') as day,
           coalesce(counted.views, 0)::int as views,
           coalesce(counted.visitors, 0)::int as visitors
      from generate_series(
             ${TODAY} - make_interval(days => ${int(days - 1)}),
             ${TODAY},
             interval '1 day'
           ) as series(day)
      left join (
        select date_trunc('day', created_at at time zone ${ZONE}) as day,
               count(*) as views,
               count(distinct visitor) as visitors
          from page_views
         where kind = 'view'
           and created_at >= ${windowStart(days)}
         group by 1
      ) as counted on counted.day = series.day
     order by series.day
  `);

  return result.rows;
}

/** Views, visitors and downloads for one window. */
export async function totals(days: number, back = 0): Promise<Totals> {
  const bounds =
    back === 0
      ? sql`created_at >= ${windowStart(days)}`
      : sql`created_at >= ${windowStart(days, back)} and created_at < ${windowStart(days, back - 1)}`;

  const result = await db.execute<Totals>(sql`
    select count(*) filter (where kind = 'view')::int as views,
           count(distinct visitor) filter (where kind = 'view')::int as visitors,
           count(*) filter (where kind = 'download')::int as downloads
      from page_views
     where ${bounds}
  `);

  return result.rows[0] ?? { views: 0, visitors: 0, downloads: 0 };
}

/* ── Pages ────────────────────────────────────────────────────────────────── */

export type PageRow = { path: string; views: number; visitors: number };

export async function topPages(days: number, limit = 25): Promise<PageRow[]> {
  const result = await db.execute<PageRow>(sql`
    select path,
           count(*)::int as views,
           count(distinct visitor)::int as visitors
      from page_views
     where kind = 'view'
       and created_at >= ${windowStart(days)}
     group by path
     order by views desc, path
     limit ${int(limit)}
  `);

  return result.rows;
}

/* ── Where they came from ─────────────────────────────────────────────────── */

export type ReferrerRow = { host: string | null; views: number; visitors: number };

/**
 * Referring hosts, with direct arrivals kept as their own row.
 *
 * "Direct" is a null host, and it is not a failure to record something: it is
 * somebody who typed the address, opened a bookmark, followed a link from a
 * WhatsApp message or a PDF, or arrived from a site that withholds the referrer
 * — which every https page does when it links to http, and which most mobile
 * apps do always. On a site whose audience shares links by WhatsApp it is
 * usually the largest single row, and that is worth saying on the page rather
 * than hiding in a footnote.
 */
export async function referrers(days: number, limit = 12): Promise<ReferrerRow[]> {
  const result = await db.execute<ReferrerRow>(sql`
    select referrer_host as host,
           count(*)::int as views,
           count(distinct visitor)::int as visitors
      from page_views
     where kind = 'view'
       and created_at >= ${windowStart(days)}
     group by referrer_host
     order by views desc
     limit ${int(limit)}
  `);

  return result.rows;
}

/**
 * What kind of place a referrer is.
 *
 * Decided when the page is drawn rather than when the row is written, so the
 * lists below can be corrected — a search engine nobody had heard of last year,
 * a social network that renamed itself — without rewriting history.
 */
const SEARCH = /^(www\.)?(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex|brave|startpage|qwant)\./;
const SOCIAL =
  /^(www\.)?(facebook|fb|instagram|twitter|x|t|linkedin|lnkd|youtube|youtu|tiktok|whatsapp|wa|telegram|reddit|pinterest|threads|bsky|mastodon)\.|^l\.facebook|^lm\.facebook|^m\.facebook/;

export type Source = "search" | "social" | "direct" | "site";

export function sourceOf(host: string | null): Source {
  if (!host) return "direct";
  if (SEARCH.test(host)) return "search";
  if (SOCIAL.test(host)) return "social";
  return "site";
}

export const SOURCE_LABELS: Record<Source, string> = {
  search: "Search engines",
  social: "Social media",
  direct: "Direct, WhatsApp and email",
  site: "Other websites",
};

/* ── Devices ──────────────────────────────────────────────────────────────── */

export type DeviceRow = { device: string; views: number };

export async function devices(days: number): Promise<DeviceRow[]> {
  const result = await db.execute<DeviceRow>(sql`
    select device, count(*)::int as views
      from page_views
     where kind = 'view'
       and created_at >= ${windowStart(days)}
     group by device
     order by views desc
  `);

  return result.rows;
}

/* ── Downloads ────────────────────────────────────────────────────────────── */

export type DownloadRow = {
  path: string;
  downloads: number;
  visitors: number;
  title: string | null;
  filename: string;
};

/**
 * The documents people took, named by the publication they belong to.
 *
 * The join back to `publications` is the reason these figures live in FXB's own
 * database rather than in an analytics product: a third party would report
 * `/media/annual-report-2024-a3f19c.pdf`, and somebody would have to keep a
 * spreadsheet translating filenames into titles.
 *
 * A file with no publication row — something linked from a page by hand — keeps
 * its filename and is still counted. It is a real download either way.
 */
export async function downloads(days: number, limit = 15): Promise<DownloadRow[]> {
  const result = await db.execute<DownloadRow>(sql`
    select v.path,
           count(*)::int as downloads,
           count(distinct v.visitor)::int as visitors,
           max(p.title) as title,
           max(m.filename) as filename
      from page_views v
      left join ${media} m on m.url = v.path
      left join ${publications} p on p.file_id = m.id
     where v.kind = 'download'
       and v.created_at >= ${windowStart(days)}
     group by v.path
     order by downloads desc
     limit ${int(limit)}
  `);

  return result.rows.map((row) => ({
    ...row,
    filename: row.filename ?? row.path.replace("/media/", ""),
  }));
}

/* ── Results ──────────────────────────────────────────────────────────────── */

export type Results = {
  signups: number;
  messages: number;
  applications: number;
};

/**
 * The things that are not visits.
 *
 * A page view is somebody looking; these are somebody doing — joining the
 * mailing list, writing to the office, applying for a post. They come from
 * their own tables rather than from an event, which means they have full
 * history from before any of this existed and cannot be lost to a blocked
 * script.
 */
export async function results(days: number, back = 0): Promise<Results> {
  const [signups, contacted, applied] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(subscribers)
      .where(within(subscribers.createdAt, days, back)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(messages)
      .where(within(messages.createdAt, days, back)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(applications)
      .where(within(applications.createdAt, days, back)),
  ]);

  return {
    signups: signups[0]?.n ?? 0,
    messages: contacted[0]?.n ?? 0,
    applications: applied[0]?.n ?? 0,
  };
}

/* ── Naming the pages ─────────────────────────────────────────────────────── */

/**
 * The fixed pages of the site, as somebody would name them out loud.
 *
 * Written out rather than derived from the path, because a path is not a title:
 * `/what-we-do/current-projects` is "Current projects", and `/who-we-are` is
 * "Who We Are", and no amount of capitalising dashes gets the second one right.
 * A path missing from here is shown as itself, which is ugly and correct — it
 * means somebody added a page and this list has not caught up.
 */
const STATIC_PAGES: Record<string, string> = {
  "/": "Home",
  "/who-we-are": "Who We Are",
  "/what-we-do": "What We Do",
  "/what-we-do/current-projects": "Current projects",
  "/what-we-do/phased-out-projects": "Phased-out projects",
  "/our-impact": "Our Impact",
  "/our-impact/stories": "Impact stories",
  "/news-insights/news": "Latest news",
  "/news-insights/newsletters": "Newsletters",
  "/news-insights/publications": "Publications",
  "/news-insights/media-gallery": "Media gallery",
  "/get-involved": "Get Involved",
  "/get-involved/partners": "Partner with us",
  "/get-involved/careers": "Careers",
  "/get-involved/procurement": "Procurement",
  "/get-involved/donate": "Donate",
  "/contact": "Contact",
  "/privacy-policy": "Privacy policy",
  "/terms-of-use": "Terms of use",
  "/newsletter/unsubscribe": "Unsubscribe",
};

/** Which collection a path belongs to, and what to call that collection. */
const DYNAMIC = [
  { prefix: "/news-insights/news/", kind: "News", table: news, title: news.title, slug: news.slug },
  { prefix: "/our-impact/stories/", kind: "Story", table: stories, title: stories.title, slug: stories.slug },
  {
    prefix: "/what-we-do/programmes/",
    kind: "Programme",
    table: programmes,
    title: programmes.name,
    slug: programmes.slug,
  },
  {
    prefix: "/get-involved/careers/",
    kind: "Opportunity",
    table: opportunities,
    title: opportunities.title,
    slug: opportunities.slug,
  },
] as const;

export type PageLabel = { label: string; kind: string | null };

/**
 * Turn a list of paths into something readable, in one query per collection.
 *
 * The alternative — asking the database for a title as each row is drawn — is
 * twenty-five queries for a table of twenty-five rows, which is the classic way
 * an admin page ends up taking two seconds to render a list.
 *
 * A slug with no row behind it is a page that has since been deleted or
 * unpublished. It keeps its slug and is marked with its collection, because
 * "somebody read a story that is no longer there" is information, and dropping
 * the row would silently change the totals.
 */
export async function labelPaths(paths: string[]): Promise<Map<string, PageLabel>> {
  const labels = new Map<string, PageLabel>();

  await Promise.all(
    DYNAMIC.map(async (entry) => {
      const slugs = paths
        .filter((path) => path.startsWith(entry.prefix))
        .map((path) => path.slice(entry.prefix.length))
        .filter(Boolean);

      if (slugs.length === 0) return;

      const rows = await db
        .select({ slug: entry.slug, title: entry.title })
        .from(entry.table)
        .where(inArray(entry.slug, slugs));

      const found = new Map(rows.map((row) => [row.slug, row.title]));

      for (const slug of slugs) {
        labels.set(`${entry.prefix}${slug}`, {
          label: found.get(slug) ?? slug,
          kind: found.has(slug) ? entry.kind : `${entry.kind} — removed`,
        });
      }
    }),
  );

  for (const path of paths) {
    if (labels.has(path)) continue;
    labels.set(path, { label: STATIC_PAGES[path] ?? path, kind: null });
  }

  return labels;
}

/* ── The whole page, in one call ──────────────────────────────────────────── */

export type Overview = {
  days: number;
  /** The first day anything was recorded, or null if nothing has been yet. */
  since: string | null;
  now: Totals;
  before: Totals;
  chart: Day[];
  pages: (PageRow & PageLabel)[];
  sources: ReferrerRow[];
  screens: DeviceRow[];
  files: DownloadRow[];
  did: Results;
  didBefore: Results;
};

export async function overview(days: number): Promise<Overview> {
  const [now, before, chart, pages, sources, screens, files, did, didBefore, first] =
    await Promise.all([
      totals(days),
      totals(days, 1),
      daily(days),
      topPages(days),
      referrers(days),
      devices(days),
      downloads(days),
      results(days),
      results(days, 1),
      db.execute<{ day: string | null }>(
        sql`select to_char(min(created_at) at time zone ${ZONE}, 'FMDD Mon YYYY') as day from page_views`,
      ),
    ]);

  const labels = await labelPaths(pages.map((page) => page.path));

  return {
    days,
    since: first.rows[0]?.day ?? null,
    now,
    before,
    chart,
    pages: pages.map((page) => ({
      ...page,
      ...(labels.get(page.path) ?? { label: page.path, kind: null }),
    })),
    sources,
    screens,
    files,
    did,
    didBefore,
  };
}
