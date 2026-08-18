import Image from "next/image";
import { Container } from "@/components/layout/container";
import { SectionBand } from "@/components/layout/section-band";
import { getSection } from "@/cms/content/sections";
import { Reveal } from "@/components/ui/reveal";
import { PILLAR_ICONS } from "@/lib/fxbvillage-icons";
import { pillars } from "@/lib/fxbvillage";
import { getPhotos } from "@/cms/content/photos";
import { BrandIcon, type IconId } from "@/components/brand/icon";
import { PillarStack } from "./pillar-stack";

/**
 * The pillars of the FXBVillage model, as a stack.
 *
 * Each pillar is a whole panel — its title, what it is, and every intervention
 * under it — and the panels stack: each one sticks under the header while the
 * next scrolls up over it. Reading the section is scrolling it, and at any
 * moment one pillar has the screen.
 *
 * This replaced an accordion. Five titles that opened in place put the section
 * in a state where nothing was readable until the reader guessed which title
 * was worth a click, and closed it again to see the next one — for content
 * that is not optional detail but the substance of the model. The photograph
 * had the same problem in reverse: one picture for five pillars, so it could
 * only ever illustrate the model in general and never the pillar being read.
 * Each panel carries its own now.
 *
 * `position: sticky` on each item with an offset that grows by index is the
 * whole mechanism — nothing listens to the scroll, so nothing can desynchronise
 * from it, and the 14px step leaves the top edge of every panel underneath
 * visible so the stack reads as a stack rather than as one panel being
 * replaced.
 *
 * The one thing sticky cannot decide for itself is whether a panel fits between
 * the header and the fold, which is the difference between the stack working on
 * a 27-inch monitor and the same page merely scrolling on a laptop. `PillarStack`
 * measures that and pins the stack a little higher, or stands the panels down
 * into ordinary blocks when even that will not do.
 *
 * A blue room, so the page keeps alternating: the principles above it and the
 * SDGs below are both on white, and three white rooms in a row would run the
 * middle of this page together.
 *
 * NOTE ON THE COUNT: the brief introduces "six mutually reinforcing pillars"
 * and then supplies five. The copy counts what is actually on the page, and a
 * sixth can be dropped into `fxbvillage.ts` without touching this file — but
 * the discrepancy is FXB's to resolve.
 */

/**
 * A photograph per pillar, in the order the pillars are declared.
 *
 * Held here rather than on the pillar itself because `fxbvillage.ts` is the
 * brief's words and nothing else — no filenames, no layout. Falling off the end
 * of this list is survivable: the panel simply renders without a picture.
 */
const PILLAR_PHOTOS = [
  "sugira-muryango-02.jpg", // home visits and coaching
  "fxbvillage-tlf-11.jpg", // economic empowerment
  "fostering-01.jpg", // nutrition and food security
  "fxbvillage-tlf-03.jpg", // education and access to information
  "fxbvillage-mageragere-02.jpg", // health and WASH
];

