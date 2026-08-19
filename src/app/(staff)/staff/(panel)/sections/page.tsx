import { redirect } from "next/navigation";
import { ChevronRight, RotateCcw } from "lucide-react";

import { bannerPath, getSectionsForPanel } from "@/cms/content/sections";
import { requireAdmin } from "@/staff/auth/guard";
import { getMediaOptions } from "@/staff/queries/document";
import {
  getPageBanners,
  resetSection,
  savePageBanner,
  saveSection,
} from "@/staff/queries/sections";
import { MediaPicker, type PickerOption } from "@/staff/ui/media-picker";
import iconSet from "@/lib/icons.json";
import type { SectionItem } from "@/staff/db/schema";

export const metadata = { title: "Page sections" };

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
 * And folded shut, twice. There are ten pages and forty-odd bands between
 * them, which unfolded is several thousand pixels of form to scroll past to
 * reach the one line somebody came to fix — and What We Do alone is twelve of
 * those bands, so opening the page was still most of the problem. So the bands
 * fold too: closed, this page is a list of the site's pages, an opened page is
 * a list of its bands, and reaching a form is two clicks. Saving reopens both
 * folds and returns to the form itself, so neither ever costs anybody their
 * place.
 *
 * `<details>`, so it works without JavaScript, survives a slow panel, and the
 * browser's own find-in-page can still reach inside a closed one.
 *
 * THE BANNER PHOTOGRAPHS ARE HERE TOO.
 *
 * They had a screen of their own — Page banners, a list of routes — which meant
 * that changing what a page opens with was two screens: the words on this one,
 * the picture behind them on that one, joined by nothing a reader could see. A
 * page header is one thing. So the banner sits in the header section's own
 * form, keyed by the same route, and the separate screen is gone.
 *
 * The site-wide default is not offered here. It is one photograph, set once and
 * standing behind every page that has not been given its own — which is a
 * decision, not a setting somebody comes back to. Putting it at the top of this
 * page put the one control nobody should touch above the twelve they came for.
 * The per-page pickers below are the whole of what is changed day to day; the
 * `*` row is edited in the database on the rare occasion it changes.
 *
 * EACH BOX HOLDS WHAT THE PAGE SAYS NOW, default or edit alike. It held only
 * the edit for a while — blank on every field nobody had typed in, with the
 * real wording printed underneath as "Empty uses: …" — which meant editing a
 * sentence began by copying it out of the help text, and a panel of empty boxes
 * over a site full of words reads as a panel that has lost them.
 *
 * What follows from that is one rule in `saveSection`: a field matching what
 * the code ships is not an override and is not stored. Otherwise every Save
 * would write the defaults into the database, "put it back" would restore
 * whatever the code happened to say that day, and every band on the site would
 * carry an Edited badge.
 *
 * So there is still no separate reset for a single field — clearing it is the
 * reset — and Reset on the section is the same gesture for all of them at once.
 * See `cms/content/sections.ts` for why the defaults live in code.
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

  const [sections, mediaOptions, banners] = await Promise.all([
    getSectionsForPanel(),
    getMediaOptions(),
    getPageBanners(),
  ]);

  const images = mediaOptions.filter((option) =>
    option.mimeType.startsWith("image/"),
  );
  const videos = mediaOptions.filter((option) =>
    option.mimeType.startsWith("video/"),
  );

  /**
   * Each section with the banner it owns, where it owns one.
   *
   * `bannerPath` is what says so — a page header is keyed by its route and so
   * is its photograph, which is the whole of the join. Everything below reads
   * this rather than the two lists, so a section and its picture cannot come
   * apart.
   */
  const all = sections.map((section) => {
    const path = bannerPath(section.key);
    return {
      ...section,
      /**
       * A page's opening block, as opposed to a band further down it.
       *
       * Its picture is the banner and nothing renders the band background, so
       * a header is offered the banner pickers instead of that one — two
       * photograph fields where only one of them shows up on the site is how
       * somebody sets the wrong one and concludes the panel is broken.
       */
      isHeader: section.key.startsWith("header:"),
      path,
      banner: (path && banners[path]) || null,
    };
  });

  const pages = [...new Set(all.map((section) => section.page))];

  /**
   * The page to leave open: the one holding the section just saved or put
   * back, and none on a first visit.
   */
  const openPage = all.find(
    (section) => section.key === (saved ?? reset),
  )?.page;

  async function save(formData: FormData) {
    "use server";

    await requireAdmin("sections");

    const key = String(formData.get("key") ?? "");
    const imageId = String(formData.get("imageId") ?? "").trim();

    /**
     * The blocks, read back out of the numbered fields.
     *
     * `itemCount` says how many rows the form drew — the shipped list plus one
     * spare, the same arrangement the impact figures use, so adding a card
     * does not need a button that adds one. A row whose title is blank is
     * dropped, which is how one gets deleted.
     *
     * Absent entirely on a section with no list, and null then means "leave
     * the shipped list alone" rather than "empty it".
     */
    const itemCount = Number(formData.get("itemCount") ?? -1);
    const items =
      itemCount < 0
        ? null
        : Array.from({ length: itemCount }, (_, index) => ({
            title: String(formData.get(`item-${index}-title`) ?? "").trim(),
            body: String(formData.get(`item-${index}-body`) ?? "").trim() || undefined,
            icon: String(formData.get(`item-${index}-icon`) ?? "").trim() || undefined,
            points: readPoints(String(formData.get(`item-${index}-points`) ?? "")),
          })).filter((item) => item.title !== "");

    await saveSection(key, {
      eyebrow: String(formData.get("eyebrow") ?? ""),
      heading: String(formData.get("heading") ?? ""),
      body: String(formData.get("body") ?? ""),
      imageId: imageId === "" ? null : Number(imageId),
      items,
    });

    /**
     * And the banner, where this section is a page header.
     *
     * Derived from the key rather than read from a hidden field: the key is
     * already checked against the registry by `saveSection`, so the route
     * cannot be anything the site does not render. A posted path could be.
     */
    const path = bannerPath(key);
    if (path) await savePageBanner(path, readBanner(formData));
    // The key, not a 1. It is what reopens the page this section is on and
    // scrolls back to the form somebody was just typing in — a panel that
    // collapses everything on save has thrown the reader back to the top of a
    // list of ten pages to find their place again.
    redirect(`/staff/sections?saved=${encodeURIComponent(key)}#${key}`);
  }

  async function reverse(formData: FormData) {
    "use server";

    await requireAdmin("sections");
    const key = String(formData.get("key") ?? "");
    await resetSection(key);

    // The photograph is part of what "put it back" means here. Two nulls is a
    // delete, which drops the page back onto the site-wide default.
    const path = bannerPath(key);
    if (path) await savePageBanner(path, { imageId: null, videoId: null });

    redirect(`/staff/sections?reset=${encodeURIComponent(key)}#${key}`);
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
          Page sections
        </h1>
        <p className="max-w-[58ch] text-base leading-relaxed text-gray">
          The headings, short introductions and banner photographs on the
          site&rsquo;s pages. Each box holds what the page says now — change it
          and save. Clearing a box puts the original wording back.
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

      {pages.map((page) => {
        const onPage = all.filter((section) => section.page === page);
        const edited = onPage.filter(isEdited).length;

        return (
        <details
          key={page}
          // Open the page somebody has just saved on, closed otherwise.
          open={page === openPage}
          className="group mt-5 rounded-card border border-gray-15 first-of-type:mt-10"
        >
          {/* The same corners as the box it opens — a square hover tint inside a
              20px border shows four white notches at the top of the fold.
              Squared off underneath once it is open, where the row meets the
              hairline over the forms rather than the outside of the card. */}
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card px-6 py-5 transition-colors duration-300 group-open:rounded-b-none hover:bg-blue-08 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-3">
              <ChevronRight
                className="size-4 shrink-0 text-gray-80 transition-transform duration-300 group-open:rotate-90"
                aria-hidden="true"
              />
              <span className="text-xl font-bold tracking-[-0.02em] text-blue">
                {page}
              </span>
            </span>
            {/* What is inside, so the fold does not hide whether anything on
                this page has been changed. */}
            <span className="shrink-0 text-[13px] text-gray-80">
              {onPage.length} {onPage.length === 1 ? "band" : "bands"}
              {edited > 0 && ` · ${edited} edited`}
            </span>
          </summary>

          <div className="flex flex-col gap-5 border-t border-gray-15 p-6">
            {onPage
              .map((section) => (
                /* Shut, like the page holding it. Opening What We Do used to
                   unroll twelve forms at once — several screens of fields to
                   scroll past to reach the one band somebody came for, which is
                   the problem the outer fold was added to solve, one level
                   down. Closed, a page is a list of its bands, and opening one
                   is a second click.

                   A NAMED GROUP, because this sits inside another `group` and
                   an unnamed one here would make every chevron on the page turn
                   when the page itself opens. */
                <details
                  key={section.key}
                  id={section.key}
                  // The band just saved or put back — the same one the redirect
                  // scrolls to, so it is open when the reader lands on it.
                  open={section.key === (saved ?? reset)}
                  className="group/band scroll-mt-8 rounded-card border border-gray-15"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card px-6 py-5 transition-colors duration-300 group-open/band:rounded-b-none hover:bg-blue-08 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-3">
                      <ChevronRight
                        className="size-4 shrink-0 text-gray-80 transition-transform duration-300 group-open/band:rotate-90"
                        aria-hidden="true"
                      />
                      <span className="text-[15px] font-semibold text-blue">
                        {section.label}
                      </span>
                    </span>
                    {isEdited(section) && (
                      <span className="shrink-0 rounded-full bg-blue-08 px-3 py-1 text-xs font-semibold text-blue">
                        Edited
                      </span>
                    )}
                  </summary>

                <form action={save} className="border-t border-gray-15 p-6">
                  <input type="hidden" name="key" value={section.key} />

                  {/* A band that is a list and nothing else has no words of
                      its own — the sectors run under Our Approach's heading.
                      Offering three copy fields and a photograph for a band
                      that renders none of them is the same lie as a picker
                      that changes nothing. */}
                  <div
                    className={`flex-col gap-5 ${section.itemsOnly ? "hidden" : "flex"}`}
                  >
                    <Field
                      id={`${section.key}-eyebrow`}
                      name="eyebrow"
                      label="Small line above"
                      value={section.edited.eyebrow ?? section.defaults.eyebrow ?? ""}
                      original={section.defaults.eyebrow}
                      computed={section.computed.includes("eyebrow")}
                    />
                    <Field
                      id={`${section.key}-heading`}
                      name="heading"
                      label="Heading"
                      value={section.edited.heading ?? section.defaults.heading ?? ""}
                      original={section.defaults.heading}
                      computed={section.computed.includes("heading")}
                    />
                    <Field
                      id={`${section.key}-body`}
                      name="body"
                      label="Introduction"
                      value={section.edited.body ?? section.defaults.body ?? ""}
                      original={section.defaults.body}
                      computed={section.computed.includes("body")}
                      multiline
                    />

                    {/* Offered on every band, including the ones that are
                        plain white today. Leaving it empty is what keeps a
                        section looking exactly as it does now, so this can be
                        added where there was never a photograph without
                        anything changing until somebody chooses one. */}
                    {!section.isHeader && (
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor={`${section.key}-image`}
                          className="text-sm font-semibold text-blue"
                        >
                          Background photograph
                        </label>
                        <p className="text-[13px] leading-relaxed text-gray-80">
                          Optional. Leave it empty and the section keeps the
                          background it has now.
                        </p>
                        <MediaPicker
                          id={`${section.key}-image`}
                          name="imageId"
                          value={section.edited.imageId ?? null}
                          kind="image"
                          options={images}
                        />
                      </div>
                    )}

                    {/* Only on a page header — a band further down a page
                        has no banner, it has the background picker above. */}
                    {section.path && (
                      <BannerFields
                        idPrefix={section.key}
                        banner={section.banner}
                        images={images}
                        videos={videos}
                        note={
                          section.path === "/"
                            ? "Leave both empty and the home page keeps the footage it ships with — the film on the CDN, cut in two sizes so a phone is not sent the large one. Choosing a photograph here replaces it: the page then opens on that picture, and on whatever video is chosen beneath it."
                            : undefined
                        }
                      />
                    )}
                  </div>

                  {section.itemsShipped && (
                    <SectionItems
                      sectionKey={section.key}
                      shipped={section.itemsShipped}
                      edited={section.edited.items}
                    />
                  )}

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
                </details>
              ))}
          </div>
        </details>
        );
      })}

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

/**
 * The banner behind a page's title: the photograph, and the footage over it.
 *
 * The same two controls whether it is one page's own banner or the site-wide
 * default, because they are the same choice — which is the point of them
 * living here rather than on a screen of their own.
 */
function BannerFields({
  idPrefix,
  banner,
  images,
  videos,
  note,
}: {
  idPrefix: string;
  banner: { imageId: number | null; videoId: number | null } | null;
  images: PickerOption[];
  videos: PickerOption[];
  /** What leaving both empty means, where it means more than "no picture". */
  note?: string;
}) {
  return (
    <>
      {note && (
        <p className="rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[13px] leading-relaxed text-gray">
          {note}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${idPrefix}-banner-image`}
          className="text-sm font-semibold text-blue"
        >
          Banner photograph
        </label>
        <p className="text-[13px] leading-relaxed text-gray-80">
          Landscape, and busy at the edges rather than the middle — the title
          sits over the left of it. A dark scrim is laid over the whole picture
          so white type stays legible, so a bright photograph is fine.
        </p>
        <MediaPicker
          id={`${idPrefix}-banner-image`}
          name="bannerImageId"
          value={banner?.imageId ?? null}
          kind="image"
          options={images}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${idPrefix}-banner-video`}
          className="text-sm font-semibold text-blue"
        >
          Banner video
        </label>
        <p className="text-[13px] leading-relaxed text-gray-80">
          Optional. An MP4 or WebM loop, silent, up to 60MB — a short one at
          1080p is about 10MB. The photograph above stays and becomes the still
          behind it: it is what paints first, and what somebody on a slow
          connection or with reduced motion set sees instead of the footage. A
          video with no photograph is not used.
        </p>
        <MediaPicker
          id={`${idPrefix}-banner-video`}
          name="bannerVideoId"
          value={banner?.videoId ?? null}
          kind="video"
          options={videos}
        />
      </div>
    </>
  );
}

/** The two pickers, read back off the form. */
function readBanner(formData: FormData): {
  imageId: number | null;
  videoId: number | null;
} {
  const id = (name: string) => {
    const raw = String(formData.get(name) ?? "").trim();
    return raw === "" ? null : Number(raw);
  };

  return { imageId: id("bannerImageId"), videoId: id("bannerVideoId") };
}

/**
 * One line of a band's copy, holding what the page says now.
 *
 * It used to hold only the override — blank on every field nobody had typed
 * in, with the real wording printed underneath as "Empty uses: …". So editing
 * a sentence meant reading it out of the help text and typing it back in, and
 * a panel full of empty boxes over a site full of words looks like a panel
 * that has lost them.
 *
 * The box holds the words. Underneath it says only what is worth saying: what
 * this used to be, where somebody has changed it, and why it is blank on the
 * handful of fields the page counts for itself. Clearing it puts the original
 * back — `saveSection` stores nothing for a field that matches what the code
 * ships, so an untouched Save changes nothing.
 */
function Field({
  id,
  name,
  label,
  value,
  original,
  computed,
  multiline,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  /** The wording the site ships with, where there is one. */
  original?: string;
  /** The page writes this one itself, so there is nothing to ship. */
  computed?: boolean;
  multiline?: boolean;
}) {
  const changed = original !== undefined && value !== original;

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

      {/* Quoted, so an original that is itself a sentence does not read as
          instructions. */}
      {changed ? (
        <p className="text-[13px] leading-relaxed text-gray-80">
          Originally: <span className="text-gray">“{original}”</span> — clear
          the box to put it back.
        </p>
      ) : computed ? (
        <p className="text-[13px] leading-relaxed text-gray-80">
          Empty because the page writes this one itself and it changes — a
          count, or whether there is anything to list. Type something here to
          fix it in place instead.
        </p>
      ) : original === undefined ? (
        <p className="text-[13px] leading-relaxed text-gray-80">
          Empty leaves this out.
        </p>
      ) : null}
    </div>
  );
}


/**
 * The repeated blocks inside a section.
 *
 * The four Areas cards, the model's pillars, the steps of the journey. One
 * form for all of them, because they are all a title, a paragraph and
 * sometimes an icon — six shapes would be six forms to learn for no
 * difference the person filling them in can see.
 *
 * ONE SPARE ROW AT THE END, so adding a block does not need a button that adds
 * one; the same arrangement the impact figures use. Clearing a row's title is
 * how one is removed — `save` drops every row that has no title, which makes
 * "delete this card" the same gesture as "leave the spare one blank".
 */
function SectionItems({
  sectionKey,
  shipped,
  edited,
}: {
  sectionKey: string;
  shipped: SectionItem[];
  edited?: SectionItem[];
}) {
  const current = edited ?? shipped;
  const rows = [...current, { title: "", body: "", icon: "" }];

  return (
    <div className="mt-8 border-t border-gray-15 pt-6">
      <h4 className="text-xs font-semibold tracking-[0.14em] text-gray-80">
        BLOCKS IN THIS SECTION
      </h4>
      <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-gray-80">
        The cards this section shows, in order. Clear a title to remove that
        block; the empty row at the end is there to add one.
      </p>

      <input type="hidden" name="itemCount" value={rows.length} />

      <div className="mt-5 flex flex-col gap-4">
        {rows.map((item, index) => (
          <fieldset
            key={index}
            className="flex flex-col gap-4 rounded-card border border-gray-15 p-5"
          >
            <legend className="px-2 text-[13px] font-semibold text-blue">
              {item.title || `Block ${index + 1}`}
            </legend>

            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${sectionKey}-item-${index}-title`}
                className="text-sm font-semibold text-blue"
              >
                Title
              </label>
              <input
                id={`${sectionKey}-item-${index}-title`}
                name={`item-${index}-title`}
                defaultValue={item.title}
                className={input}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${sectionKey}-item-${index}-body`}
                className="text-sm font-semibold text-blue"
              >
                Text
              </label>
              <textarea
                id={`${sectionKey}-item-${index}-body`}
                name={`item-${index}-body`}
                rows={2}
                defaultValue={item.body ?? ""}
                className={input}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${sectionKey}-item-${index}-points`}
                className="text-sm font-semibold text-blue"
              >
                Points inside this block
              </label>
              <p className="text-[13px] leading-relaxed text-gray-80">
                One per line. Put a dash between a point&rsquo;s name and its
                sentence where it has both — “Home visits — coaching every
                household”. Leave empty where the block is just a title and
                some text.
              </p>
              <textarea
                id={`${sectionKey}-item-${index}-points`}
                name={`item-${index}-points`}
                rows={4}
                defaultValue={(item.points ?? [])
                  .map((point) => (point.body ? `${point.title} — ${point.body}` : point.title))
                  .join("\n")}
                className={input}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${sectionKey}-item-${index}-icon`}
                className="text-sm font-semibold text-blue"
              >
                Icon
              </label>
              <p className="text-[13px] leading-relaxed text-gray-80">
                Only some sections draw one. Leave it as “None” where the
                block has no icon.
              </p>
              <select
                id={`${sectionKey}-item-${index}-icon`}
                name={`item-${index}-icon`}
                defaultValue={item.icon ?? ""}
                className={input}
              >
                <option value="">None</option>
                {(iconSet as { id: string }[]).map((icon) => (
                  <option key={icon.id} value={icon.id}>
                    {icon.id}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}


/**
 * The points inside a block, read back out of one textarea.
 *
 * One per line, with an optional em or en dash separating a name from its
 * sentence. A textarea rather than a repeating sub-form because these are
 * short and there are often five of them: a form that nests is a form nobody
 * fills in, and the dash is a convention somebody can see in the field itself
 * rather than a rule they have to be told.
 */
function readPoints(raw: string): { title: string; body?: string }[] | undefined {
  const points = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...rest] = line.split(/\s+[—–-]\s+/);
      const body = rest.join(" — ").trim();
      return { title: title.trim(), body: body || undefined };
    })
    .filter((point) => point.title !== "");

  // Undefined rather than an empty array, so a block with no points does not
  // carry an empty list around in the JSON.
  return points.length > 0 ? points : undefined;
}

/**
 * Has anybody changed this band?
 *
 * Any one of the overrides counts, the banner included — but only where it
 * actually differs from what the code ships. The panel says so twice — as a badge
 * on the band and as a count on the closed page — and asking the question in
 * one place is what keeps the two answers the same.
 */
function isEdited(section: {
  defaults: { eyebrow?: string; heading?: string; body?: string };
  edited: {
    eyebrow?: string | null;
    heading?: string | null;
    body?: string | null;
    imageId?: number | null;
    items?: SectionItem[] | null;
  };
  /** The banner row, on a page header. Having one at all is the override. */
  banner?: { imageId: number | null; videoId: number | null } | null;
}): boolean {
  // A stored value that matches the default is not an edit. `saveSection` no
  // longer writes one, but rows from before it stopped are still in the table
  // and a badge that says "Edited" over the shipped wording is a lie.
  const differs = (edit: string | null | undefined, original?: string) =>
    Boolean(edit) && edit !== original;

  const { eyebrow, heading, body, imageId, items } = section.edited;
  return (
    differs(eyebrow, section.defaults.eyebrow) ||
    differs(heading, section.defaults.heading) ||
    differs(body, section.defaults.body) ||
    Boolean(imageId || items || section.banner)
  );
}
