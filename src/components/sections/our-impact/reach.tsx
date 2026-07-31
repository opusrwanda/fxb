import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Counter } from "@/components/ui/counter";
import { Reveal } from "@/components/ui/reveal";
import { reach } from "@/lib/impact";
import { photo } from "@/lib/photos";

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
 * to — see the note in `impact.ts`.
 */
export function Reach() {
  return (
    <section id="results" className="scroll-mt-32 bg-white py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                RESULTS AT A GLANCE
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[44px] lg:leading-[1.1]">
              Our reach since 2012
            </h2>
          </div>
          <p className="max-w-[44ch] text-base leading-relaxed text-gray lg:text-right lg:text-[17px]">
            Reach is counted per area, so a household supported in two of them
            is counted in both. The total is reported separately.
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2">
          {reach.map((figure, index) => (
            <Reveal as="li" key={figure.id} delay={80 + (index % 2) * 80}>
              <div
                tabIndex={0}
                className="wedge group relative flex min-h-[26rem] flex-col justify-end overflow-hidden p-8 lg:p-10"
              >
                <Image
                  src={photo(figure.photo).url}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 46vw, 90vw"
                  className="motion-transform object-cover transition-transform duration-[700ms] ease-out group-hover:scale-105"
                />
                {/* Load-bearing: white type over arbitrary photography. */}
                <span
                  className="absolute inset-0 bg-linear-to-t from-blue-90 via-blue-90/80 to-blue/30"
                  aria-hidden="true"
                />

                <div className="relative">
                  <p className="text-[46px] leading-none font-bold tracking-[-0.03em] text-white font-[family-name:var(--font-display)] lg:text-[64px]">
                    <Counter value={figure.value} />+
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-white lg:text-2xl">
                    {figure.label}
                  </h3>
                  <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-white-70">
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

        <Reveal delay={240}>
          <p className="mt-8 text-sm text-gray-40">
            Figures are drawn from FXB Rwanda&rsquo;s monitoring and evaluation
            records and are being updated for the 2026 reporting cycle.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
