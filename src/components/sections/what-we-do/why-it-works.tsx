import { Container } from "@/components/layout/container";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { sdgs } from "@/lib/fxbvillage";

/**
 * Why the model works, and what it contributes to.
 *
 * The SDGs are a numbered set with gaps — 1, 2, 3, 4, 5, 6, 8, 13, 16, 17 —
 * and the gaps matter: this is the list FXB claims, not a run from one to
 * seventeen. Each goal keeps its own number rather than being re-indexed by
 * position, which is why they are rendered from the data rather than a loop
 * counter.
 */
export function WhyItWorks() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                WHY IT WORKS
              </span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
              Integrated, and people-centred
            </h2>
          </Reveal>

          <Reveal delay={80} className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
            <p className="max-w-[38ch] text-2xl leading-[1.4] font-medium text-blue lg:text-[28px]">
              The strength of the FXBVillage Model lies in its integrated and
              people-centred approach.
            </p>

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

        <Reveal delay={160} className="mt-20">
          <div className="h-px w-full bg-gray-15" aria-hidden="true" />

          <h3 className="mt-12 max-w-[30ch] text-2xl font-bold tracking-[-0.02em] text-blue lg:text-3xl">
            Contributing to national and global development
          </h3>
          <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
            The FXBVillage Model aligns with Rwanda&rsquo;s national development
            priorities and contributes to several Sustainable Development Goals.
          </p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {sdgs.map((goal) => (
              <li
                key={goal.number}
                className="wedge flex flex-col gap-2 bg-blue-08 p-5"
              >
                <span className="text-xs font-semibold tracking-[0.16em] text-gray-80">
                  SDG {goal.number}
                </span>
                <span className="text-[15px] leading-snug font-semibold text-blue">
                  {goal.title}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-4">
            <Pill href="/our-impact" variant="primary" size="lg">
              Our Impact
            </Pill>
            <Pill href="/our-impact/success-stories" size="lg">
              Success Stories
            </Pill>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
