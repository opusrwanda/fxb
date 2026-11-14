import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Plus } from "lucide-react";

import { findCollection } from "@/staff/collections";
import { requireAccess, requireUser } from "@/staff/auth/guard";
import { canCreate, canDeleteDocument, isAdmin } from "@/staff/auth/permissions";
import { db, media } from "@/staff/db";
import { deleteDocument } from "@/staff/queries/document";
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
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{ deleted?: string; refused?: string }>;
}) {
  const { collection } = await params;
  const { deleted, refused } = await searchParams;

  const entry = findCollection(collection);
  if (!entry) notFound();

  const user = await requireAccess(entry.key, "read");

  const listing = await getListing(entry.key);
  if (!listing) notFound();

  /**
   * Which rows this person may delete, decided here so the list only draws a
   * checkbox and a bin where pressing one will work.
   *
   * An admin may delete anything. An editor may delete nothing but the files
   * they uploaded themselves — `canDeleteDocument` is the rule, and
   * `deleteDocument` applies it again on the server for every row, so this is
   * what is offered and that is what is allowed.
   */
  let deletable: number[] = [];
  if (isAdmin(user)) {
    deletable = listing.rows.map((row) => row.id);
  } else if (canDeleteDocument(user, entry.key, user.id)) {
    const own = await db
      .select({ id: media.id })
      .from(media)
      .where(eq(media.authorId, user.id));
    deletable = own.map((row) => row.id);
  }

  // Plain strings, so the action below closes over nothing it cannot carry.
  const key = entry.key as Parameters<typeof deleteDocument>[0];
  const slug = entry.slug;

  /**
   * Delete from the list — one row's bin, or everything ticked.
   *
   * Each row goes through `deleteDocument`, which checks the person's right to
   * that particular row and, for a file, removes the file with it. A row that
   * is refused is counted and reported rather than stopping the rest: nine of
   * ten deleted and a sentence about the tenth is more use than none.
   */
  async function removeMany(ids: number[]) {
    "use server";

    const actor = await requireUser();
    let done = 0;
    let turnedDown = 0;

    for (const id of ids.slice(0, 500)) {
      if (!Number.isInteger(id)) continue;
      const result = await deleteDocument(key, id, actor);
      if (result.ok) done += 1;
      else turnedDown += 1;
    }

    redirect(
      `/staff/${slug}?deleted=${done}${turnedDown ? `&refused=${turnedDown}` : ""}`,
    );
  }

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

        {canCreate(user, entry.key) && (
          <Link
            href={`/staff/${entry.slug}/new`}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
          >
            <Plus className="size-4" aria-hidden="true" />
            New {entry.singular}
          </Link>
        )}
      </header>

      {/* The edit page is gone by the time this renders, so the confirmation
          has to land here or nowhere. */}
      {(deleted || refused) && (
        <p
          role="status"
          className="mt-8 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] text-gray"
        >
          {deleted !== "0" && (
            <>
              <strong className="font-semibold text-blue">
                {Number(deleted) > 1 ? `${deleted} deleted.` : "Deleted."}
              </strong>{" "}
              {Number(deleted) > 1 ? "They have" : "It has"} been removed from
              the website.
            </>
          )}
          {refused &&
            ` ${refused} could not be deleted — only an admin, or the person who uploaded a file, can remove it.`}
        </p>
      )}

      <div className="mt-10">
        {listing.rows.length > 0 ? (
          <>
            <ListTable
              columns={listing.columns}
              rows={listing.rows}
              basePath={`/staff/${entry.slug}`}
              deletable={deletable}
              singular={entry.singular}
              plural="items"
              onDelete={removeMany}
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
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
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
