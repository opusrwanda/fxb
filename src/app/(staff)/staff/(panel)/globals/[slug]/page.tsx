import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  DEFAULT_VALUES,
  type ImpactData,
  type SiteSettingsData,
} from "@/staff/db/schema";
import { getMediaOptions } from "@/staff/queries/document";
import {
  getGlobal,
  isGlobal,
  PLATFORMS,
  saveImpact,
  saveSiteSettings,
} from "@/staff/queries/globals";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: slug === "impact" ? "Impact figures" : "Site details" };
}

const input =
  "w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray transition-colors duration-200 outline-none focus:border-blue";

function Field({
  label,
  name,
  help,
  value,
  type = "text",
  rows,
}: {
  label: string;
  name: string;
  help?: string;
  value?: string | number | null;
  type?: string;
  rows?: number;
}) {
  const id = `g-${name}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-blue">
        {label}
      </label>
      {help && (
        <p id={`${id}-help`} className="text-[13px] leading-relaxed text-gray-80">
          {help}
        </p>
      )}
      {rows ? (
        <textarea
          id={id}
          name={name}
          rows={rows}
          aria-describedby={help ? `${id}-help` : undefined}
          defaultValue={value == null ? "" : String(value)}
          className={input}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          aria-describedby={help ? `${id}-help` : undefined}
          defaultValue={value == null ? "" : String(value)}
          className={input}
        />
      )}
    </div>
  );
}

/**
 * The two single documents.
 *
 * A global has no listing and no "add another", because there is one office
 * address and one set of reach figures. So this is the whole of it: open, edit,
 * save.
 */
export default async function GlobalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug } = await params;
  const { saved } = await searchParams;
  if (!isGlobal(slug)) notFound();

  const isImpact = slug === "impact";
  const title = isImpact ? "Impact figures" : "Site details";

  const [data, mediaOptions] = await Promise.all([
    isImpact
      ? getGlobal<ImpactData>("impact")
      : getGlobal<SiteSettingsData>("site-details"),
    getMediaOptions(),
  ]);

  const impact = (data ?? { figures: [], projectsDelivered: 0, note: null }) as ImpactData;
  const site = data as SiteSettingsData | null;

  // A spare blank row, so adding a figure does not need a button that adds one.
  const figureCount = isImpact ? impact.figures.length + 1 : 0;

  async function save(formData: FormData) {
    "use server";
    if (isImpact) await saveImpact(formData, figureCount);
    else await saveSiteSettings(formData);
    redirect(`/staff/globals/${slug}?saved=1`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/staff"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-80 transition-colors duration-200 hover:text-blue"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Link>

      <h1 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[38px]">
        {title}
      </h1>
      <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-gray">
        {isImpact
          ? "The reach figures on the home page and Our Impact. Leave a number blank where MEL has not split it out — the site shows the block without a figure rather than inventing one."
          : "The address, phone, email, social links, vision and mission that appear across the website."}
      </p>

      {saved && (
        <p
          role="status"
          className="mt-6 rounded-card border border-green/30 bg-green-10 px-5 py-4 text-[15px] text-gray"
        >
          <strong className="font-semibold text-green">Saved.</strong> The
          website is already showing it.
        </p>
      )}

      <form action={save} className="mt-8 flex flex-col gap-8">
        {isImpact ? (
          <>
            <Field
              label="FXBVillage projects delivered"
              name="projectsDelivered"
              value={impact.projectsDelivered}
              type="number"
            />
            <Field
              label="Note under the figures"
              name="note"
              rows={3}
              value={impact.note}
              help="Where the figures come from and when they were last updated. A page of large numbers with no word on their source is a weaker claim, not a stronger one."
            />

            <div className="flex flex-col gap-6">
              <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                THE FIGURES
              </h2>

              {Array.from({ length: figureCount }, (_, index) => {
                const figure = impact.figures[index];
                const isNew = !figure;
                return (
                  <fieldset
                    key={index}
                    className="flex flex-col gap-5 rounded-[20px_20px_0_20px] border border-gray-15 p-6"
                  >
                    <legend className="px-2 text-sm font-semibold text-blue">
                      {isNew ? "Add a figure" : figure.label}
                    </legend>

                    <Field label="Label" name={`figure-${index}-label`} value={figure?.label} />
                    <Field
                      label="Number"
                      name={`figure-${index}-value`}
                      type="number"
                      value={figure?.value ?? ""}
                      help="The number only, no commas or plus sign. Leave blank if MEL has not split this figure out."
                    />
                    <Field
                      label="Caption"
                      name={`figure-${index}-caption`}
                      rows={2}
                      value={figure?.caption}
                    />
                    <Field
                      label="Areas"
                      name={`figure-${index}-areas`}
                      rows={3}
                      value={(figure?.areas ?? []).join("\n")}
                      help="One per line. Revealed when someone points at the figure."
                    />

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor={`g-figure-${index}-photo`}
                        className="text-sm font-semibold text-blue"
                      >
                        Photograph
                      </label>
                      <select
                        id={`g-figure-${index}-photo`}
                        name={`figure-${index}-photo`}
                        defaultValue={figure?.photoId ? String(figure.photoId) : ""}
                        className={input}
                      >
                        <option value="">— none —</option>
                        {mediaOptions
                          .filter((option) => option.mimeType.startsWith("image/"))
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.filename}
                            </option>
                          ))}
                      </select>
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-6">
              <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                CONTACT
              </h2>
              <Field label="Email address" name="email" type="email" value={site?.email} />
              <Field label="Phone" name="phone" value={site?.phone} help="As displayed, e.g. +250 780 925 908." />
              <Field
                label="Phone link"
                name="phoneHref"
                value={site?.phoneHref}
                help="For the tap-to-call link, no spaces: +250780925908."
              />
              <Field label="Address" name="addressLine" value={site?.addressLine} />
              <Field label="District" name="addressDistrict" value={site?.addressDistrict} />
              <Field label="Country" name="addressCountry" value={site?.addressCountry} />
              <Field label="Office hours" name="officeHours" value={site?.officeHours} />
              <Field
                label="Map link"
                name="mapUrl"
                value={site?.mapUrl}
                help='Google Maps share link, used by the "Get directions" button.'
              />
              <Field
                label="Map embed"
                name="mapEmbedUrl"
                rows={3}
                value={site?.mapEmbedUrl}
                help='From Google Maps: Share > Embed a map > copy the src="..." address only.'
              />
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                VISION, MISSION &amp; VALUES
              </h2>
              <Field label="Vision" name="vision" rows={3} value={site?.vision} />
              <Field
                label="Phrases to stress in the vision"
                name="visionEmphasis"
                rows={4}
                value={(site?.visionEmphasis ?? []).join("\n")}
                help="One per line, exactly as they appear in the vision above. Each is shown at full strength against the words around it."
              />
              <Field label="Mission" name="mission" rows={3} value={site?.mission} />
              <Field
                label="Guiding values"
                name="values"
                rows={5}
                value={(site?.values ?? DEFAULT_VALUES).join("\n")}
                help="One per line, in the order they should be shown. They are numbered on Who We Are, so the order is the one people read."
              />
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                SOCIAL
              </h2>
              <p className="text-[13px] leading-relaxed text-gray-80">
                Leave one blank to take it off the site. These are the five the
                icon set covers.
              </p>
              {PLATFORMS.map((platform) => (
                <Field
                  key={platform}
                  label={platform === "x" ? "X" : platform[0].toUpperCase() + platform.slice(1)}
                  name={`social-${platform}`}
                  type="url"
                  value={site?.socials?.find((s) => s.platform === platform)?.url ?? ""}
                />
              ))}
              <Field
                label="External systems"
                name="externalSystems"
                rows={3}
                value={(site?.externalSystems ?? [])
                  .map((s) => `${s.label} | ${s.url}`)
                  .join("\n")}
                help="One per line, as: Name | https://address — shown in the header strip and the footer."
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="inline-flex h-12 w-fit items-center justify-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-90"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
