import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import type { Img } from "@/cms/content/image";
import { getSection } from "@/cms/content/sections";

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
 *
 * BOTH HALVES ARE EDITABLE. The line and the picture were written into the page
 * files — eight of them across the site — so rewording a band, or replacing a
 * photograph that had stopped being the right one, meant a developer and a
 * deploy. Each band is a section now, keyed by where it sits, and reads its
 * line and its picture from the panel.
 *
 * The shipped photograph is the fallback rather than the default: it comes from
 * the build-time set, which has real dimensions and no library row to point at,
 * so it cannot live in the registry the way a caption can. Choosing one in the
 * panel replaces it. With neither, the band does not render — a scrim over blue
 * with a sentence on it is not the room this is.
 */
export async function PhotoBand({
  sectionKey,
  image,
}: {
  /** Its entry in the section registry — `photo:/what-we-do/journey`. */
  sectionKey: string;
  /** The photograph the page ships with, where there is one. */
  image?: Img | null;
}) {
  const copy = await getSection(sectionKey);
  const picture = copy.image ?? image;

  if (!picture) return null;

  return (
    <section className="static-bg relative isolate flex min-h-[38svh] items-end bg-blue py-14 lg:min-h-[46svh] lg:py-20">
      <Image
        src={picture.url}
        // Decorative: the line over it is the point, and the pages this sits on
        // say what they are in the headings above and below it.
        alt=""
        fill
        sizes="100vw"
        className="static-bg-image -z-20 object-cover"
      />
      <div className="hero-scrim absolute inset-0 -z-10" aria-hidden="true" />
      <div
        className="hero-scrim-edges absolute inset-0 -z-10"
        aria-hidden="true"
      />
      <div className="grain absolute inset-0 -z-10" aria-hidden="true" />

      {copy.heading && (
        <Container>
          <Reveal>
            <p className="max-w-[26ch] text-2xl leading-[1.25] font-bold tracking-[-0.02em] text-white lg:text-[34px]">
              {copy.heading}
            </p>
          </Reveal>
        </Container>
      )}
    </section>
  );
}
