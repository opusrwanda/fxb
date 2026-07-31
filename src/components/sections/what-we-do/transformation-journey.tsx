import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import { journey } from "@/lib/fxbvillage";

/**
 * The 36-month transformation journey.
 *
 * The brief asks for a progressive timeline diagram. On desktop it runs
 * horizontally — four phases along one rule, which is the shape that says
 * "journey" rather than "list" — and each phase rises in turn as the band
 * crosses the fold. Below `lg` the rule turns vertical, because four columns of
 * body copy on a phone is four columns of two-word lines.
 *
 * The step numerals are set in the condensed display face. They are the one
 * thing on this page that face is for: figures, large, doing structural work.
 */
export function TransformationJourney() {
  return (
    <section className="bg-blue py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-white-70" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.14em] text-white-94">
              TRANSFORMATION JOURNEY
            </span>
          </div>
          <h2 className="max-w-[22ch] text-3xl font-bold tracking-[-0.03em] text-white lg:text-[42px] lg:leading-[1.08]">
            36 months to change a life, sustainably
          </h2>
          <p className="max-w-[58ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
            A complete 36-month journey toward dignity, access to fundamental
            rights, and lasting change for children and families.
          </p>
        </Reveal>

        <ol className="mt-16 grid gap-y-10 lg:grid-cols-4 lg:gap-x-8">
          {journey.map((phase, index) => (
            <Reveal
              as="li"
              key={phase.step}
              delay={60 + Math.min(index, 3) * 60}
              className="relative flex gap-6 lg:flex-col lg:gap-0"
            >
              {/* The rule: a vertical spine on narrow screens, and the
                  horizontal track the phases hang from at `lg`. It stops short
                  on the last phase so the line ends with the journey. */}
              <span
                className={`absolute bg-white-12 ${
                  index === journey.length - 1
                    ? "left-6 top-12 hidden h-0 w-0 lg:block lg:h-px lg:w-0"
                    : "left-6 top-12 bottom-0 w-px lg:top-6 lg:left-12 lg:h-px lg:w-full"
                }`}
                aria-hidden="true"
              />

              <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-blue font-[family-name:var(--font-display)]">
                {phase.step}
              </span>

              <div className="pb-2 lg:mt-8">
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-white lg:text-xl">
                  {phase.period}
                </h3>
                <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-white-94">
                  {phase.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
