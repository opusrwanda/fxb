import Image from "next/image";
import { Container } from "@/components/layout/container";
import { getSection } from "@/cms/content/sections";
import { Counter } from "@/components/ui/counter";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { getReach } from "@/cms/content/impact";
import { photo } from "@/lib/photos";

/**
 * FXBVillage projects implemented — the photographic band.
 *
 * This was a flat blue rectangle with a number on it, sitting between two other
 * flat rectangles on a page made entirely of them. The page's problem was never
 * any single section: it was ten rooms of eyebrow, heading and grey prose on
 * alternating grounds, with five photographs across ten thousand pixels. A page
 * about what an organisation does, containing almost no pictures of it being
 * done, reads as a document rather than a site.
 *
 * So this room stops being a colour and becomes a photograph. It is the natural
 * one to convert first: a number is the only content here, and a number wants a
 * ground rather than a column.
 *
 * The frame is a project closing ceremony in Rwamagana — participants and staff
 * standing together at the end of a village. That is what "54 implemented"
 * actually looks like, which is why it is this frame rather than a general field
 * photograph, and its lower third is empty paving, which is where the figure
 * sits.
 *
 * The numeral counts up on arrival like the figures on the home page — the same
 * `Counter`, so the behaviour under reduced motion is the same too.
 */
export async function ProjectsDelivered() {
  const copy = await getSection("what-we-do:projects-delivered");
  const { projectsDelivered } = await getReach();
  const image = photo("itap-closing-rwamagana-01");

  return (
    <section id="projects" className="static-bg relative isolate scroll-mt-36 bg-blue">
      <Image
        src={image.url}
        alt="Participants and staff standing together at the closing of an FXB Rwanda project in Rwamagana"
        fill
        sizes="100vw"
        className="static-bg-image -z-20 object-cover object-[50%_38%]"
      />
      <div className="band-scrim absolute inset-0 -z-10" aria-hidden="true" />
      <div className="grain absolute inset-0 -z-10" aria-hidden="true" />

      <Container className="py-24 lg:py-36">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
          <Reveal className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-[24px] font-semibold tracking-[0.14em] text-white">
                {copy.eyebrow}
              </span>
            </div>

            {/* Bigger than it was, because it can be now. On flat blue the
                numeral was competing with nothing and still only reached 110px;
                over a photograph it is the thing holding the frame together. */}
            <div className="flex items-end gap-6">
              <span className="font-display text-[86px] leading-[0.8] font-semibold tracking-[-0.02em] text-white tabular-nums lg:text-[150px]">
                <Counter value={projectsDelivered} />
              </span>
              <span className="max-w-[10ch] pb-2 text-lg leading-snug font-semibold text-white lg:text-2xl">
                projects implemented
              </span>
            </div>

            {/* Nothing by default — the figure is the heading here. Guarded so
                a heading typed in the panel has somewhere to land instead of
                being a field that does nothing. */}
            {copy.heading && (
              <h2 className="max-w-[24ch] text-3xl font-bold tracking-[-0.03em] text-white lg:text-[42px] lg:leading-[1.08]">
                {copy.heading}
              </h2>
            )}
          </Reveal>

          <Reveal delay={180} className="flex flex-col items-start gap-7">
            {copy.body && (
              <p className="max-w-[42ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
                {copy.body}
              </p>
            )}
            <div className="flex flex-wrap gap-4">
              <Pill
                href="/what-we-do/current-projects"
                variant="white"
                size="lg"
              >
                Current Projects
              </Pill>
              <Pill
                href="/what-we-do/phased-out-projects"
                variant="outlineLight"
                size="lg"
              >
                Phased-out Projects
              </Pill>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
