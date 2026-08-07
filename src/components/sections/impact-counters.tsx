import { Container } from "@/components/layout/container";
import { Counter } from "@/components/ui/counter";
import { getReach } from "@/cms/content/impact";
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
/**
 * A figure, as the counters want it.
 *
 * The CMS holds exact integers — 2,984,961 — because that is what MEL reports
 * and what Our Impact prints. A counter at 124px cannot animate to seven
 * digits, so the display value is derived rather than stored: nobody has to
 * remember to update "2.9M+" when they update 2,984,961, because there is only
 * one number to update.
 */
function display(value: number) {
  if (value >= 1_000_000) {
    return { value: Math.floor((value / 1_000_000) * 10) / 10, decimals: 1, suffix: "M+" };
  }
  if (value >= 1_000) {
    return { value: Math.floor(value / 1_000), decimals: 0, suffix: "K+" };
  }
  return { value, decimals: 0, suffix: "+" };
}

const exact = (value: number) => `${value.toLocaleString("en-GB")}+`;

export async function ImpactCounters() {
  const reach = await getReach();
  const stats = reach.figures
    .filter((figure) => figure.value !== null)
    .map((figure) => ({
      ...display(figure.value as number),
      caption: figure.caption || figure.label,
      exact: exact(figure.value as number),
    }));

  // No figures set is a real state — the band goes rather than showing zeros.
  if (stats.length === 0) return null;

  return (
    <section id="our-impact" className="bg-green-10 py-32 lg:py-48">
      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
            <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
              OUR IMPACT
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
            Measured in lives, not activities
          </h2>
        </Reveal>

        {/* One rule for the whole band, rather than a stub under each figure.
            Four short green rules repeated across a row read as four separate
            objects; one rule spanning the measure says these four figures are
            one statement. */}
        <div className="mt-14 h-0.5 w-full bg-green" aria-hidden="true" />

        <dl className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
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
              delay={Math.min(index, 3) * 60}
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
                  // Blue, not grey. This band's own docstring calls the figures
                  // the loudest gesture in the system, and they were set in the
                  // quietest colour on the page — quieter than the heading above
                  // them, so a 124px numeral was losing to 44px of type.
                  className="font-display text-[80px] leading-[0.85] font-semibold tracking-[-0.01em] whitespace-nowrap text-blue tabular-nums sm:text-[104px] lg:text-[124px] xl:text-[104px]"
                />
              </dd>
            </Reveal>
          ))}
        </dl>

        <Reveal delay={580}>
          <Pill href="/our-impact" size="lg" className="mt-16">
            See Full Impact Report
          </Pill>
        </Reveal>
      </Container>
    </section>
  );
}
