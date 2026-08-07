import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import type { Img } from "@/cms/content/image";

/**
 * A full-bleed photograph with one line over it.
 *
 * For the pages that are almost entirely words. Partner With Us runs 8,000
 * pixels on 598 words and one picture; Careers, Procurement and Donate are
 * shorter but no less bare. A reader scrolling any of them meets nothing but
 * type from the hero to the footer.
 *
 * It carries a line rather than being decoration alone. A photograph dropped
 * into a page to break up the text is a photograph a reader learns to skip; one
 * that says something is a place they slow down. The line is short by
 * construction — this is a breath between sections, not a section.
 *
 * The same treatment the hero uses, deliberately: the shaped scrim and the
 * grain, so white type clears whatever the photograph turns out to be, and so a
 * band in the middle of a page reads as the same room as the one at the top of
 * it. Its geometry is documented in globals.css.
 */
export function PhotoBand({
  image,
  children,
}: {
  image: Img;
  /** One sentence. Two is a section, and a section wants a heading. */
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate flex min-h-[38svh] items-end overflow-hidden bg-blue py-14 lg:min-h-[46svh] lg:py-20">
      <Image
        src={image.url}
        // Decorative: the line over it is the point, and the pages this sits on
        // say what they are in the headings above and below it.
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div className="hero-scrim absolute inset-0 -z-10" aria-hidden="true" />
      <div
        className="hero-scrim-edges absolute inset-0 -z-10"
        aria-hidden="true"
      />
      <div className="grain absolute inset-0 -z-10" aria-hidden="true" />

      {children && (
        <Container>
          <Reveal>
            <p className="max-w-[26ch] text-2xl leading-[1.25] font-bold tracking-[-0.02em] text-white lg:text-[34px]">
              {children}
            </p>
          </Reveal>
        </Container>
      )}
    </section>
  );
}
