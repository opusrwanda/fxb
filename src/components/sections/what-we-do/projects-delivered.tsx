import { Container } from "@/components/layout/container";
import { Counter } from "@/components/ui/counter";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { projectsDelivered } from "@/lib/fxbvillage";

/**
 * FXBVillage projects implemented.
 *
 * One figure, and the two routes off it. The numeral is the condensed display
 * face doing the job it exists for, and it counts up on arrival like the
 * figures on the home page — the same `Counter`, so the behaviour under
 * reduced motion is the same too.
 */
export function ProjectsDelivered() {
  return (
    <section className="bg-blue py-24 lg:py-32">
      <Container>
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-20">
          <Reveal className="flex items-center gap-7">
            <span className="text-[64px] leading-none font-bold tracking-[-0.04em] text-white font-[family-name:var(--font-display)] lg:text-[110px]">
              <Counter value={projectsDelivered} />
            </span>
            <span className="max-w-[16ch] text-lg leading-snug font-semibold text-white lg:text-2xl">
              FXBVillage projects implemented
            </span>
          </Reveal>

          <Reveal delay={100} className="flex flex-col items-start gap-7">
            <p className="max-w-[46ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
              As of now, 54 FXBVillage projects have been implemented, leaving
              thousands of families resilient from poverty.
            </p>
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
