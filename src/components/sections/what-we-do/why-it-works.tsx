import Image from "next/image";
import { Container } from "@/components/layout/container";
import { SectionBand } from "@/components/layout/section-band";
import { getSection } from "@/cms/content/sections";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { sdgs } from "@/lib/sdg";

/**
 * Why the model works, and what it contributes to.
 *
 * The goals were ten tinted boxes reading "SDG 13 / Climate Action" in the
 * site's own type. That is a paraphrase of a mark that already exists: every
 * goal has an official tile carrying its number, its title and its colour, and
 * those tiles are recognised on sight by exactly the donors and institutional
 * partners this section is addressed to. Re-typesetting them in brand blue
 * threw away the recognition and gained nothing.
 *
 * They are drawn unaltered and untinted — see `lib/sdg.ts` for why that is a
 * requirement rather than a preference. Ten saturated colours are a long way
 * outside this site's four-value palette, and that is correct: they are
 * somebody else's marks, and the page is quoting them, not absorbing them.
 *
 * The set has gaps — 1, 2, 3, 4, 5, 6, 8, 13, 16, 17 — and the gaps matter:
 * this is the list FXB claims, not a run from one to seventeen.
 */
export async function WhyItWorks() {
  const copy = await getSection("what-we-do:why-it-works");
  return (
    <SectionBand section={copy} id="why-it-works" className="scroll-mt-36 bg-white py-24 lg:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                {copy.eyebrow}
              </span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
              {copy.heading}
            </h2>
          </Reveal>

          <Reveal delay={140} className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
            {copy.body && (
              <p className="max-w-[38ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[28px]">
                {copy.body}
              </p>
            )}

            <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
              Instead of addressing one challenge in isolation, the model
              recognises that lasting change requires coordinated action across
              multiple sectors. By empowering families with knowledge,
              resources, and opportunities, the model creates a foundation for
              long-term resilience and sustainable development.
            </p>

            <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
              This holistic approach not only improves immediate living
              conditions but also enables communities to continue progressing
              long after project interventions have ended.
            </p>
          </Reveal>
        </div>

        <Reveal delay={290} className="mt-20">
          <div className="h-px w-full bg-gray-15" aria-hidden="true" />

          <h3 className="mt-12 max-w-[30ch] text-[28px] font-bold tracking-[-0.02em] text-blue lg:text-[34px]">
            Contributing to national and global development
          </h3>
          <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
            The FXBVillage Model aligns with Rwanda&rsquo;s national development
            priorities and contributes to several Sustainable Development Goals.
          </p>

          {/* Square, and no radius. The wedge is this site's shape and these
              are not this site's marks — rounding the corners of an official
              tile crops its artwork, which is the one thing the guidelines
              rule out. Five across is what keeps the lettering inside each
              tile large enough to read at all. */}
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {sdgs.map((goal) => (
              <li key={goal.number}>
                <Image
                  src={goal.src}
                  // The number and title are inside the artwork, so the tile
                  // is content rather than decoration and carries a real
                  // description — at 200px the lettering on "Peace, Justice
                  // and Strong Institutions" is small enough that a reader may
                  // be relying on this instead.
                  alt={`Sustainable Development Goal ${goal.number}: ${goal.title}`}
                  width={goal.width}
                  height={goal.height}
                  sizes="(min-width: 1024px) 15vw, (min-width: 640px) 30vw, 45vw"
                  className="h-auto w-full"
                />
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-4">
            <Pill href="/our-impact" variant="primary" size="lg">
              Our Impact
            </Pill>
            <Pill href="/our-impact/stories" size="lg">
              Success Stories
            </Pill>
          </div>
        </Reveal>
      </Container>
    </SectionBand>
  );
}
