import Link from "next/link";
import { sql } from "drizzle-orm";
import { ArrowUpRight } from "lucide-react";

import {
  board,
  db,
  media,
  news,
  opportunities,
  partners,
  programmes,
  publications,
  stories,
} from "@/staff/db";
import { collections, globals } from "@/staff/collections";
import { currentUser } from "@/staff/auth/session";

export const metadata = { title: "Dashboard" };

/**
 * The dashboard.
 *
 * Every collection with how much is in it and how much of that is still a
 * draft, because "3 drafts" is the one number an editor actually acts on — it
 * is the list of things they started and have not finished. A wall of tiles
 * showing only totals looks informative and tells you nothing to do.
 */

const TABLES = {
  news,
  stories,
  programmes,
  publications,
  board,
  partners,
  opportunities,
  media,
} as const;

/** Which tables have a draft/published distinction at all. */
const DRAFTABLE = new Set([
  "news",
  "stories",
  "programmes",
  "publications",
  "opportunities",
]);

/**
 * Both numbers per collection, in one query each.
 *
 * Written as raw `sql` rather than the query builder because the table is
 * chosen at runtime from the collection list — the builder wants to know which
 * table it is looking at to type the result, and here that is the one thing we
 * do not know until the loop runs. A `filter` clause gets both counts out of a
 * single pass rather than two round trips per collection.
 */
async function counts() {
  return Promise.all(
    collections.map(async (entry) => {
      const table = TABLES[entry.key as keyof typeof TABLES];

      const query = DRAFTABLE.has(entry.key)
        ? sql`select count(*)::int as total,
                     count(*) filter (where status = 'draft')::int as drafts
                from ${table}`
        : sql`select count(*)::int as total, 0 as drafts from ${table}`;

      const result = await db.execute<{ total: number; drafts: number }>(query);
      const row = result.rows[0];

      return { ...entry, total: row?.total ?? 0, drafts: row?.drafts ?? 0 };
    }),
  );
}

export default async function DashboardPage() {
  const [user, entries] = await Promise.all([currentUser(), counts()]);

  const outstanding = entries.reduce((sum, entry) => sum + entry.drafts, 0);
  const hour = new Date().getUTCHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-[0.14em] text-gray-80">
            STAFF PANEL
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
          {greeting}, {user?.name}
        </h1>
        <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
          {outstanding > 0 ? (
            <>
              There {outstanding === 1 ? "is" : "are"}{" "}
              <strong className="font-semibold text-blue">
                {outstanding} unpublished {outstanding === 1 ? "item" : "items"}
              </strong>{" "}
              waiting. Everything else is live on the website.
            </>
          ) : (
            <>Everything is published. The website is up to date.</>
          )}
        </p>
      </header>

      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <li key={entry.key}>
            <Link
              href={`/staff/${entry.slug}`}
              className="group flex h-full flex-col gap-4 rounded-[20px_20px_0_20px] border border-gray-15 p-6 transition-colors duration-300 hover:border-blue"
            >
              <div className="flex items-start justify-between gap-4">
                <entry.icon className="size-5 text-blue" aria-hidden="true" />
                <span className="flex size-8 items-center justify-center rounded-full bg-blue-08 transition-colors duration-300 group-hover:bg-blue">
                  <ArrowUpRight
                    className="size-4 text-blue transition-colors duration-300 group-hover:text-white"
                    aria-hidden="true"
                  />
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-1">
                <h2 className="text-xl font-semibold tracking-[-0.02em] text-blue">
                  {entry.label}
                </h2>
                <p className="text-[15px] leading-snug text-gray">
                  {entry.description}
                </p>
              </div>

              <p className="text-sm text-gray-80">
                <span className="font-display text-2xl font-semibold text-blue tabular-nums">
                  {entry.total}
                </span>{" "}
                {entry.total === 1 ? entry.singular : "in total"}
                {entry.drafts > 0 && (
                  <>
                    {" · "}
                    <span className="font-semibold text-green">
                      {entry.drafts} draft{entry.drafts === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-xs font-semibold tracking-[0.14em] text-gray-80">
        SETTINGS
      </h2>
      <ul className="mt-6 flex flex-col">
        {globals.map((entry) => (
          <li key={entry.key} className="border-t border-gray-15 last:border-b">
            <Link
              href={`/staff/globals/${entry.slug}`}
              className="group flex items-center justify-between gap-6 py-5"
            >
              <span className="flex items-center gap-4">
                <entry.icon className="size-5 shrink-0 text-blue" aria-hidden="true" />
                <span>
                  <span className="block text-base font-semibold text-blue">
                    {entry.label}
                  </span>
                  <span className="block text-[15px] text-gray">
                    {entry.description}
                  </span>
                </span>
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-gray-80 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
