import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { findCollection } from "@/staff/collections";
import { requireAccess, requireUser } from "@/staff/auth/guard";
import { canDeleteDocument, canEditDocument } from "@/staff/auth/permissions";
import { mainFields, sidebarFields } from "@/staff/fields";
import {
  deleteDocument,
  getDocument,
  getMediaOptions,
  getParentOptions,
  isCollection,
  richTextToEditorJson,
  saveDocument,
} from "@/staff/queries/document";
import { ConfirmDialog } from "@/staff/ui/confirm-dialog";
import { FormField } from "@/staff/ui/fields";
import type { RichText, Status } from "@/staff/db/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string; id: string }>;
}) {
  const { collection, id } = await params;
  const entry = findCollection(collection);
  return {
    title: entry ? (id === "new" ? `New ${entry.singular}` : entry.label) : "Not found",
  };
}

/**
 * Editing one document.
 *
 * The same route creates and edits: `/staff/news/new` and `/staff/news/12` are
 * the same form, because they are the same job and a separate "create" screen
 * is how the two drift apart.
 *
 * Body on the left with the width, everything that describes the document in a
 * rail on the right. The form posts to a server action, so it saves without
 * JavaScript.
 */
export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string; id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { collection, id } = await params;
  const { error, saved } = await searchParams;

  const entry = findCollection(collection);
  if (!entry || !isCollection(entry.key)) notFound();

  const creating = id === "new";
  const numericId = creating ? null : Number(id);
  if (!creating && !Number.isInteger(numericId)) notFound();

  // Reading is the floor. Whether this person may also *change* what they are
  // reading is settled below, once we know who wrote it.
  const user = await requireAccess(entry.key, creating ? "write" : "read");

  const [document, mediaOptions, parentOptions] = await Promise.all([
    creating ? null : getDocument(entry.key, numericId as number),
    getMediaOptions(),
    // A programme cannot be its own parent, so the row being edited is not on
    // the list it is choosing from.
    getParentOptions(creating ? null : (numericId as number)),
  ]);

  if (!creating && !document) notFound();

  const main = mainFields(entry.key);
  const rail = sidebarFields(
    entry.key,
    user.role,
    document?.status as Status | undefined,
  );

  /**
   * May this person change what they are looking at?
   *
   * Two different questions wearing one name. On a create it is "may you add
   * one of these at all", which `requireAccess` has already answered. On an
   * edit it is "is this yours" — an editor writes their own news and reads
   * everybody else's, and a document with no recorded author belongs to the
   * admins, which is every document written before authorship existed.
   */
  const authorId = (document?.authorId as number | null | undefined) ?? null;
  const writable = creating || canEditDocument(user, entry.key, authorId);
  const deletable = !creating && canDeleteDocument(user, entry.key, authorId);

  /** The value a control should start with, converted for display. */
  const valueOf = (name: string, type: string): unknown => {
    // The file field has no column of its own — it stands for the bytes, which
    // the row names in `filename`. Empty on a create, which is what makes the
    // control render as an upload rather than as a statement of what is there.
    if (type === "file") return document?.filename ?? null;

    const raw = document?.[name];
    if (type === "richtext") return richTextToEditorJson(raw as RichText | null);
    return raw;
  };

  /** Whichever column names this kind of document. */
  const nameOf = (): string => {
    for (const key of ["title", "name", "filename"]) {
      const value = document?.[key];
      if (typeof value === "string" && value) return value;
    }
    return entry!.singular;
  };

  // Two plain strings, pulled out before the action is defined.
  //
  // A server action is serialised along with everything it closes over, and
  // `entry` carries `icon` — a React component, which is a function and cannot
  // be serialised. Closing over the whole entry threw "Functions cannot be
  // passed directly to Client Components" on every render of this page, and
  // would have broken every save from the browser.
  const key = entry.key as Parameters<typeof saveDocument>[0];
  const slugSegment = entry.slug;

  async function save(formData: FormData) {
    "use server";

    // The role is read from the session here, not carried from the render.
    // Closing over the user object would mean a page rendered before somebody
    // was demoted still saved with the permissions they had when it loaded.
    const actor = await requireUser();
    const result = await saveDocument(key, numericId, formData, actor);

    if (!result.ok) {
      redirect(
        `/staff/${slugSegment}/${id}?error=${encodeURIComponent(result.error)}`,
      );
    }

    redirect(`/staff/${slugSegment}/${result.id}?saved=1`);
  }

  /**
   * Removing the document.
   *
   * `deleteDocument` has existed since the panel was built and nothing has
   * ever called it — every collection offered Create and Edit and no way to
   * take anything down, so a mistyped news item stayed published until
   * somebody edited it into something else.
   *
   * The redirect goes to the listing, not back here: this page is about to
   * describe a row that no longer exists.
   */
  async function remove() {
    "use server";

    const actor = await requireUser();
    const result = await deleteDocument(key, numericId as number, actor);

    if (!result.ok) {
      redirect(
        `/staff/${slugSegment}/${id}?error=${encodeURIComponent(result.error ?? "")}`,
      );
    }

    redirect(`/staff/${slugSegment}?deleted=1`);
  }

  const title = creating ? `New ${entry.singular}` : nameOf();

  // Only three collections have a page of their own on the public site.
  const slug = typeof document?.slug === "string" ? document.slug : null;
  const href = slug ? publicHref(entry.key, slug) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/staff/${entry.slug}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-80 transition-colors duration-300 hover:text-blue"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {entry.label}
      </Link>

      <h1 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[38px] lg:leading-[1.1]">
        {title}
      </h1>

      {saved && (
        <p
          role="status"
          className="mt-6 rounded-card border border-green/30 bg-green-10 px-5 py-4 text-[15px] text-gray"
        >
          <strong className="font-semibold text-green">Saved.</strong> The
          website is already showing it.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] text-gray"
        >
          <strong className="font-semibold text-blue">Not saved.</strong> {error}
        </p>
      )}

      {/* Said once, plainly, above the form — rather than leaving somebody to
          work out from greyed-out boxes why nothing they type stays. */}
      {!writable && (
        <p className="mt-6 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] leading-relaxed text-gray">
          <strong className="font-semibold text-blue">
            You are reading this, not editing it.
          </strong>{" "}
          {readOnlyReason(entry.group, authorId)}
        </p>
      )}

      <form action={save} className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-x-12">
        {/* One `disabled` on a fieldset turns off every input, select,
            textarea and button inside it, which is the whole read-only mode
            for everything except the rich text editor — a contenteditable div,
            which the browser does not know to disable. That one is told
            separately. */}
        <fieldset
          disabled={!writable}
          className="contents"
          aria-label={writable ? undefined : "Read only"}
        >
          <div className="flex flex-col gap-7 lg:col-span-8">
            {main.map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={valueOf(field.name, field.type)}
                mediaOptions={mediaOptions}
                parentOptions={parentOptions}
                readOnly={!writable}
              />
            ))}
          </div>

          <aside className="flex flex-col gap-7 lg:col-span-4">
            <div className="flex flex-col gap-7 rounded-[20px_20px_0_20px] border border-gray-15 p-6">
              {rail.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={valueOf(field.name, field.type)}
                  mediaOptions={mediaOptions}
                  parentOptions={parentOptions}
                  readOnly={!writable}
                />
              ))}
            </div>

            {writable && (
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
              >
                {creating ? `Create ${entry.singular}` : "Save changes"}
              </button>
            )}

            {href && (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue"
              >
                View on the website
                <ExternalLink className="size-4" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </aside>
        </fieldset>
      </form>

      {/* Outside the form, and deliberately. A second form cannot be nested
          inside the first, and this should not sit beside Save either — the
          two actions want distance between them, not adjacency.

          Shown only to somebody who may actually do it. An editor sees no
          delete on their own news — taking a published page down is an admin's
          call, and setting the status back to draft does the thing they
          usually want without the part that cannot be undone. */}
      {deletable && (
        <div className="mt-12 flex flex-col gap-4 border-t border-gray-15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-blue">
              Delete this {entry.singular}
            </h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-gray">
              It is removed from the website immediately and cannot be brought
              back. To take something off the site without losing it, set its
              status to draft instead.
            </p>
          </div>

          <ConfirmDialog
            action={remove}
            triggerLabel={`Delete ${entry.singular}`}
            title={`Delete “${title}”?`}
            body={`This ${entry.singular} will be removed from the website and from the panel. It cannot be undone, and there is no copy to restore from. If you only want it off the site for now, cancel and set its status to draft instead.`}
            confirmLabel="Delete permanently"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Why the form is greyed out, in the terms the reader is in.
 *
 * Two different situations produce the same screen and want different
 * sentences. One is "this part of the site is not yours to change", which is
 * about the role. The other is "this particular piece of writing is somebody
 * else's", which is about the document — and that one has to say what to do
 * next, because the person reading it usually has a reason to want the edit.
 */
function readOnlyReason(group: string, authorId: number | null): string {
  if (group === "Publishing" || group === "Library") {
    return authorId === null
      ? "This was here before the panel recorded who writes what, so only an admin can change it."
      : "A colleague wrote this. Ask them, or ask an admin, if it needs changing.";
  }

  return `${group} is looked after by the admins. You can read it here, and an admin can change it.`;
}

/** Where this document lives on the public site, where it has a page of its own. */
function publicHref(collection: string, slug: string): string {
  switch (collection) {
    case "news":
      return `/news-insights/news/${slug}`;
    case "stories":
      return `/our-impact/stories/${slug}`;
    case "programmes":
      return `/what-we-do/programmes/${slug}`;
    default:
      return "/";
  }
}
