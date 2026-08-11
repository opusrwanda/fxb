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
 * just read as a hole.
 *
 * The four figures that used to balance it — 1995, 4 provinces, 54 projects, 6
 * running — are gone by request. Two of them repeated something the reader had
 * already been told a moment earlier, and they were doing structural work as
 * much as editorial: they were what made the two columns end level.
 *
 * So the balance is structural now instead. The heading runs across the top,
 * the photograph and the prose sit side by side beneath it, and the plate is
 * `h-full` rather than a fixed ratio — the picture is exactly as tall as the
 * words beside it, whatever they say, and there is no leftover column to leave
 * empty. A floor stops it going squat if the copy is ever cut back further.
 *
 * The copy is condensed from Our Story in the content brief — the 1995 arrival,
 * the 2000 model, the 2012 registration, and where the work stands today. The
 * full timeline belongs on the Who We Are page, not here.
 */

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
        {/* Three children, not four. The heading runs the full measure, then
            the photograph and the words share the row under it.

            The stack on a phone is heading → photograph → prose, which is the
            order the old two-by-two was arranged to produce and the natural
            place for a picture to land: it opens the statement rather than
            closing it. Holding it after "Read our story" would read as the
            beginning of the next section. */}
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-12">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                WHO WE ARE
              </span>
            </div>
            <h2 className="mt-6 max-w-[20ch] text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
              Rooted here since 1995
            </h2>
          </Reveal>

          {/* The wedge, so the one photograph in a white room still carries the
              mark. `h-full` from `lg` and a 4:5 ratio below it: on a phone the
              ratio is the only thing sizing it, and on a desktop the row does —
              which is what keeps its bottom edge level with the last line of
              prose beside it. Capped in height on a phone, where a 4:5 crop at
              full width is 480px of an 844px screen for one supporting image. */}
          <Reveal delay={140} className="lg:col-span-5">
            <div className="wedge relative aspect-4/5 max-h-[60svh] overflow-hidden lg:aspect-auto lg:h-full lg:max-h-none lg:min-h-[26rem]">
              <Image
                src={story.url}
                alt="A man walking a boy in school uniform to the gates of his primary school"
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
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
            delay={280}
            className="flex flex-col items-start justify-center gap-7 lg:col-span-6 lg:col-start-7"
          >
            <p className="max-w-[34ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[30px]">
              A Rwandan NGO that began in the aftermath of the 1994 Genocide
              against the Tutsi, and never left.
            </p>

            <p className="max-w-[54ch] text-base leading-relaxed text-gray lg:text-[17px]">
              FXB International came to Rwanda in 1995 to walk with vulnerable
              children, widows and families on the road back to self-reliance.
              The FXBVillage model followed in 2000, and in 2012 we became a
              registered Rwandan NGO in our own right. Today we work across all
              four provinces and the City of Kigali — a local organisation
              carrying a global name, and the legacy of François-Xavier
              Bagnoud, into its fourth decade.
            </p>

            <Link
              href="/who-we-are"
              className="group mt-1 flex items-center gap-3 text-lg font-semibold text-blue"
            >
              Read our story
              <span className="flex size-9 items-center justify-center rounded-full border border-gray-15 transition-colors duration-500 group-hover:border-blue group-hover:bg-blue">
                <ArrowRight
                  className="size-4 transition-colors duration-500 group-hover:text-white"
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
