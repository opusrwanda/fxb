import Image from "next/image";
import { BrandIcon, type IconId } from "@/components/brand/icon";
import { Container } from "@/components/layout/container";
import { SectionBand } from "@/components/layout/section-band";
import { getSection } from "@/cms/content/sections";
import { Reveal } from "@/components/ui/reveal";
import { areas } from "@/lib/areas";
import { photo } from "@/lib/photos";

/**
 * Areas of Intervention — four cards, per the brief.
 *
 * Each card carries its own anchor as well as the section's, because the home
 * page's four pillars link straight to the individual areas
 * (`/what-we-do#health` and so on) rather than to the block.
 *
 * The brief's eventual shape for these is "Context, Goal, Activities, Impact",
 * with the copy "to be provided later". Rather than stub four empty headings,
 * each card shows what FXB has actually written: the focus areas listed under
 * the same four headings in the Our Impact section. See `areas.ts`.
 */
export async function AreasOfIntervention() {
  const copy = await getSection("what-we-do:areas");

  /**
   * The cards, with the panel's words over the code's structure.
   *
   * The length follows the panel once anything has been edited there, so
   * removing a card removes it. Everything a card needs that is not words —
   * its anchor, its photograph, the id the home page's pillars link to — comes
   * from the array below by position, because none of those is a thing anybody
   * would want to type. A fifth card added in the panel therefore has no
   * photograph of its own and renders without one rather than borrowing
   * somebody else's.
   */
  const cards = (
    copy.items.length > 0
      ? copy.items
      : areas.map((area) => ({
          title: area.label,
          body: area.blurb,
          icon: area.id,
          points: area.focus.map((focus) => ({ title: focus })),
        }))
  ).map((item, index) => ({
    id: areas[index]?.id ?? `area-${index}`,
    label: item.title,
    blurb: item.body ?? "",
    icon: (item.icon ?? areas[index]?.id) as IconId | undefined,
    focus: (item.points ?? []).map((point) => point.title),
    photo: areas[index]?.photo,
    alt: areas[index]?.alt ?? "",
  }));
  return (
    <SectionBand section={copy} id="areas" className="scroll-mt-36 bg-green-10 py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                {copy.eyebrow}
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
              {copy.heading}
            </h2>
          </div>
          <p className="max-w-[46ch] text-base leading-relaxed text-gray lg:text-[17px]">
            The model is delivered through four areas of intervention. A family
            rarely needs only one of them, which is why we never run them apart.
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-10">
          {cards.map((area, index) => (
            <Reveal as="li" key={area.id} delay={60 + Math.min(index, 3) * 60}>
              {/* The anchor sits on the article rather than the Reveal
                  wrapper, which takes no id — and it is what the home page's
                  four pillars jump to, so it needs the header offset. */}
              <article id={area.id} className="flex h-full scroll-mt-32 flex-col">
                {/* Absent rather than empty on a card added in the panel,
                    which has no photograph of its own. `next/image` throws on
                    a blank `src`, and a card without a picture reads perfectly
                    well as one. */}
                {area.photo && (
                <div className="wedge relative aspect-16/10 overflow-hidden">
                  <Image
                    src={photo(area.photo).url}
                    alt={area.alt}
                    fill
                    sizes="(min-width: 1024px) 46vw, 90vw"
                    className="object-cover"
                  />
                </div>
                )}

                {/* The guide draws one icon per area of intervention, keyed by
                    the same ids `areas.ts` uses, so the pairing is the data's
                    rather than a lookup table's. It sits on the heading line
                    because that is the line it illustrates — floated above the
                    photograph it would have read as a badge on the picture. */}
                <div className="mt-7 flex items-center gap-4 text-blue">
                  {/* A real container with real padding. The icon used to sit
                      bare on the card and looked like it had a tinted box
                      behind it whose artwork ran to the edges — that box was an
                      extraction artefact, not a container, and is gone. This is
                      the container it looked like it wanted: tinted, round,
                      with the drawing inset evenly on every side.

                      80px holding a 48px drawing, up from 56 holding 32. These
                      are the site's own icons and the one place they are drawn
                      at any size — at 32px the distinguishing detail in them,
                      which is what tells a reader that this card is about
                      health rather than education, was too small to read. The
                      proportion is kept so the ring still looks like a
                      container rather than a border. */}
                  <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-blue-08">
                    {area.icon && (
                      <BrandIcon id={area.icon} className="size-12" />
                    )}
                  </span>
                  <h3 className="text-[28px] font-bold tracking-[-0.02em] text-blue lg:text-[32px]">
                    {area.label}
                  </h3>
                </div>
                <p className="mt-2 text-base text-gray lg:text-[17px]">
                  {area.blurb}
                </p>

                {area.focus.length > 0 && (
                  <ul className="mt-6 flex flex-col gap-3 border-t border-gray-15 pt-6">
                    {area.focus.map((item) => (
                      <li key={item} className="flex gap-3.5">
                        <span
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-green"
                          aria-hidden="true"
                        />
                        <span className="text-[15px] leading-snug text-gray">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </Reveal>
          ))}
        </ul>
      </Container>
    </SectionBand>
  );
}
