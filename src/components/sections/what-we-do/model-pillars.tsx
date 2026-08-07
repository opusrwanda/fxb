import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import { pillars } from "@/lib/fxbvillage";
import { getPhotos } from "@/cms/content/photos";

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
 * No JavaScript in it. `position: sticky` on each item with an offset that
 * grows by index is the whole mechanism, which means it works before hydration
 * and cannot desynchronise from the scroll — and the 14px step leaves the top
 * edge of every panel underneath visible, so the stack reads as a stack rather
 * than as one panel being replaced.
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
  const photos = await getPhotos(PILLAR_PHOTOS);

  return (
    <section id="pillars" className="scroll-mt-36 bg-blue py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-white-70" aria-hidden="true" />
            <span className="text-[24px] font-semibold tracking-[0.14em] text-white-94">
              THE PILLARS
            </span>
          </div>
          <h2 className="max-w-[24ch] text-3xl font-bold tracking-[-0.03em] text-white lg:text-[42px] lg:leading-[1.08]">
            Five pillars, delivered together
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
      <ol className="mt-14 lg:mt-20">
        {pillars.map((pillar, index) => {
          const image = photos[PILLAR_PHOTOS[index]];

          return (
            <li
              key={pillar.id}
              // Only where a panel fits on the screen.
              //
              // A sticky element taller than the viewport pins its top and
              // leaves everything past the fold permanently out of reach —
              // the tallest of these is 1,321px, and a phone is 844. So the
              // stack engages from lg and only above 900px of viewport
              // height; anywhere else the panels are ordinary blocks and the
              // reader simply scrolls through them, which is the same content
              // without the effect rather than a broken version of it.
              className="lg:[@media(min-height:900px)]:sticky"
              // Each panel stops 14px lower than the one before it, so the
              // edges of the ones already read stay visible above the current
              // one. 88px clears the pinned header.
              style={{ top: `${88 + index * 14}px` }}
            >
              <Container>
                <article className="wedge overflow-hidden bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.18)]">
                  <div className="grid lg:grid-cols-[1.15fr_1fr]">
                    <div className="flex flex-col gap-7 p-8 lg:p-12">
                      <div className="flex flex-col gap-4">
                        <p className="text-sm font-semibold tracking-[0.14em] text-gray-80">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="max-w-[20ch] text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[32px] lg:leading-[1.12]">
                          {pillar.title}
                        </h3>
                        {pillar.lead && (
                          <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
                            {pillar.lead}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                          KEY INTERVENTIONS
                        </p>
                        <dl className="mt-5 flex flex-col gap-5">
                          {pillar.interventions.map((intervention) => (
                            <div
                              key={intervention.name}
                              className="border-l-2 border-blue-16 pl-5"
                            >
                              <dt className="text-base font-semibold text-blue">
                                {intervention.name}
                              </dt>
                              <dd className="mt-1.5 max-w-[58ch] text-[15px] leading-relaxed text-gray">
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
                      <div className="relative order-first min-h-64 lg:order-none lg:min-h-0">
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
      </ol>
    </section>
  );
}
