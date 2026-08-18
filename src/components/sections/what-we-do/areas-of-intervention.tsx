import Image from "next/image";
import { BrandIcon } from "@/components/brand/icon";
import { Container } from "@/components/layout/container";
import { SectionBand } from "@/components/layout/section-band";
import { getSection } from "@/cms/content/sections";
import { Reveal } from "@/components/ui/reveal";
import { getAreas, type InterventionArea } from "@/cms/content/areas";

/**
 * Areas of Intervention — a card per area.
 *
 * Each card carries its own anchor as well as the section's, because the home
 * page's pillars link straight to the individual areas (`/what-we-do#health`
 * and so on) rather than to the block.
 *
 * TWO GROUPS, NOT ONE LIST. The core areas are what the FXBVillage model is,
 * and they lead; the other areas are work FXB Rwanda also does, and they
 * follow under a rule and a line of their own. The alternative — one run of
 * cards — would either bury the model among everything else or leave the rest
 * of the work off the page, and the team asked for neither.
 *
 * The areas themselves are managed in the panel under Areas of intervention:
 * the name, the line under it, the focus list, the photograph, the icon, the
 * category and the order are all fields. Nothing about a card is written here
 * any more except how it looks.
 *
 * The brief's eventual shape for these is "Context, Goal, Activities, Impact",
 * with the copy "to be provided later". Until then a card shows what FXB has
 * actually written: the focus areas listed under the same headings in the Our
 * Impact section.
 */
export async function AreasOfIntervention() {
  const copy = await getSection("what-we-do:areas");
  const all = await getAreas();
  const core = all.filter((area) => area.category === "core");
  const others = all.filter((area) => area.category === "other");

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
          {/* The count is counted, not typed. The areas are managed in the
              panel now, so a sentence that said "four" would be wrong the
              first time somebody added a fifth — and nobody adding one would
              think to come and look for the word. */}
          <p className="max-w-[46ch] text-base leading-relaxed text-gray lg:text-[17px]">
            The model is delivered through {spell(core.length)} core
            {core.length === 1 ? " area" : " areas"} of intervention. A family
            rarely needs only one of them, which is why we never run them apart.
          </p>
        </Reveal>

        <AreaCards areas={core} className="mt-14" />

        {others.length > 0 && (
          <>
            {/* A rule and a label rather than a second heading. The other
                areas are part of this section — giving them an <h2> of their
                own would read as a new band on the page, which is exactly the
                billing the split is there to avoid. */}
            <div className="mt-16 flex items-center gap-4 border-t border-gray-15 pt-8">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <h3 className="text-sm font-semibold tracking-[0.14em] text-gray-80 uppercase">
                Other areas of intervention
              </h3>
            </div>

            <AreaCards areas={others} className="mt-8" />
          </>
        )}

      </Container>
    </SectionBand>
  );
}

/**
 * A small number, written out.
 *
 * Only as far as the page could plausibly go; past that a numeral is the
 * honest way to write it anyway.
 */
function spell(count: number): string {
  const words = [
    "no",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ];
  return words[count] ?? String(count);
}

/**
 * A row of area cards.
 *
 * The two groups render through the same component because they are the same
 * thing — an area is an area, and a card that looked different below the rule
 * would say the work was of a different kind rather than of a different
 * standing.
 */
function AreaCards({
  areas,
  className = "",
}: {
  areas: InterventionArea[];
  className?: string;
}) {
  return (
    <ul className={`grid gap-8 lg:grid-cols-2 lg:gap-10 ${className}`}>
      {areas.map((area, index) => {
        // Alternating grounds, so the cards read as pairs rather than as one
        // long block of colour. The order follows the list, so reordering the
        // areas in the panel reorders the colours with them and no card can
        // end up beside another of its own colour.
        const green = index % 2 === 1;

        return (
          <Reveal as="li" key={area.slug} delay={60 + Math.min(index, 3) * 60}>
            {/* Deliberately not a link, and takes no pointer cursor: the areas
                are explained here and nowhere else, so there is nothing to
                click through to and a card that looked clickable would be a
                promise the page cannot keep. */}
            <article
              id={area.slug}
              className={`wedge flex h-full scroll-mt-32 flex-col gap-6 p-8 text-white lg:p-10 ${
                green ? "bg-[var(--color-green-deep)]" : "bg-blue"
              }`}
            >
              <div className="flex items-center gap-5">
                {/* White on the colour rather than blue on a tint — the ring is
                    a hole in the card rather than a badge on it, which is what
                    a solid ground wants. */}
                {area.icon && (
                  <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white/12">
                    <BrandIcon id={area.icon} className="size-12 text-white" />
                  </span>
                )}
                <h4 className="text-[26px] leading-tight font-bold tracking-[-0.02em] lg:text-[30px]">
                  {area.label}
                </h4>
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

              {/* The photograph, in a panel of its own at the foot of the card.

                  3:2, which is the shape every one of these photographs
                  already is. The panel was 16:9 and cropped a quarter of the
                  height away, which on the Health card took the bottom off the
                  child drinking and made a perfectly good picture look damaged.

                  `mt-auto` pins it to the bottom however much or little the
                  list above it runs to, so a row of cards ends level.

                  No tint behind it. A faintly lit rectangle sitting empty on
                  three cards while the fourth holds a photograph reads as three
                  pictures that failed to load; plain ground reads as space the
                  card was given. */}
              {area.image && (
                <div className="relative mt-auto aspect-3/2 overflow-hidden rounded-[14px]">
                  <Image
                    src={area.image.url}
                    alt={area.image.alt}
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
  );
}
