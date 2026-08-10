import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { HeroSentinels } from "@/components/layout/hero-sentinels";
import { BackgroundVideo } from "@/components/ui/background-video";
import { Pill } from "@/components/ui/pill";
import type { Img } from "@/cms/content/image";
import { heroVideo } from "@/lib/media";

type Cta = { label: string; href: string; primary?: boolean };

/** A step in the trail above the eyebrow. */
export type Crumb = { label: string; href: string };

/** A figure carried at the fold. Kept to three — see the rail below. */
export type HeroStat = { figure: string; label: string };

/**
 * The hero room: full-bleed footage under a shaped scrim.
 *
 * The scrim is not decoration — it is what guarantees the white headline and
 * the white header lockup clear contrast over arbitrary field footage. If a
 * clip is ever bright enough to break them, the scrim rises rather than the
 * lockup switching early. Its geometry is documented in `globals.css`.
 *
 * The room is built in three bands, not one block:
 *
 *   top     the header, drawn straight onto the footage
 *   middle  the argument — eyebrow, headline, body, actions
 *   bottom  the proof — three figures and the invitation to keep going
 *
 * That bottom band is the point of the section. A full-viewport hero that ends
 * in nothing tells a visitor the page is over; the rail spends the same pixels
 * saying it is not, and puts the organisation's three most quotable facts above
 * the fold where a first-time donor or partner actually reads them.
 */
