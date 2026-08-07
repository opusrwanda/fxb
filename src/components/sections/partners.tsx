import Image from "next/image";
import { Container } from "@/components/layout/container";
import { PartnerCarousel } from "@/components/sections/partner-carousel";
import { Reveal } from "@/components/ui/reveal";
import { type Partner, getOrderedPartners } from "@/cms/content/people";

/**
 * Partners — every logo on one continuously scrolling line.
 *
 * The line is ordered by relationship rather than shuffled: development
 * partners, then government, then donors, then corporate. Nothing labels the
 * groups, but the ordering means the ministries arrive together and the funders
 * arrive together, so the eye still reads groups going past instead of noise.
 *
 * No client JavaScript: the animation is CSS on a doubled track, so this whole
 * section server-renders and works with JS disabled. Under
 * `prefers-reduced-motion` the line stops and becomes an ordinary scrollable
 * strip — see the marquee rules in globals.css.
 */

/**
 * The tile stride at the large breakpoint: 224px card plus the 24px gap.
 * Kept in step with the classes on the card below.
 */
const STRIDE = 248;

/**
 * Minimum width one pass of the line must reach before it is doubled. A pass
 * narrower than the viewport would run out of logos mid-loop and open a gap.
 * Thirty-four logos clear this many times over; the guard only matters if the
 * list is ever cut down.
 */
const MIN_PASS = 3900;

/**
 * Travel speed, in CSS pixels per second.
 *
 * 55 was fast enough that a logo crossed the fade in under two seconds, which
 * is quicker than most people can read an unfamiliar organisation's name. This
 * is a credibility wall, not a ticker — it only works if the names land.
 */
const SPEED = 35;

export async function Partners() {
  const logos = await getOrderedPartners();

  // Every logo could be deleted from the library at once, and a marquee with
  // nothing to carry is a band of empty tiles.
  if (logos.length === 0) return null;

  // Repeat until one pass is wide enough to cover the screen, then lay that
  // pass down twice — the second copy is what the -50% translation lands on.
  const passes = Math.max(1, Math.ceil(MIN_PASS / (logos.length * STRIDE)));
  const pass = Array.from({ length: passes }, () => logos).flat();
  const duration = Math.round((pass.length * STRIDE) / SPEED);

  return (
    <section id="partners" className="bg-blue-08 py-16 lg:py-20">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                PARTNERS
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
              None of this was done alone
            </h2>
          </div>
          <p className="max-w-[46ch] text-base leading-relaxed text-gray lg:text-lg lg:font-light">
            Government institutions, donors and fellow organisations who fund
            the work, shape it, and deliver it alongside us.
          </p>
        </Reveal>
      </Container>

      {/* Full-bleed: the line runs past the measure and off both edges.

          The list stays server-rendered; PartnerCarousel wraps it to add the
          prev/next buttons and to take the line over from the animation on the
          first press. With JavaScript off nothing here changes — no buttons
          appear, and the CSS marquee carries on as before. */}
      <Reveal className="mt-14 lg:mt-16">
        <PartnerCarousel>
          <ul
            className="marquee-track gap-4 md:gap-6"
            style={
              { "--marquee-duration": `${duration}s` } as React.CSSProperties
            }
          >
            {[...pass, ...pass].map((partner, index) => (
              <PartnerTile
                // Every logo appears twice over; the index is the only thing
                // that distinguishes one tile from the next.
                key={`${partner.name}-${index}`}
                partner={partner}
                // Only the first pass is announced. The rest are the same logos
                // again, and a screen reader reading the list twice would be
                // nothing but noise.
                decorative={index >= logos.length}
              />
            ))}
          </ul>
        </PartnerCarousel>
      </Reveal>
    </section>
  );
}

function PartnerTile({
  partner,
  decorative,
}: {
  partner: Partner;
  decorative: boolean;
}) {
  return (
    <li className="shrink-0" {...(decorative ? { "aria-hidden": true } : {})}>
      <div className="flex h-24 w-44 items-center justify-center rounded-card border border-gray-15 bg-white p-5 transition-colors duration-300 hover:border-blue-16 md:h-32 md:w-56 md:p-6">
        {partner.logo && (
          <Image
            src={partner.logo.url}
            // The logos are trimmed flush to their own bounds and their aspect
            // ratios run from 0.72 to 10.9, so each one is fitted to the tile
            // rather than filling it.
            alt={decorative ? "" : partner.name}
            width={partner.logo.width}
            height={partner.logo.height}
            sizes="(min-width: 768px) 176px, 136px"
            className="h-auto max-h-full w-auto max-w-full object-contain"
          />
        )}
      </div>
    </li>
  );
}
