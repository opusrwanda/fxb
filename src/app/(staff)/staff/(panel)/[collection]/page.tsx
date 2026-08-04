import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { findCollection } from "@/staff/collections";
import { getListing } from "@/staff/queries/list";
import { ListTable } from "@/staff/ui/table";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  return { title: findCollection(collection)?.label ?? "Not found" };
}

/**
 * A collection's listing.
 *
 * One route for all eight, driven by the collection list. Adding a collection
 * is a line in `src/staff/collections.ts` and a query in `queries/list.ts` —
 * there is no ninth page to write, which is the whole reason the definitions
 * are data rather than eight hand-built screens that drift apart.
 */
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;

  const entry = findCollection(collection);
  if (!entry) notFound();

  const listing = await getListing(entry.key);
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.14em] text-gray-80 uppercase">
              {entry.group}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[38px] lg:leading-[1.1]">
            {entry.label}
          </h1>
          <p className="max-w-[58ch] text-base leading-relaxed text-gray">
            {entry.description}
          </p>
        </div>

        <Link
          href={`/staff/${entry.slug}/new`}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-blue-90"
        >
          <Plus className="size-4" aria-hidden="true" />
          New {entry.singular}
        </Link>
      </header>

      <div className="mt-10">
        {listing.rows.length > 0 ? (
          <>
            <ListTable
              columns={listing.columns}
              rows={listing.rows}
              href={(id) => `/staff/${entry.slug}/${id}`}
            />
            <p className="mt-5 text-sm text-gray-80">
              {listing.rows.length}{" "}
              {listing.rows.length === 1 ? entry.singular : "in total"}
            </p>
          </>
        ) : (
          // An empty collection is a real state, not a failure — Opportunities
          // is empty most of the year and that is correct.
          <div className="rounded-[20px_20px_0_20px] border border-gray-15 bg-blue-08 p-10">
            <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
              Nothing here yet
            </h2>
            <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-gray">
              {entry.description} Add the first one and it appears on the
              website.
            </p>
            <Link
              href={`/staff/${entry.slug}/new`}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-blue-90"
            >
              <Plus className="size-4" aria-hidden="true" />
              New {entry.singular}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