export function Hero({
  eyebrow,
  headline,
  body,
  ctas = [],
  stats = [],
  scrollTo,
  withVideo = false,
  image,
  breadcrumbs = [],
}: {
  eyebrow?: string;
  headline: string;
  body?: string;
  ctas?: Cta[];
  /** The fold-level proof rail. Three figures; more than that is a table. */
  stats?: HeroStat[];
  /** Anchor for the scroll cue. Omitted, the cue does not render. */
  scrollTo?: string;
  withVideo?: boolean;
  /**
   * A photograph to stand behind the room, for the section landings that have
   * no footage. Home is the only page with video; Who We Are, What We Do, Our
   * Impact and Get Involved were plain blue rectangles until this.
   *
   * Set in /staff → Page banners, the same place the page headers get theirs.
   * Null and the room stays blue, exactly as it was.
   */
  image?: Img | null;
  /**
   * The trail above the eyebrow, for the pages that sit inside a section.
   *
   * Lives here rather than in a second component because every page on the
   * site now opens with this room, and the ones that need a trail were the
   * only reason a second opening block existed at all.
   */
  breadcrumbs?: Crumb[];
}) {
  // Footage wins where there is any: the poster is a frame of it, so a still
  // behind the video would never be seen.
  const backdrop = !withVideo && image ? image : null;
  return (
    // Exactly one viewport tall. Top padding clears the full rest-state header
    // — banner + utility strip + the 128px bar — and the content is sized to
    // fit inside what is left, so the section lands on 100svh rather than
    // growing past it. `min-h` rather than `h` so a very short or very narrow
    // device gets a taller hero instead of clipped copy.
    //
    // Mobile top padding is 136px against a 96px mobile bar, not the 148px the
    // desktop utility strip needs: with the rail added, a 375×667 phone is the
    // one viewport where the budget genuinely does not close, and the 12px
    // bought here is 12px the rail does not lose. On that device the figures
    // still land above the fold and only the tail of a caption falls below it,
    // which reads as an invitation rather than as a clipped section.
    <section
      className={`relative isolate flex flex-col overflow-hidden bg-blue pt-34 pb-8 lg:pt-[14.75rem] lg:pb-12 ${
        // A full viewport is worth it for footage; it is not worth it for a
        // plain blue rectangle. On the hero-only pages the full height left
        // 200px of empty blue under the buttons and pushed the actual content
        // below the fold to buy nothing. A photograph earns some of it back,
        // but not all — these pages still open onto their content.
        withVideo ? "min-h-svh" : backdrop ? "min-h-[76svh]" : "min-h-[68svh]"
      }`}
    >
      <HeroSentinels />

      {backdrop && (
        <>
          {/* The same still treatment the footage gets, drift included, so a
              section landing and the home page read as the same room. */}
          <div className="hero-drift absolute inset-0 -z-20">
            <Image
              src={backdrop.url}
              // Decorative: the h1 sitting over it says what the page is, and
              // a description of the photograph read first would only delay it.
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="hero-scrim absolute inset-0 -z-10" aria-hidden="true" />
          <div
            className="hero-scrim-edges absolute inset-0 -z-10"
            aria-hidden="true"
          />
          <div className="grain absolute inset-0 -z-10" aria-hidden="true" />
        </>
      )}

      {withVideo && (
        <>
          {/* Poster and video drift together as one plate, so the video
              inheriting the move mid-fade cannot cause a jump. */}
          <div className="hero-drift absolute inset-0 -z-20">
            {/* The poster is what actually paints and carries the LCP. Next
                serves it as AVIF/WebP at the right size for the viewport. */}
            <Image
              src={heroVideo.poster}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <BackgroundVideo
              large={heroVideo.large}
              small={heroVideo.small}
              className="absolute inset-0 size-full object-cover"
            />
          </div>

          {/* Neutral black rather than brand blue — a scrim reads as absence of
              light, not as a fifth colour in a four-value palette. Only over
              footage: a hero with no video stays a plain blue room. */}
          <div className="hero-scrim absolute inset-0 -z-10" aria-hidden="true" />
          <div
            className="hero-scrim-edges absolute inset-0 -z-10"
            aria-hidden="true"
          />
          <div
            className="grain absolute inset-0 -z-10"
            aria-hidden="true"
          />
        </>
      )}

      {/* `my-auto` rather than `justify-center` on the section: it centres this
          band in whatever height the rail leaves, instead of centring the two
          of them together and floating the rail off the bottom edge. */}
      <Container className="my-auto flex flex-col items-start gap-5 lg:gap-7">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="hero-rise">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white-94">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  <Link
                    href={crumb.href}
                    className="transition-colors duration-300 hover:text-white"
                  >
                    {crumb.label}
                  </Link>
                  {/* Between crumbs only. The current page is the `h1` just
                      below, so a trailing chevron would point at nothing. */}
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {eyebrow && (
          // The same eyebrow every other section on the site opens with — green
          // rule, tracked caps — rather than the pill this used to carry. A
          // bordered pill with a Play glyph in it announced a video that does
          // not play on click, and it read as a control instead of a label.
          <p className="hero-rise flex items-center gap-4">
            <span
              className="h-0.5 w-6 shrink-0 bg-green"
              aria-hidden="true"
            />
            <span className="text-[22px] font-semibold tracking-[0.18em] text-white lg:text-[24px]">
              {eyebrow}
            </span>
          </p>
        )}

        {/* Sizes step down from the old 82/100 to leave the rail its band. At
            88px the headline still owns the screen — the constraint on display
            type here is the two lines it wraps to, not the point size.

            1.12 is a floor, not a preference. Poppins puts the `g` tail 0.275em
            under the baseline and the `f`, `h`, `d` and `l` ascenders 0.784em
            over it, so two lines collide at anything under 1.059 — which is
            what "Creating a world fit / for children." was doing at the 1 this
            used to set, with the tail of the `g` landing 5px inside the line
            below. One value at every size: display type wants tight leading,
            but never tighter than the face's own ink. */}
        <h1 className="hero-rise max-w-[17ch] text-[36px] leading-[1.12] font-bold tracking-[-0.03em] text-balance text-white [animation-delay:90ms] sm:text-[52px] lg:text-[76px] xl:text-[88px]">
          {headline}
        </h1>

        {body && (
          // Held to 52ch and set below the old size. This paragraph names eight
          // programme areas in one breath; at 19px on a 58ch measure it was
          // four lines competing with the headline for the same glance. It is
          // supporting copy and now reads like it.
          <p className="hero-rise max-w-[52ch] text-[15px] leading-[1.6] text-white-94 [animation-delay:180ms] sm:text-base sm:leading-[1.65] lg:text-[18px]">
            {body}
          </p>
        )}

        {/* Full width while stacked, auto once they sit side by side. Two pills
            of different label lengths stacked at their natural widths came out
            ragged down the left of the phone. */}
        {ctas.length > 0 && (
          <div className="hero-rise mt-1 flex w-full flex-col gap-3 [animation-delay:270ms] sm:w-auto sm:flex-row sm:flex-wrap lg:mt-2 lg:gap-4">
            {ctas.map((cta) => (
              <Pill
                key={cta.href}
                href={cta.href}
                size="lg"
                // `white`, not `primary`. The hero is always a blue room, so a
                // blue-filled pill on a hero without footage behind it was a
                // blue button on a blue ground — the primary call to action was
                // literally invisible on /get-involved and /news-insights. A
                // white fill is the primary treatment inside a colour room.
                variant={cta.primary ? "white" : "outlineLight"}
                className="w-full sm:w-auto"
              >
                {cta.label}
              </Pill>
            ))}
          </div>
        )}
      </Container>

      {(stats.length > 0 || scrollTo) && (
        <Container
          className={`hero-rise mt-8 [animation-delay:380ms] lg:mt-16 ${
            // With no figures the only thing hanging off the rule is the scroll
            // cue, and that cue is desktop-only — so on a phone the whole band
            // would come out as a hairline with nothing under it.
            stats.length > 0 ? "" : "hidden lg:block"
          }`}
        >
          {/* One hairline across the measure, and the rail hangs off it. The
              same gesture the impact band uses on white: a single rule saying
              these figures are one statement, not three separate objects. */}
          <div className="flex items-end justify-between gap-8 border-t border-white-40 pt-5 lg:pt-8">
            {stats.length > 0 && (
              <dl className="grid flex-1 grid-cols-3 gap-x-4 sm:gap-x-8 lg:max-w-4xl">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1.5">
                    {/* The condensed face, as everywhere else numerals are set
                        large. Its whole licence in this system is impact
                        figures, and this is the first place a visitor meets
                        one. */}
                    <dt className="font-display text-[25px] leading-[0.95] font-semibold tracking-[-0.01em] text-white tabular-nums sm:text-[38px] lg:text-[46px]">
                      {stat.figure}
                    </dt>
                    <dd className="max-w-[24ch] text-xs leading-[1.35] text-white-94 sm:leading-snug lg:text-[13px]">
                      {stat.label}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {scrollTo && (
              // Desktop only. On a phone the gesture is the interface — nobody
              // needs telling a page scrolls — and the rail has no width to
              // spare there anyway.
              <a
                href={scrollTo}
                // `ml-auto` because `justify-between` only pushes this right
                // while the figures are there to push against it. With the rail
                // empty it is the sole child and would sit at the left edge.
                className="group ml-auto hidden shrink-0 items-center gap-4 pb-1 text-[11px] font-semibold tracking-[0.18em] text-white-94 transition-colors duration-300 hover:text-white lg:flex"
              >
                SCROLL
                {/* Unlit rule, lit segment falling down it. The overflow clip is
                    what makes it read as travel rather than as a blinking
                    dash. */}
                <span
                  className="relative block h-11 w-px overflow-hidden bg-white-40"
                  aria-hidden="true"
                >
                  <span className="hero-scroll-line absolute inset-x-0 top-0 block h-4 bg-white" />
                </span>
              </a>
            )}
          </div>
        </Container>
      )}
    </section>
  );
}
