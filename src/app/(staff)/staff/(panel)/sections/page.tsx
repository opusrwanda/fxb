import { redirect } from "next/navigation";
import { RotateCcw } from "lucide-react";

import { getSectionsForPanel } from "@/cms/content/sections";
import { requireAdmin } from "@/staff/auth/guard";
import { resetSection, saveSection } from "@/staff/queries/sections";

export const metadata = { title: "Section text" };

const input =
  "w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray transition-colors duration-300 outline-none focus:border-blue";

/**
 * The words on the site that are not documents.
 *
 * Every band on the site carries three pieces of copy — the small tracked line
 * above, the heading, and the sentence under it — and all of them were written
 * into the components. Changing "Four areas of intervention" meant a developer
 * and a deploy, which is the wrong shape for a sentence somebody wants to
 * rephrase.
 *
 * Grouped by the page they appear on rather than listed flat, because that is
 * how somebody arrives here: they have just looked at a page and want to change
 * something they saw on it.
 *
 * Each field shows the default underneath it, and leaving a field empty means
 * "use that". So there is no separate reset for a single field — clearing it is
 * the reset — and Reset on the section is the same gesture for all three at
 * once. See `cms/content/sections.ts` for why the defaults live in code.
 */
export default async function SectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; reset?: string }>;
}) {
  const { saved, reset } = await searchParams;

  // Admin only. This is the copy on every public page of the site, and an
  // empty field here silently restores a default — which is a reasonable thing
  // to be able to do and not a reasonable thing to do by accident.
  await requireAdmin("sections");

  const all = await getSectionsForPanel();

  const pages = [...new Set(all.map((section) => section.page))];

  async function save(formData: FormData) {
    "use server";

    await requireAdmin("sections");

    const key = String(formData.get("key") ?? "");
    await saveSection(key, {
      eyebrow: String(formData.get("eyebrow") ?? ""),
      heading: String(formData.get("heading") ?? ""),
      body: String(formData.get("body") ?? ""),
    });
    redirect("/staff/sections?saved=1");
  }

  async function reverse(formData: FormData) {
    "use server";

    await requireAdmin("sections");
    await resetSection(String(formData.get("key") ?? ""));
    redirect("/staff/sections?reset=1");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-[0.14em] text-gray-80 uppercase">
            Settings
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[38px] lg:leading-[1.1]">
          Section text
        </h1>
        <p className="max-w-[58ch] text-base leading-relaxed text-gray">
          The headings and short introductions on the site&rsquo;s pages. Leave
          a field empty to use the wording the site ships with — it is shown
          under each one.
        </p>
      </header>

      {(saved || reset) && (
        <p
          role="status"
          className="mt-8 rounded-card border border-green/30 bg-green-10 px-5 py-4 text-[15px] text-gray"
        >
          <strong className="font-semibold text-green">
            {saved ? "Saved." : "Put back."}
          </strong>{" "}
          The website is already showing it.
        </p>
      )}

      {pages.map((page) => (
        <section key={page} className="mt-12">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
            {page}
          </h2>

          <div className="mt-5 flex flex-col gap-5">
            {all
              .filter((section) => section.page === page)
              .map((section) => (
                <form
                  key={section.key}
                  action={save}
                  className="rounded-card border border-gray-15 p-6"
                >
                  <input type="hidden" name="key" value={section.key} />

                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[15px] font-semibold text-blue">
                      {section.label}
                    </h3>
                    {(section.edited.eyebrow ||
                      section.edited.heading ||
                      section.edited.body) && (
                      <span className="rounded-full bg-blue-08 px-3 py-1 text-xs font-semibold text-blue">
                        Edited
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex flex-col gap-5">
                    <Field
                      id={`${section.key}-eyebrow`}
                      name="eyebrow"
                      label="Small line above"
                      value={section.edited.eyebrow ?? ""}
                      fallback={section.defaults.eyebrow}
                    />
                    <Field
                      id={`${section.key}-heading`}
                      name="heading"
                      label="Heading"
                      value={section.edited.heading ?? ""}
                      fallback={section.defaults.heading}
                    />
                    <Field
                      id={`${section.key}-body`}
                      name="body"
                      label="Introduction"
                      value={section.edited.body ?? ""}
                      fallback={section.defaults.body}
                      multiline
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-5">
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
                    >
                      Save
                    </button>

                    {/* Its own form, because it is a different action on the
                        same row and a second submit button inside the first
                        form would post the fields as well. */}
                    <button
                      type="submit"
                      form={`reset-${section.key}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray underline underline-offset-4 transition-colors duration-300 hover:text-blue"
                    >
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Put back to the original
                    </button>
                  </div>
                </form>
              ))}
          </div>
        </section>
      ))}

      {/* The reset forms, out of the way. A form cannot be nested inside
          another, so they live here and are reached by `form=` above. */}
      {all.map((section) => (
        <form key={`reset-${section.key}`} id={`reset-${section.key}`} action={reverse}>
          <input type="hidden" name="key" value={section.key} />
        </form>
      ))}
    </div>
  );
}

function Field({
  id,
  name,
  label,
  value,
  fallback,
  multiline,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  fallback?: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-blue">
        {label}
      </label>

      {multiline ? (
        <textarea id={id} name={name} rows={3} defaultValue={value} className={input} />
      ) : (
        <input id={id} name={name} type="text" defaultValue={value} className={input} />
      )}

      {/* What it says if this is left empty. Quoted, so a default that is
          itself a sentence does not read as instructions. */}
      {fallback ? (
        <p className="text-[13px] leading-relaxed text-gray-80">
          Empty uses: <span className="text-gray">“{fallback}”</span>
        </p>
      ) : (
        <p className="text-[13px] leading-relaxed text-gray-80">
          Empty leaves this out.
        </p>
      )}
    </div>
  );
}
