import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Counter } from "@/components/ui/counter";
import { Reveal } from "@/components/ui/reveal";
import { getReach } from "@/cms/content/impact";

/**
 * Our Reach (Since 2012).
 *
 * Built to the client's note on this section: blocks with counter numbers, a
 * photograph in each block's background, and the impact areas revealed on
 * hover. Hover alone would strand keyboard and touch users, so the areas are
 * revealed by `:focus-within` too and the block is focusable — and on a touch
 * screen, where neither fires, the areas are simply always shown.
 *
 * The figures carry a "+" because that is how the brief reports them: these are
 * floors, not exact counts.
 *
 * The three programme figures do not add up to the total, and are not meant
 * to: reach is counted per area, so a household supported in two of them
 * appears in both. The note under the figures is edited alongside them in
 * `/staff`, because a page of large numbers with no word on where they came
 * from is a weaker claim, not a stronger one.
 */
export async function Reach() {
  const reach = await getReach();

  return (
    <section id="results" className="scroll-mt-36 bg-white py-32 lg:py-48">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                RESULTS AT A GLANCE
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
              Our reach since 2012
            </h2>
          </div>
          <p className="max-w-[44ch] text-base leading-relaxed text-gray lg:text-[17px]">
            Reach is counted per area, so a household supported in two of them
            is counted in both. The total is reported separately.
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2">
          {reach.figures.map((figure, index) => (
            <Reveal as="li" key={figure.id} delay={60 + Math.min(index, 3) * 60}>
              <div
                tabIndex={0}
                className="wedge group relative flex min-h-[26rem] flex-col justify-end overflow-hidden p-8 lg:p-10"
              >
                {figure.image && (
                  <Image
                    src={figure.image.url}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 46vw, 90vw"
                    className="motion-transform object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.04]"
                  />
                )}
                {/* Load-bearing where the type is, and nowhere else. The scrim
                    used to hold 90% blue through the middle band too, which
                    turned four photographs into four muddy blue rectangles —
                    the strongest asset on the site, painted over. The numeral
                    and caption both sit in the bottom third, so the 90% only
                    needs to live there; above that the photograph can breathe. */}
                <span
                  className="absolute inset-0 bg-linear-to-t from-blue-90 from-20% via-blue/60 via-48% to-blue/10"
                  aria-hidden="true"
                />

                <div className="relative">
                  {/* No number where MEL has not supplied one. The figure keeps
                      its block, its photograph and its caption and simply does
                      not make a numeric claim — which is the whole reason the
                      field is allowed to be empty. */}
                  {figure.value !== null && (
                    <p className="text-[46px] leading-none font-bold tracking-[-0.03em] text-white font-[family-name:var(--font-display)] lg:text-[64px]">
                      <Counter value={figure.value} />+
                    </p>
                  )}
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-white lg:text-2xl">
                    {figure.label}
                  </h3>
                  <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-white-94">
                    {figure.caption}
                  </p>

                  {/* Held at zero height until the block is hovered or focused.
                      `@media (hover: none)` opens it permanently, because on a
                      touch screen nothing would ever open it. */}
                  <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[400ms] ease-out group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] [@media(hover:none)]:grid-rows-[1fr]">
                    <div className="overflow-hidden">
                      <ul className="flex flex-col gap-2 pt-5">
                        {figure.areas.map((area) => (
                          <li key={area} className="flex gap-3">
                            <span
                              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-green"
                              aria-hidden="true"
                            />
                            <span className="text-sm leading-snug text-white">
                              {area}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>

        {reach.note && (
          <Reveal delay={240}>
            <p className="mt-8 max-w-[70ch] text-sm text-gray-80">
              {reach.note}
            </p>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
