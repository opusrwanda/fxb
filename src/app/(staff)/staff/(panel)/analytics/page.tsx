import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";

import { requireAccess } from "@/staff/auth/guard";
import {
  overview,
  rangeFrom,
  RANGES,
  RANGE_LABELS,
  sourceOf,
  SOURCE_LABELS,
  type Day,
  type Source,
} from "@/staff/queries/analytics";

export const metadata = { title: "Website analytics" };

/**
 * How the website is doing.
 *
 * Built around one question — "is anybody reading this, and which of it" —
 * because that is what the team actually needs from a figure: whether the story
 * they spent a week on was read, whether the annual report was downloaded,
 * whether the Facebook post brought anybody. Everything on this page is either
 * an answer to that or the context needed to read one.
 *
 * So there is no bounce rate, no session duration and no time on page. Each of
 * those is either unmeasurable without following people around the site or
 * meaningless on a site of this shape, and a number nobody can act on is a
 * number that teaches people to ignore the page it is on.
 *
 * Every figure is shown against the same length of time before it. A view count
 * alone says nothing — four hundred is good or bad entirely depending on what
 * last month was — and the comparison is the cheapest way to make a number mean
 * something without anybody having to remember the last one.
 */
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  // Admin-only, and it fails the same way the rest of the panel does: back to
  // the dashboard with a sentence, not an error page.
  await requireAccess("analytics", "read");

  const { days: requested } = await searchParams;
  const days = rangeFrom(requested);
  const data = await overview(days);

  const busiest = data.chart.reduce(
    (most, day) => Math.max(most, day.views),
    0,
  );
  const nothingYet = data.now.views === 0 && data.now.downloads === 0;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-[0.14em] text-gray-80 uppercase">
            The website
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[38px]">
          Analytics
        </h1>
        <p className="max-w-[62ch] text-base leading-relaxed text-gray">
          What people looked at on fxbrwanda.org, counted here rather than by
          Google. No cookies are set and no addresses are stored, so nobody is
          followed anywhere and there is nothing to ask visitors&rsquo;
          permission for.
        </p>
      </header>

      {/* The range, as links rather than a dropdown. A dropdown needs a script
          to do anything, and each of these is a real address somebody can
          bookmark or send to a colleague. */}
      <nav aria-label="Period" className="mt-8 flex flex-wrap gap-2">
        {RANGES.map((option) => (
          <Link
            key={option}
            href={`/staff/analytics?days=${option}`}
            aria-current={option === days ? "true" : undefined}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-300 ${
              option === days
                ? "bg-blue text-white"
                : "border border-gray-15 text-gray hover:border-blue hover:text-blue"
            }`}
          >
            {RANGE_LABELS[option]}
          </Link>
        ))}
      </nav>

      {nothingYet ? (
        <Empty since={data.since} />
      ) : (
        <>
          {/* Traffic only. The things people *did* have their own section at
              the bottom, and a number that appears in both places is a number
              somebody will eventually add to itself. */}
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            <Headline
              label="Page views"
              value={data.now.views}
              before={data.before.views}
              note="Pages opened, in total."
            />
            <Headline
              label="Visitors"
              value={data.now.visitors}
              before={data.before.visitors}
              note="Counted once each per day."
            />
            <Headline
              label="Downloads"
              value={data.now.downloads}
              before={data.before.downloads}
              note="Reports and other documents."
            />
          </ul>

          <Chart chart={data.chart} busiest={busiest} days={days} />

          {/* `min-w-0` on both columns, or neither of them fits.
              A grid item's automatic minimum size is its content's min-content
              width, and the paths in the list below are `truncate`, which is
              `white-space: nowrap` — so a single long URL makes the column
              wider than the screen and gives the whole panel a sideways
              scrollbar. The truncation only starts working once the item is
              allowed to be narrower than its contents. */}
          <div className="mt-12 grid gap-10 lg:grid-cols-[3fr_2fr]">
            <section className="min-w-0">
              <h2 className="text-[24px] font-semibold tracking-[0.14em] text-gray-80 uppercase">
                Most read
              </h2>
              <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-gray">
                Every page anybody opened, in order. Stories and news items are
                named, so this is the list that says which writing worked.
              </p>

              <ul className="mt-6 flex flex-col">
                {data.pages.map((page) => (
                  <li
                    key={page.path}
                    className="border-t border-gray-15 last:border-b"
                  >
                    <div className="flex items-baseline justify-between gap-6 py-3.5">
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium text-blue">
                          {page.label}
                        </span>
                        <span className="block truncate text-sm text-gray-80">
                          {page.kind ? `${page.kind} · ` : ""}
                          {page.path}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[15px] font-semibold text-blue tabular-nums">
                          {page.views.toLocaleString("en-GB")}
                        </span>
                        <span className="block text-xs text-gray-80 tabular-nums">
                          {page.visitors.toLocaleString("en-GB")}{" "}
                          {page.visitors === 1 ? "visitor" : "visitors"}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex min-w-0 flex-col gap-10">
              <section>
                <h2 className="text-[24px] font-semibold tracking-[0.14em] text-gray-80 uppercase">
                  How they arrived
                </h2>
                <Sources rows={data.sources} />
              </section>

              <section>
                <h2 className="text-[24px] font-semibold tracking-[0.14em] text-gray-80 uppercase">
                  What they read on
                </h2>
                <Screens rows={data.screens} />
              </section>
            </div>
          </div>

          <section className="mt-12">
            <h2 className="text-[24px] font-semibold tracking-[0.14em] text-gray-80 uppercase">
              Downloads
            </h2>
            <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-gray">
              Documents taken off the site — annual reports, newsletters,
              anything with a file. Counted as the file is sent, so it includes
              the ones that open in a browser&rsquo;s own PDF viewer rather than
              landing in a downloads folder.
            </p>

            {data.files.length === 0 ? (
              <p className="mt-6 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] text-gray">
                Nothing has been downloaded in this period.
              </p>
            ) : (
              <ul className="mt-6 flex flex-col">
                {data.files.map((file) => (
                  <li
                    key={file.path}
                    className="border-t border-gray-15 last:border-b"
                  >
                    <div className="flex items-baseline justify-between gap-6 py-3.5">
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium text-blue">
                          {file.title ?? file.filename}
                        </span>
                        <span className="block truncate text-sm text-gray-80">
                          {file.title
                            ? file.filename
                            : "Not attached to a publication"}
                        </span>
                      </span>
                      <span className="shrink-0 text-[15px] font-semibold text-blue tabular-nums">
                        {file.downloads.toLocaleString("en-GB")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-12">
            <h2 className="text-[24px] font-semibold tracking-[0.14em] text-gray-80 uppercase">
              What came of it
            </h2>
            <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-gray">
              The website working, rather than the website being looked at.
              These come from the panel&rsquo;s own records, so they are
              complete — a blocked script cannot lose one, and they go back
              further than the visit figures do.
            </p>

            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              <Headline
                label="Newsletter signups"
                value={data.did.signups}
                before={data.didBefore.signups}
                note="Through either form."
              />
              <Headline
                label="Messages"
                value={data.did.messages}
                before={data.didBefore.messages}
                note="Sent through Contact."
              />
              <Headline
                label="Job applications"
                value={data.did.applications}
                before={data.didBefore.applications}
                note="Against an opening."
              />
            </ul>
          </section>
        </>
      )}

      <section className="mt-14 rounded-[20px_20px_0_20px] border border-gray-15 bg-blue-08 p-6">
        <h2 className="text-[15px] font-semibold text-blue">
          How these figures are collected
        </h2>
        <div className="mt-3 flex max-w-[70ch] flex-col gap-3 text-[15px] leading-relaxed text-gray">
          <p>
            A page counts once it has actually opened in somebody&rsquo;s
            browser. Robots that announce themselves are left out, and a reload
            within half a minute is not counted twice.
          </p>
          <p>
            <strong className="font-semibold text-blue">Visitors</strong>{" "}
            means people counted once a day: somebody who reads three stories this
            morning is one visitor and three page views, and if they come back
            tomorrow they are counted again. That is a consequence of not
            following anybody — the browser is recognised for a day using a
            number that is scrambled with a secret, and the secret is destroyed
            each night, so there is nothing left that could link today&rsquo;s
            reader to yesterday&rsquo;s.
          </p>
          <p>
            {data.since
              ? `Counting started on ${data.since}. Anything before that is not here, because nothing was recording it.`
              : "Nothing has been recorded yet. The figures begin from the day this was switched on."}
          </p>
        </div>
      </section>
    </div>
  );
}

/**
 * One big number, with the same period before it underneath.
 *
 * The comparison is a sentence rather than a percentage on its own: "+34% on
 * the 30 days before" can be read without knowing what the page's period is,
 * and a bare arrow and number cannot.
 */
function Headline({
  label,
  value,
  before,
  note,
}: {
  label: string;
  value: number;
  before: number;
  note: string;
}) {
  return (
    <li className="flex flex-col gap-1 rounded-[20px_20px_0_20px] border border-gray-15 p-5">
      <span className="text-[11px] font-semibold tracking-[0.14em] text-gray-80 uppercase">
        {label}
      </span>
      <span className="font-display text-[34px] leading-none font-semibold text-blue tabular-nums">
        {value.toLocaleString("en-GB")}
      </span>
      <Change value={value} before={before} />
      <span className="mt-1 text-sm leading-snug text-gray-80">{note}</span>
    </li>
  );
}

/**
 * Up, down, or the same.
 *
 * Growth from zero is not shown as a percentage. Going from 0 to 4 is not an
 * infinite increase, or a 400% one, and any arithmetic that produces a number
 * there is producing a lie about a very small sample — so it says what actually
 * happened: there was nothing before.
 */
function Change({ value, before }: { value: number; before: number }) {
  if (before === 0 && value === 0) {
    return <span className="text-sm text-gray-80">None in either period</span>;
  }

  if (before === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green">
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
        None in the period before
      </span>
    );
  }

  const change = Math.round(((value - before) / before) * 100);

  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-80">
        <Minus className="size-3.5" aria-hidden="true" />
        Level with the period before
      </span>
    );
  }

  const up = change > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
        up ? "text-green" : "text-gray"
      }`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {up ? "+" : ""}
      {change}% on the period before
    </span>
  );
}

/**
 * The daily chart, drawn as HTML.
 *
 * Columns in a flex row with a percentage height, not an SVG and certainly not
 * a charting library — the whole thing is one number per day, and a dependency
 * that ships a hundred kilobytes of JavaScript to draw thirty rectangles would
 * be the largest thing in this panel by some margin.
 *
 * It is also a table underneath, for anybody reading with a screen reader: the
 * bars are `aria-hidden` and the same figures are in a visually hidden table.
 * A chart that can only be seen is not the figures, it is a picture of them.
 */
function Chart({
  chart,
  busiest,
  days,
}: {
  chart: Day[];
  busiest: number;
  days: number;
}) {
  const label = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  // A year of daily columns is 365 slivers a pixel wide. Past a quarter the
  // labels come off and the bars carry it alone; the numbers are in the table.
  const dense = chart.length > 60;

  return (
    <section className="mt-10">
      <h2 className="text-[24px] font-semibold tracking-[0.14em] text-gray-80 uppercase">
        Day by day
      </h2>

      <div className="mt-6 rounded-[20px_20px_0_20px] border border-gray-15 p-6">
        {/* No column behind each bar. A full-height track in a pale blue is
            indistinguishable from a full-height bar at a glance, so a month of
            quiet days read as a month of busy ones. A quiet day here is empty
            space above the baseline, which is what it was. */}
        <div
          className="flex h-44 items-end gap-[2px] border-b border-gray-15"
          aria-hidden="true"
        >
          {chart.map((day) => (
            <div
              key={day.day}
              title={`${label.format(new Date(`${day.day}T12:00:00Z`))} — ${day.views} ${
                day.views === 1 ? "view" : "views"
              }`}
              className="flex h-full flex-1 flex-col justify-end"
            >
              <div
                className="rounded-t-[3px] bg-blue"
                style={{
                  // A day with views always shows something: a single view in a
                  // month whose best day is 200 would round to nothing, and
                  // "nobody came" and "one person came" are different answers.
                  height:
                    busiest === 0
                      ? "0%"
                      : `${Math.max(day.views > 0 ? 3 : 0, (day.views / busiest) * 100)}%`,
                }}
              />
            </div>
          ))}
        </div>

        {!dense && (
          <div className="mt-3 flex justify-between text-xs text-gray-80">
            <span>{label.format(new Date(`${chart[0]?.day}T12:00:00Z`))}</span>
            <span>Today</span>
          </div>
        )}
        {dense && (
          <div className="mt-3 flex justify-between text-xs text-gray-80">
            <span>{days === 365 ? "12 months ago" : `${days} days ago`}</span>
            <span>Today</span>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-80">
          Busiest day in this period:{" "}
          <span className="font-semibold text-blue tabular-nums">
            {busiest.toLocaleString("en-GB")}
          </span>{" "}
          {busiest === 1 ? "view" : "views"}.
        </p>
      </div>

      {/* The wrapper carries `sr-only`, not the table.
          A table lays out at its minimum content width whatever `width` says,
          so `sr-only` on the table itself leaves a 420px element absolutely
          positioned off in the corner — invisible, and wide enough to give the
          whole panel a horizontal scrollbar on a phone. A div takes the 1px. */}
      <div className="sr-only">
        <table>
          <caption>Page views and visitors for each day of the period</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Page views</th>
              <th scope="col">Visitors</th>
            </tr>
          </thead>
          <tbody>
            {chart.map((day) => (
              <tr key={day.day}>
                <th scope="row">
                  {label.format(new Date(`${day.day}T12:00:00Z`))}
                </th>
                <td>{day.views}</td>
                <td>{day.visitors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Where visitors came from, grouped and then itemised.
 *
 * The grouping is the useful half — "social media brought a third of this
 * month" is a decision about where to post next — and the individual hosts are
 * underneath it for the times when it matters which social network.
 */
function Sources({ rows }: { rows: { host: string | null; views: number }[] }) {
  const total = rows.reduce((sum, row) => sum + row.views, 0);

  const grouped = new Map<Source, number>();
  for (const row of rows) {
    const source = sourceOf(row.host);
    grouped.set(source, (grouped.get(source) ?? 0) + row.views);
  }

  const order: Source[] = ["direct", "social", "search", "site"];
  const named = rows.filter((row) => row.host);

  if (total === 0) {
    return (
      <p className="mt-4 text-[15px] text-gray">
        Nothing recorded in this period.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-5 flex flex-col gap-3">
        {order
          .filter((source) => (grouped.get(source) ?? 0) > 0)
          .map((source) => {
            const views = grouped.get(source) ?? 0;
            const share = Math.round((views / total) * 100);

            return (
              <li key={source} className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between gap-4 text-[15px]">
                  <span className="text-gray">{SOURCE_LABELS[source]}</span>
                  <span className="shrink-0 font-semibold text-blue tabular-nums">
                    {share}%
                  </span>
                </span>
                <span
                  className="h-1.5 w-full rounded-full bg-blue-08"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full rounded-full bg-blue"
                    style={{ width: `${share}%` }}
                  />
                </span>
              </li>
            );
          })}
      </ul>

      {named.length > 0 && (
        <ul className="mt-6 flex flex-col">
          {named.map((row) => (
            <li
              key={row.host}
              className="border-t border-gray-15 last:border-b"
            >
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="truncate text-sm text-gray">{row.host}</span>
                <span className="shrink-0 text-sm font-semibold text-blue tabular-nums">
                  {row.views.toLocaleString("en-GB")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const SCREEN_LABELS: Record<string, string> = {
  mobile: "Phone",
  tablet: "Tablet",
  desktop: "Computer",
};

function Screens({ rows }: { rows: { device: string; views: number }[] }) {
  const total = rows.reduce((sum, row) => sum + row.views, 0);

  if (total === 0) {
    return (
      <p className="mt-4 text-[15px] text-gray">
        Nothing recorded in this period.
      </p>
    );
  }

  return (
    <ul className="mt-5 flex flex-col gap-3">
      {rows.map((row) => {
        const share = Math.round((row.views / total) * 100);

        return (
          <li key={row.device} className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between gap-4 text-[15px]">
              <span className="text-gray">
                {SCREEN_LABELS[row.device] ?? row.device}
              </span>
              <span className="shrink-0 font-semibold text-blue tabular-nums">
                {share}%
              </span>
            </span>
            <span
              className="h-1.5 w-full rounded-full bg-blue-08"
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full bg-green"
                style={{ width: `${share}%` }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Nothing to show, said as a state of affairs rather than as a fault.
 *
 * This is what the page looks like on the day it ships, and for a while after
 * on a quiet week, so it has to explain itself — an empty chart with no words
 * around it reads as something that is broken.
 */
function Empty({ since }: { since: string | null }) {
  return (
    <div className="mt-8 rounded-[20px_20px_0_20px] border border-gray-15 bg-blue-08 p-8">
      <h2 className="text-xl font-semibold text-blue">
        {since ? "Nothing in this period" : "No figures yet"}
      </h2>
      <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-gray">
        {since
          ? `Nobody opened a page in the period you have chosen. Counting has been running since ${since} — try a longer period.`
          : "Counting begins the moment this is live on the website, and there is no history from before that because nothing was recording it. Come back tomorrow and there will be a day here."}
      </p>
      <Link
        href="/staff"
        className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-blue underline underline-offset-4 hover:text-green"
      >
        Back to the dashboard
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
