import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Counter } from "@/components/ui/counter";
import { getReach } from "@/cms/content/impact";
import { getSection } from "@/cms/content/sections";
import { photo } from "@/lib/photos";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";

/**
 * Our Impact — the stat band.
 *
 * The loudest gesture in the system: figures at display scale, with the label
 * whispered underneath. No cards, no decoration competing with the numbers.
 * This is the room where the numerals carry the argument on their own.
 *
 * It stood on flat pale green until now. The photograph replaces that ground
 * rather than joining it: the same treatment the hero and the photo bands use
 * — fixed plate, scrim, grain — so the numerals sit in a room instead of on a
 * swatch, and the whole page reads as one system. Everything in the band
 * inverts to white with it; there is no reading blue numerals over a
 * photograph.
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

/**
 * A schoolyard of children with their arms up, under open sky.
 *
 * Chosen for the top third as much as the subject: the sky and treeline are
 * the only part of the frame the heading has to sit on, and they are empty.
 * The faces run in a band across the middle where the numerals land, so no
 * single subject ends up buried under a 124px figure — a crowd is the one
 * composition that survives having type set over it.
 *
 * It is also the argument. The heading says the work is measured in lives
 * rather than activities, and this is a picture of the lives.
 */
const BAND_PHOTO = "fxbvillage-tlf-14";

export async function ImpactCounters() {
  const [reach, copy] = await Promise.all([
    getReach(),
    getSection("home:our-impact"),
  ]);
  const stats = reach.figures
    .filter((figure) => figure.value !== null)
    .map((figure) => ({
      ...display(figure.value as number),
      caption: figure.caption || figure.label,
      exact: exact(figure.value as number),
    }));

  // No figures set is a real state — the band goes rather than showing zeros.
  if (stats.length === 0) return null;

  const ground = photo(BAND_PHOTO);

  return (
    <section
      id="our-impact"
      // `bg-blue` under the plate, not as the ground: it is what shows for the
      // moment before the photograph paints, and a blue room fading to a
      // photographed one is the same room. White on white would not be.
      className="static-bg relative isolate bg-blue py-32 lg:py-48"
    >
      {/* Decorative. The heading and the four figures over it are what this
          band says; describing the schoolyard first would only delay them. */}
      <Image
        src={ground.url}
        alt=""
        fill
        sizes="100vw"
        className="static-bg-image -z-20 object-cover"
      />
      {/* `band-scrim`, not the hero's: this band sets a four-column grid across
          the whole measure, so there is no third of the frame safe to leave
          bright. Its floor is documented in `globals.css`. */}
      <div className="band-scrim absolute inset-0 -z-10" aria-hidden="true" />
      <div className="grain absolute inset-0 -z-10" aria-hidden="true" />

      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
            <span className="text-[24px] font-semibold tracking-[0.14em] text-white">
              {copy.eyebrow}
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-white lg:text-[42px] lg:leading-[1.08]">
            {copy.heading}
          </h2>
          {copy.body && (
            <p className="max-w-[62ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
              {copy.body}
            </p>
          )}
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
              <dt className="max-w-[28ch] text-base leading-snug text-white-94">
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
                  // White, since the ground is a photograph. The rule this is
                  // still obeying is the one that took it off grey and onto
                  // blue: the loudest gesture in the system gets the loudest
                  // value in the room, or a 124px numeral loses to 44px of
                  // heading.
                  className="font-display text-[80px] leading-[0.85] font-semibold tracking-[-0.01em] whitespace-nowrap text-white tabular-nums sm:text-[104px] lg:text-[124px] xl:text-[104px]"
                />
              </dd>
            </Reveal>
          ))}
        </dl>

        <Reveal delay={580}>
          {/* `white`, as in the hero: a bordered dark pill on a photograph is
              a hole, and the outline variant's ink is the page's dark grey. */}
          <Pill href="/our-impact" size="lg" variant="white" className="mt-16">
            See Full Impact Report
          </Pill>
        </Reveal>
      </Container>
    </section>
  );
}
