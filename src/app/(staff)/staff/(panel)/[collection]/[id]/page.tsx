import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { findCollection } from "@/staff/collections";
import { mainFields, sidebarFields } from "@/staff/fields";
import {
  getDocument,
  getMediaOptions,
  isCollection,
  richTextToParagraphs,
  saveDocument,
} from "@/staff/queries/document";
import { FormField } from "@/staff/ui/fields";
import type { RichText } from "@/staff/db/schema";

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

  const [document, mediaOptions] = await Promise.all([
    creating ? null : getDocument(entry.key, numericId as number),
    getMediaOptions(),
  ]);

  if (!creating && !document) notFound();

  const main = mainFields(entry.key);
  const rail = sidebarFields(entry.key);

  /** The value a control should start with, converted for display. */
  const valueOf = (name: string, type: string): unknown => {
    const raw = document?.[name];
    if (type === "richtext") return richTextToParagraphs(raw as RichText | null);
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

  async function save(formData: FormData) {
    "use server";

    const key = entry!.key as Parameters<typeof saveDocument>[0];
    const result = await saveDocument(key, numericId, formData);

    if (!result.ok) {
      redirect(
        `/staff/${entry!.slug}/${id}?error=${encodeURIComponent(result.error)}`,
      );
    }

    redirect(`/staff/${entry!.slug}/${result.id}?saved=1`);
  }

  const title = creating ? `New ${entry.singular}` : nameOf();

  // Only three collections have a page of their own on the public site.
  const slug = typeof document?.slug === "string" ? document.slug : null;
  const href = slug ? publicHref(entry.key, slug) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/staff/${entry.slug}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-80 transition-colors duration-200 hover:text-blue"
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

      <form action={save} className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-x-12">
        <div className="flex flex-col gap-7 lg:col-span-8">
          {main.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={valueOf(field.name, field.type)}
              mediaOptions={mediaOptions}
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
              />
            ))}
          </div>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-90"
          >
            {creating ? `Create ${entry.singular}` : "Save changes"}
          </button>

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
      </form>
    </div>
  );
}

/** Where this document lives on the public site, where it has a page of its own. */
function publicHref(collection: string, slug: string): string {
  switch (collection) {
    case "news":
      return `/news-insights/news/${slug}`;
    case "stories":
      return `/news-insights/stories/${slug}`;
    case "programmes":
      return `/what-we-do/programmes/${slug}`;
    default:
      return "/";
  }
}
