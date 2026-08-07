import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import { photo } from "@/lib/photos";

/**
 * Who We Are — the quiet room.
 *
 * It follows the hero deliberately underweight: white ground, one statement,
 * one photograph, one link. A loud room is always followed by a quiet one, and
 * this is the pause that makes the blue room below it land.
 *
 * Quiet is not the same as empty, which is what it had become. The label column
 * held an eyebrow and a two-line heading and then five hundred pixels of
 * nothing — a third of the page width, blank, immediately after a full-viewport
 * video. `lg:sticky` was supposed to earn that space, but the section is not
 * tall enough for anything to stick to, so it never travelled and the column
 * just read as a hole. The photograph finishes the column, and the figures move
 * under the prose so the two columns end within twenty pixels of each other.
 *
 * The copy is condensed from Our Story in the content brief — the 1995 arrival,
 * the 2000 model, the 2012 registration, and where the work stands today. The
 * full timeline belongs on the Who We Are page, not here.
 */

/**
 * Counts drawn from the content brief and the Brand Guiding Tool.
 *
 * Two of these repeat something the reader has already been told: 1995 is in
 * the heading directly above the grid, and 54 is in the hero rail one screen
 * up. Both are worth a decision before launch — see the note in the handover.
 */
const figures = [
  ["1995", "Working in Rwanda since"],
  ["4", "Provinces, plus Kigali"],
  ["54", "FXBVillage projects delivered"],
  ["6", "Projects running today"],
];

/**
 * The only portrait in the supplied library, and it happens to be the one
 * frame that illustrates the sentence beside it: a man walking a boy to his
 * school gate is what "walk with vulnerable children and families on the road
 * back to self-reliance" looks like. Framed low — the original carries a large
 * empty sky that a centred crop would spend the column on.
 */
const STORY_PHOTO = "fxbvillage-tlf-05";

export function WhoWeAre() {
  const story = photo(STORY_PHOTO);

  return (
    <section id="who-we-are" className="bg-white py-24 lg:py-32">
      <Container>
        {/* Four children on an explicit two-by-two, so the stack order on a
            phone is not the column order on a desktop.

            The split falls between the standfirst and the paragraph under it,
            and that is what makes both orders work. On a desktop it puts the
            label and the standfirst on one row and the photograph and the rest
            of the prose on the next, so the photograph starts level with the
            body copy instead of hanging 190px below a two-line heading. On a
            phone the same split reads statement → photograph → detail, which is
            the natural place for a picture to land. Holding the photograph in
            the label column instead would have dropped it between the heading
            and the sentence it illustrates; leaving it last put it after "Read
            our story", where it read as the opening of the next section. */}
        <div className="grid gap-x-10 gap-y-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4 lg:row-start-1">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                WHO WE ARE
              </span>
            </div>
            <h2 className="mt-6 text-[60px] leading-[1.08] font-bold tracking-[-0.03em] text-blue lg:text-[84px]">
              Rooted here since 1995
            </h2>
          </Reveal>

          <Reveal delay={80} className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
            <p className="max-w-[38ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[32px]">
              A Rwandan NGO that began in the aftermath of the 1994 Genocide
              against the Tutsi, and never left.
            </p>
          </Reveal>

          {/* The wedge, so the one photograph in a white room still carries the
              mark. Capped in height on a phone, where a 4:5 crop at full width
              is 480px of an 844px screen for a single supporting image. */}
          <Reveal
            delay={160}
            className="lg:col-span-4 lg:col-start-1 lg:row-start-2"
          >
            <div className="wedge relative aspect-4/5 max-h-[60svh] overflow-hidden lg:max-h-none">
              <Image
                src={story.url}
                alt="A man walking a boy in school uniform to the gates of his primary school"
                fill
                sizes="(min-width: 1024px) 32vw, 90vw"
                // Framed hard to the bottom of the plate. The original is
                // roughly a third empty sky, and a hazy white sky against a
                // white page has no edge — the top corners of the frame simply
                // dissolved and the photograph read as though it had failed to
                // load. Cropping to the ground keeps the frame legible as an
                // object and puts the two figures where the column wants them.
                className="object-cover object-[50%_92%]"
              />
            </div>
          </Reveal>

          <Reveal
            delay={240}
            className="flex flex-col items-start gap-9 lg:col-span-7 lg:col-start-6 lg:row-start-2"
          >
            <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
              FXB International came to Rwanda in 1995 to walk with vulnerable
              children, widows and families on the road back to self-reliance.
              The FXBVillage model followed in 2000, and in 2012 we became a
              registered Rwandan NGO in our own right. Today we work across all
              four provinces and the City of Kigali — a local organisation
              carrying a global name, and the legacy of François-Xavier
              Bagnoud, into its fourth decade.
            </p>

            <div className="h-px w-full bg-gray-15" aria-hidden="true" />

            {/* Two by two, not four across. In a seven-column measure four
                figures got 170px each and every label but one wrapped, so the
                row came out ragged along the bottom. Half as many columns is
                twice the width, which is enough for each label to sit on a
                single line, and the second row is height this column needed
                anyway to finish level with the photograph. */}
            <dl className="grid w-full grid-cols-2 gap-x-8 gap-y-10">
              {figures.map(([figure, label]) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <dt className="text-3xl font-bold tracking-[-0.04em] text-blue lg:text-4xl">
                    {figure}
                  </dt>
                  <dd className="text-sm leading-snug text-gray">{label}</dd>
                </div>
              ))}
            </dl>

            <Link
              href="/who-we-are"
              className="group flex items-center gap-3 text-lg font-semibold text-blue"
            >
              Read our story
              <span className="flex size-9 items-center justify-center rounded-full border border-gray-15 transition-colors duration-300 group-hover:border-blue group-hover:bg-blue">
                <ArrowRight
                  className="size-4 transition-colors duration-300 group-hover:text-white"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
