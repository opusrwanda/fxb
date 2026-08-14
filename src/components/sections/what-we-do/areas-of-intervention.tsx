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
          {cards.map((area, index) => {
            // Alternating grounds, so four cards read as two pairs rather than
            // as one long block of colour. The order follows the list, so
            // reordering the cards in the panel reorders the colours with them
            // and no card can end up beside another of its own colour.
            const green = index % 2 === 1;

            return (
              <Reveal as="li" key={area.id} delay={60 + Math.min(index, 3) * 60}>
                {/* Deliberately not a link, and takes no pointer cursor: the
                    areas are explained here and nowhere else, so there is
                    nothing to click through to and a card that looked
                    clickable would be a promise the page cannot keep. */}
                <article
                  id={area.id}
                  className={`wedge flex h-full scroll-mt-32 flex-col gap-6 p-8 text-white lg:p-10 ${
                    green ? "bg-[var(--color-green-deep)]" : "bg-blue"
                  }`}
                >
                  <div className="flex items-center gap-5">
                    {/* White on the colour rather than blue on a tint — the
                        ring is now a hole in the card rather than a badge on
                        it, which is what a solid ground wants. */}
                    <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white/12">
                      {area.icon && (
                        <BrandIcon id={area.icon} className="size-12 text-white" />
                      )}
                    </span>
                    <h3 className="text-[26px] leading-tight font-bold tracking-[-0.02em] lg:text-[30px]">
                      {area.label}
                    </h3>
                  </div>

                  {area.blurb && (
                    <p className="text-base leading-relaxed text-white-94 lg:text-[17px]">
                      {area.blurb}
                    </p>
                  )}

                  {area.focus.length > 0 && (
                    <ul className="flex flex-col gap-3 border-t border-white-12 pt-6">
                      {area.focus.map((item) => (
                        <li key={item} className="flex gap-3.5">
                          <span
                            className="mt-2 size-1.5 shrink-0 rounded-full bg-white/60"
                            aria-hidden="true"
                          />
                          <span className="text-[15px] leading-snug text-white-94">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* The photograph, in a panel of its own at the foot of the
                      card.

                      3:2, which is the shape every one of these photographs
                      already is — 2400×1600. The panel was 16:9 and cropped a
                      quarter of the height away, which on the Health card took
                      the bottom off the child drinking and made a perfectly
                      good picture look damaged.

                      `mt-auto` pins it to the bottom however much or little the
                      activities list above it runs to, so a row of cards ends
                      level. The panel keeps its height whether or not the
                      picture is showing, so nothing reflows on hover — a card
                      that grew under the pointer would push its neighbour.

                      No tint behind it. A faintly lit rectangle sitting empty
                      on three cards while the fourth holds a photograph reads
                      as three pictures that failed to load; plain ground reads
                      as space the card was given. */}
                  {area.photo && (
                    <div className="relative mt-auto aspect-3/2 overflow-hidden rounded-[14px]">
                      <Image
                        src={photo(area.photo).url}
                        alt={area.alt}
                        fill
                        sizes="(min-width: 1024px) 42vw, 84vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                </article>
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </SectionBand>
  );
}