export async function ModelPillars() {
  const copy = await getSection("what-we-do:pillars");

  /**
   * The pillars, with the panel's words over the code's structure.
   *
   * Same arrangement as the Areas cards: the length follows the panel once
   * anything has been edited there, and the photograph — which is not a thing
   * anybody would want to type — comes from the array below by position. A
   * sixth pillar added in the panel renders without one.
   */
  const cards = (
    copy.items.length > 0
      ? copy.items
      : pillars.map((pillar) => ({
          title: pillar.title,
          body: pillar.lead,
          icon: PILLAR_ICONS[pillar.id],
          points: pillar.interventions.map((intervention) => ({
            title: intervention.name,
            body: intervention.body,
          })),
        }))
  ).map((item, index) => ({
    key: `${index}-${item.title}`,
    title: item.title,
    lead: item.body,
    icon: (item.icon ?? PILLAR_ICONS[pillars[index]?.id ?? ""]) as
      | IconId
      | undefined,
    interventions: (item.points ?? []).map((point) => ({
      name: point.title,
      body: point.body ?? "",
    })),
    photo: PILLAR_PHOTOS[index],
  }));
  const photos = await getPhotos(PILLAR_PHOTOS);

  return (
    <SectionBand section={copy} id="pillars" className="scroll-mt-36 bg-blue py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-white-70" aria-hidden="true" />
            <span className="text-[24px] font-semibold tracking-[0.14em] text-white-94">
              {copy.eyebrow}
            </span>
          </div>
          <h2 className="max-w-[24ch] text-3xl font-bold tracking-[-0.03em] text-white lg:text-[42px] lg:leading-[1.08]">
            {copy.heading}
          </h2>
          <p className="max-w-[58ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
            The model integrates a set of mutually reinforcing pillars that work
            together to improve the overall well-being of families.
          </p>
        </Reveal>
      </Container>

      {/* `pb` on the list, not on the last panel: the stack needs somewhere to
          scroll to after the final pillar has stuck, or the last one is still
          moving when the section ends and never gets a moment of its own. */}
      <PillarStack className="pillar-stack mt-14 lg:mt-20">
        {cards.map((pillar, index) => {
          const image = pillar.photo ? photos[pillar.photo] : undefined;

          return (
            <li
              key={pillar.key}
              // Where the panel rests once it has stuck: 14px lower than the
              // one before it, so the edges of the ones already read stay
              // visible above the current one, and 88px down to clear the
              // fixed header. Whether it sticks at that offset, at a higher
              // one, or not at all is settled in `pillar-stack.tsx` and in
              // the `.pillar-stack` rules in globals.css — a sticky panel
              // taller than the room under the header would hang its bottom
              // below the fold, and the next panel would then slide over the
              // part nobody has read.
              style={
                {
                  "--pillar-base": `${88 + index * 14}px`,
                } as React.CSSProperties
              }
            >
              <Container>
                {/* The room's own blue, not a white card.
                    The panel has to be opaque, because covering the one before
                    it is the whole mechanism — but opaque does not mean a
                    different colour. It is the same blue the section is, with
                    the section's own hairline along the top, so the stack reads
                    as the page folding over itself rather than as five cards
                    that arrived from somewhere else. */}
                <article className="border-t border-white-12 bg-blue pt-10 pb-14 lg:pt-12 lg:pb-16 stack-tight:pt-8 stack-tight:pb-8">
                  <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16 stack-tight:grid-cols-[1.7fr_1fr] stack-tight:gap-10">
                    <div className="flex flex-col gap-7 stack-tight:gap-4">
                      <div className="flex flex-col gap-4 stack-tight:gap-3">
                        {/* The icon and the number on one line: the drawing
                            says what the pillar is about, the number says where
                            it sits in the five. */}
                        <div className="flex items-center gap-4">
                          {pillar.icon && (
                            <BrandIcon
                              id={pillar.icon}
                              // 64px, up from 44. Bare on the blue rather than
                              // in a container, so there is nothing around it
                              // to keep it in proportion to — it simply has to
                              // be large enough to read as the drawing it is.
                              className="size-16 text-white stack-tight:size-12"
                            />
                          )}
                          <p className="text-sm font-semibold tracking-[0.14em] text-white-94">
                            {String(index + 1).padStart(2, "0")}
                          </p>
                        </div>
                        <h3
                          data-pillar-title
                          className="max-w-[20ch] text-2xl font-bold tracking-[-0.02em] text-white lg:text-[32px] lg:leading-[1.12] stack-tight:text-[26px] stack-tight:leading-[1.14]"
                        >
                          {pillar.title}
                        </h3>
                        {pillar.lead && (
                          <p className="max-w-[58ch] text-base leading-relaxed text-white-94 lg:text-[17px] stack-tight:text-[15px] stack-tight:leading-[1.55]">
                            {pillar.lead}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-white-94">
                          KEY INTERVENTIONS
                        </p>
                        <dl className="mt-5 flex flex-col gap-5 stack-tight:mt-3 stack-tight:grid stack-tight:grid-cols-2 stack-tight:gap-x-10 stack-tight:gap-y-4">
                          {pillar.interventions.map((intervention) => (
                            <div
                              key={intervention.name}
                              className="border-l-2 border-white-12 pl-5"
                            >
                              <dt className="text-base font-semibold text-white">
                                {intervention.name}
                              </dt>
                              <dd className="mt-1.5 max-w-[58ch] text-[15px] leading-relaxed text-white-94 stack-tight:mt-1 stack-tight:text-[14px] stack-tight:leading-[1.5]">
                                {intervention.body}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>

                    {/* The picture is the second thing in the source order, so
                        a screen reader and a phone both get the pillar before
                        the photograph of it. */}
                    {image && (
                      <div className="wedge relative order-first aspect-4/3 overflow-hidden lg:order-none lg:aspect-4/5 lg:self-start stack-tight:aspect-square">
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          sizes="(min-width: 1024px) 40vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </article>
              </Container>
            </li>
          );
        })}
      </PillarStack>
    </SectionBand>
  );
}
