import { Container } from "@/components/layout/container";
import { Counter } from "@/components/ui/counter";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";

/**
 * Our Impact — the stat band.
 *
 * The loudest gesture in the system: figures at display scale on a plain white
 * ground, with the label whispered underneath. No cards, no photographs, no
 * decoration competing with the numbers. This is the room where the numerals
 * carry the argument on their own.
 *
 * Figures are abbreviated so they can be set large — the exact counts live on
 * the Our Impact page. All four are taken verbatim from "Our Reach (Since
 * 2012)" in the content brief, which itself marks them "(Insert updated
 * statistics from MEL/database)", so they want confirming before launch.
 */
const stats = [
  {
    value: 2.9,
    decimals: 1,
    suffix: "M+",
    caption: "children and vulnerable individuals reached since 2012",
    exact: "2,984,961+",
  },
  {
    value: 1.4,
    decimals: 1,
    suffix: "M+",
    caption: "reached through HIV prevention, health, nutrition and WASH",
    exact: "1,389,426+",
  },
  {
    value: 1.1,
    decimals: 1,
    suffix: "M+",
    caption:
      "reached through economic empowerment, child protection and climate resilience",
    exact: "1,090,288+",
  },
  {
    value: 505,
    decimals: 0,
    suffix: "K+",
    caption: "children supported through early childhood development and education",
    exact: "505,247+",
  },
];

export function ImpactCounters() {
  return (
    <section id="our-impact" className="bg-white py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-green" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.22em] text-gray-40">
              OUR IMPACT
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[44px] lg:leading-[1.1]">
            Measured in lives, not activities
          </h2>
        </Reveal>

        <dl className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
          {/* Column-reverse so the figure sits above its caption while the term
              still precedes the description in the DOM. The caption is the dt
              itself — an extra sr-only copy would have every screen reader
              announce it twice.

              justify-end packs to the top here: the grid stretches every cell to
              the tallest, and column-reverse would otherwise pack content to the
              bottom, so a two-line caption pushed its figure lower than a
              three-line one and the row of numerals came out ragged. The
              captions are left to run ragged at the bottom instead, which is
              where nobody is comparing them. */}
          {stats.map((stat, index) => (
            <Reveal
              key={stat.exact}
              delay={index * 80}
              className="flex flex-col-reverse justify-end"
            >
              <dt className="max-w-[28ch] text-base leading-snug text-gray">
                {stat.caption}
              </dt>
              <dd className="flex flex-col gap-4 pb-4">
                <Counter
                  value={stat.value}
                  decimals={stat.decimals}
                  suffix={stat.suffix}
                  // Steps back down at xl, where the grid goes to four columns
                  // and the measure is capped at 1200: a 276px column cannot
                  // hold "505K+" at 124px, and the figures ran into each other.
                  className="font-display text-[80px] leading-[0.85] font-semibold tracking-[-0.01em] whitespace-nowrap text-gray tabular-nums sm:text-[104px] lg:text-[124px] xl:text-[104px]"
                />
                <span className="h-1 w-12 bg-green" aria-hidden="true" />
              </dd>
            </Reveal>
          ))}
        </dl>

        <Reveal delay={320}>
          <Pill href="/our-impact" size="lg" className="mt-16">
            See Full Impact Report
          </Pill>
        </Reveal>
      </Container>
    </section>
  );
}
