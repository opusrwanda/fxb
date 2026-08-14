import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  DEFAULT_VALUES,
  type ImpactData,
  type PromoBannerData,
  type SiteSettingsData,
} from "@/staff/db/schema";
import { requireAdmin } from "@/staff/auth/guard";
import { getMediaOptions } from "@/staff/queries/document";
import { MediaPicker } from "@/staff/ui/media-picker";
import {
  getGlobal,
  isGlobal,
  PLATFORMS,
  saveImpact,
  savePromoBanner,
  saveSiteSettings,
} from "@/staff/queries/globals";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title:
      slug === "impact"
        ? "Impact figures"
        : slug === "banner"
          ? "Home page banner"
          : "Site details",
  };
}

const input =
  "w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray transition-colors duration-300 outline-none focus:border-blue";

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
 * The single documents.
 *
 * A global has no listing and no "add another", because there is one office
 * address, one set of reach figures and one banner. So this is the whole of
 * it: open, edit, save.
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

  // Every global is Settings: the organisation's own address and phone number,
  // the reach figures printed across the home page, and the campaign strip
  // above it. Admin only.
  await requireAdmin(slug);

  const isImpact = slug === "impact";
  const isBanner = slug === "banner";
  const title = isImpact
    ? "Impact figures"
    : isBanner
      ? "Home page banner"
      : "Site details";

  const [data, mediaOptions] = await Promise.all([
    getGlobal<ImpactData | SiteSettingsData | PromoBannerData>(slug),
    getMediaOptions(),
  ]);

  const impact = (data ?? { figures: [], projectsDelivered: 0, note: null }) as ImpactData;
  const site = data as SiteSettingsData | null;
  const banner = (data ?? {
    enabled: false,
    imageId: null,
    href: "",
    until: null,
    height: "medium",
  }) as PromoBannerData;

  // A spare blank row, so adding a figure does not need a button that adds one.
  const figureCount = isImpact ? impact.figures.length + 1 : 0;

  async function save(formData: FormData) {
    "use server";
    await requireAdmin(slug);
    if (isImpact) await saveImpact(formData, figureCount);
    else if (isBanner) await savePromoBanner(formData);
    else await saveSiteSettings(formData);
    redirect(`/staff/globals/${slug}?saved=1`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/staff"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-80 transition-colors duration-300 hover:text-blue"
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
          : isBanner
            ? "A strip across the top of the home page, for the weeks when something is running that the whole site should lead with — Kwibuka, a fundraising appeal. Off the rest of the year."
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
                      {/* The same picker the collections use. This one listed
                          filenames alone — not even the description the other
                          select appended — so choosing the photograph beside a
                          reach figure meant recognising `fostering-03.jpg`. */}
                      <MediaPicker
                        id={`g-figure-${index}-photo`}
                        name={`figure-${index}-photo`}
                        value={figure?.photoId ?? null}
                        kind="image"
                        options={mediaOptions.filter((option) =>
                          option.mimeType.startsWith("image/"),
                        )}
                      />
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </>
        ) : isBanner ? (
          <>
            {/* The switch first, because it is the field that is actually
                touched. The picture and the link are set once when a campaign
                is prepared; this is what turns it on the morning it starts and
                off the morning it ends. */}
            <label className="flex cursor-pointer items-start gap-3 rounded-card border border-gray-15 p-5 transition-colors duration-300 has-checked:border-blue has-checked:bg-blue-08">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={banner.enabled}
                className="mt-0.5 size-4 shrink-0 accent-blue"
              />
              <span>
                <span className="block text-[15px] font-semibold text-blue">
                  Show the banner on the home page
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-gray">
                  Switch it off when the campaign ends. The picture and the link
                  are kept, so bringing it back next year is this tick and
                  nothing else.
                </span>
              </span>
            </label>

            <div className="flex flex-col gap-2">
              <label htmlFor="g-imageId" className="text-sm font-semibold text-blue">
                Banner image
              </label>
              <p id="g-imageId-help" className="text-[13px] leading-relaxed text-gray-80">
                A wide strip, running the full width of the screen at whichever
                height you pick below. Around 2400 × 400 pixels suits the
                medium size; anything close to square will be cropped to a band
                through its middle. Upload it to the library first — the
                description you gave it there is what a screen reader reads out,
                so it should say what the campaign is.
              </p>
              <MediaPicker
                id="g-imageId"
                name="imageId"
                value={banner.imageId}
                kind="image"
                options={mediaOptions.filter((option) =>
                  option.mimeType.startsWith("image/"),
                )}
              />
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-semibold text-blue">
                How tall the strip is
              </legend>
              <p className="text-[13px] leading-relaxed text-gray-80">
                Pick the one that suits the artwork. A wordmark and a date read
                fine in a thin band; a strip with a photograph and a headline in
                it needs the room.
              </p>
              {(
                [
                  { value: "short", label: "Short", note: "A thin band — a wordmark, a date, one line of type." },
                  { value: "medium", label: "Medium", note: "The usual choice. Room for artwork with a headline in it." },
                  { value: "tall", label: "Tall", note: "A designed strip with a photograph. Any bigger and it stops being a banner." },
                ] as const
              ).map((size) => (
                <label
                  key={size.value}
                  className="flex cursor-pointer gap-3 rounded-card border border-gray-15 p-4 transition-colors duration-300 hover:border-blue has-checked:border-blue has-checked:bg-blue-08"
                >
                  <input
                    type="radio"
                    name="height"
                    value={size.value}
                    defaultChecked={(banner.height ?? "medium") === size.value}
                    className="mt-1 size-4 shrink-0 accent-blue"
                  />
                  <span>
                    <span className="block text-[15px] font-semibold text-blue">
                      {size.label}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-gray">
                      {size.note}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>

            <Field
              label="Where it goes when clicked"
              name="href"
              value={banner.href}
              help="A page on this site, starting with a slash — /get-involved/donate — or a full address beginning https:// for somewhere else. Leave it empty and the strip shows without being clickable."
            />

            <Field
              label="Stop showing after"
              name="until"
              type="date"
              value={banner.until}
              help="Optional, and the field that stops a Kwibuka strip still being up in June. The banner shows through this day and takes itself down the morning after. Leave it empty to run until you switch it off."
            />
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
          className="inline-flex h-12 w-fit items-center justify-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
