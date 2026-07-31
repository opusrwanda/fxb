import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";

/**
 * Our Story — the timeline.
 *
 * The brief asks for this "displayed as a timeline diagram (progressive)". It
 * is progressive in the literal sense: a single hairline runs the full height
 * and each milestone arrives in sequence as the rule crosses the fold, so the
 * eye is walked down it rather than handed six paragraphs at once.
 *
 * Copy is transcribed from the content brief unchanged. The years are set in
 * Poppins, not the condensed display face — that face is scoped to impact
 * numerals, and a date is a heading, not a statistic.
 */

const milestones = [
  {
    year: "1986",
    body: "François-Xavier Bagnoud tragically lost his life during a humanitarian helicopter rescue mission in Mali. His legacy of courage and compassion would inspire the creation of FXB.",
  },
  {
    year: "1989",
    body: "Albina du Boisrouvray founded FXB International in memory of her son, François-Xavier Bagnoud, with the mission of fighting extreme poverty and improving the lives of vulnerable children and families worldwide.",
  },
  {
    year: "1995",
    body: "FXB International began its mission in Rwanda, responding to the aftermath of the 1994 Genocide against the Tutsi by supporting vulnerable children, widows, and families on their path to recovery and self-reliance.",
  },
  {
    year: "2000",
    body: "The FXBVillage model was introduced in Rwanda, providing a holistic approach to breaking the cycle of extreme poverty through interventions in health, education, nutrition, livelihoods, child protection, and WASH.",
  },
  {
    year: "2012",
    body: "FXB Rwanda became a registered Rwandan Non-Governmental Organization (NGO), reinforcing its long-term commitment to sustainable community development and child well-being across the country.",
  },
  {
    year: "Today",
    body: "FXB Rwanda operates across all four provinces of Rwanda and the City of Kigali, implementing integrated programmes in health, education, child protection, livelihoods and economic empowerment, nutrition, WASH, and climate resilience — reaching thousands of vulnerable children, families, and communities. FXB Rwanda is proudly part of the FXB Global network, maintaining its strong local identity while contributing to a shared global vision, common values, and the internationally recognised FXBVillage model.",
    current: true,
  },
];

export function OurStory() {
  return (
    <section id="story" className="scroll-mt-32 bg-white py-24 lg:py-32">
      <Container>
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-24">
          <Reveal className="lg:w-72 lg:shrink-0">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                OUR STORY
              </span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[40px] lg:leading-[1.1]">
              Four decades, one promise
            </h2>
            <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-gray">
              From a life lost on a rescue mission in Mali to a Rwandan NGO
              working in every province — the through line has never changed.
            </p>
          </Reveal>

          {/* The rule sits on the list itself rather than on each row, so it
              reads as one continuous line the milestones hang from. */}
          <ol className="relative flex-1 border-l border-gray-15 pl-8 sm:pl-12">
            {milestones.map((milestone, index) => (
              <Reveal
                as="li"
                key={milestone.year}
                delay={index * 80}
                className="relative pb-12 last:pb-0"
              >
                {/* Centred on the rule: half the dot's width, plus the border. */}
                <span
                  className={`absolute top-1.5 -left-[calc(2rem+0.3125rem)] size-2.5 rounded-full sm:-left-[calc(3rem+0.3125rem)] ${
                    milestone.current ? "bg-green" : "bg-blue"
                  }`}
                  aria-hidden="true"
                />

                <h3
                  className={`text-2xl font-bold tracking-[-0.02em] lg:text-[28px] ${
                    milestone.current ? "text-green" : "text-blue"
                  }`}
                >
                  {milestone.year}
                </h3>
                <p className="mt-3 max-w-[64ch] text-base leading-relaxed text-gray lg:text-[17px]">
                  {milestone.body}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
