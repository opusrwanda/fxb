import Image from "next/image";
import { Play } from "lucide-react";
import { Container } from "@/components/layout/container";
import { HeroSentinels } from "@/components/layout/hero-sentinels";
import { BackgroundVideo } from "@/components/ui/background-video";
import { Pill } from "@/components/ui/pill";
import { heroVideo } from "@/lib/media";

type Cta = { label: string; href: string; primary?: boolean };

/**
 * The hero room: full-bleed footage under a blue scrim.
 *
 * The scrim is not decoration — it is what guarantees the white headline and
 * the white header lockup clear contrast over arbitrary field footage. If a
 * clip is ever bright enough to break them, the scrim rises rather than the
 * lockup switching early.
 */
export function Hero({
  eyebrow,
  headline,
  body,
  ctas = [],
  withVideo = false,
}: {
  eyebrow?: string;
  headline: string;
  body?: string;
  ctas?: Cta[];
  withVideo?: boolean;
}) {
  return (
    // Exactly one viewport tall. Top padding clears the full rest-state header
    // — banner + utility strip + the 128px bar — and the content is sized to
    // fit inside what is left, so the section lands on 100svh rather than
    // growing past it. `min-h` rather than `h` so a very short or very narrow
    // device gets a taller hero instead of clipped copy.
    <section className="relative isolate flex min-h-svh flex-col justify-center overflow-hidden bg-blue pt-[9.25rem] pb-12 lg:pt-[14.75rem] lg:pb-16">
      <HeroSentinels />

      {withVideo && (
        <>
          {/* The poster is what actually paints and carries the LCP. Next
              serves it as AVIF/WebP at the right size for the viewport. */}
          <Image
            src={heroVideo.poster}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <BackgroundVideo
            large={heroVideo.large}
            small={heroVideo.small}
            poster={heroVideo.poster}
            className="absolute inset-0 -z-20 size-full object-cover"
          />

          {/* The scrim is load-bearing: it keeps white type legible over
              arbitrary footage, and it is why the video can be compressed
              hard. Neutral black rather than brand blue — a scrim reads as
              absence of light, not as a fifth colour in a four-value palette.
              Only over footage: a hero with no video stays a plain blue room.

              It is weakest through the middle so the footage reads, and held
              heavier at both ends where type has to survive: the transparent
              header at the top, the body copy and buttons at the bottom. */}
          <div
            className="absolute inset-0 -z-10 bg-linear-to-t from-black/70 via-black/40 to-black/65"
            aria-hidden="true"
          />
        </>
      )}

      <Container className="flex flex-col gap-6 lg:gap-8">
        {eyebrow && (
          <span className="flex w-fit items-center gap-2.5 rounded-full border border-white-40 px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-white lg:px-6 lg:py-3 lg:text-xs">
            <Play className="size-3.5 lg:size-4" aria-hidden="true" />
            {eyebrow}
          </span>
        )}

        <h1 className="max-w-[18ch] text-[38px] leading-[1.05] font-bold tracking-[-0.03em] text-white sm:text-[54px] lg:text-[82px] lg:leading-[1.02] xl:text-[100px]">
          {headline}
        </h1>

        {body && (
          <p className="max-w-[58ch] text-base leading-relaxed text-white-70 sm:text-[17px] lg:text-[19px]">
            {body}
          </p>
        )}

        {ctas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-3 lg:mt-4 lg:gap-4">
            {ctas.map((cta) => (
              <Pill
                key={cta.href}
                href={cta.href}
                size="lg"
                variant={cta.primary ? "primary" : "outlineLight"}
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
