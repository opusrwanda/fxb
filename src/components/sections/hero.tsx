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

/**
 * The hero room: full-bleed footage under a shaped scrim.
 *
 * The scrim is not decoration — it is what guarantees the white headline and
 * the white header lockup clear contrast over arbitrary field footage. If a
 * clip is ever bright enough to break them, the scrim rises rather than the
 * lockup switching early. Its geometry is documented in `globals.css`.
 *
 * The room is built in two bands, not one block:
 *
 *   top     the header, drawn straight onto the footage
 *   middle  the argument — eyebrow, headline, body, actions
 *
 * There used to be a third: a hairline across the measure carrying three
 * figures and a scroll cue. Home was the only page that ever set it, and it is
 * gone by request, so the props and the band went with it rather than staying
 * as an unused branch. If a fold-level rail is ever wanted again it wants
 * rebuilding against whatever the page needs then.
 */
export function Hero({
  eyebrow,
  headline,
  body,
  ctas = [],
  withVideo = false,
  image,
  video,
  breadcrumbs = [],
}: {
  eyebrow?: string;
  headline: string;
  body?: string;
  ctas?: Cta[];
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
   * Footage behind the room, uploaded through Page banners.
   *
   * Only ever alongside `image`, which stays as the poster — `getPageBanner`
   * drops a video that has no still, because the still is what paints first
   * and what a visitor on Save-Data or reduced motion is left with.
   */
  video?: { url: string; type: string } | null;
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
  const backdrop = !withVideo && image && !video ? image : null;

  // An uploaded banner video plays over its own still, the same arrangement the
  // home page's CDN footage uses — one plate, poster underneath, video fading
  // in over it once the browser is idle and the connection allows.
  const banner = !withVideo && video && image ? { video, image } : null;
  return (
    // Exactly one viewport tall. Top padding clears the full rest-state header
    // — banner + utility strip + the 128px bar — and the content is sized to
    // fit inside what is left, so the section lands on 100svh rather than
    // growing past it. `min-h` rather than `h` so a very short or very narrow
    // device gets a taller hero instead of clipped copy.
    //
    // Mobile top padding is 136px against a 96px mobile bar, rather than the
    // 148px the desktop utility strip needs. That 12px was bought back for the
    // figure rail on a 375×667 phone, which was the one viewport where the
    // height budget did not close. The rail is gone and the budget is no longer
    // tight, but the clearance is still correct against the shorter mobile bar,
    // so it stays.
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

      {banner && (
        <>
          <div className="hero-drift absolute inset-0 -z-20">
            <Image
              src={banner.image.url}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <BackgroundVideo
              src={banner.video}
              className="absolute inset-0 size-full object-cover"
            />
          </div>

          {/* The same scrims the home page's footage gets. A moving picture
              behind white type needs them more than a still does, not less. */}
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

      {/* `my-auto` on the sole child, which now centres it in the section the
          same way `justify-center` would. Kept as-is: it was the correct form
          when a rail sat below it, and it is the correct form if one ever
          returns. */}
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

    </section>
  );
}
